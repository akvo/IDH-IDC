import { yAxisFormula } from "./formula";
import { getFunctionDefaultValue } from "./index";

/**
 * Calculates the required value for the third driver to reach a target income,
 * and determines feasibility for all three involved drivers.
 */
export const calculateRequiredThirdDriver = ({
  driverMap,
  xAxisDriver,
  yAxisDriver,
  thirdDriver,
  target,
  diversified,
  xVal,
  yVal,
}) => {
  const formula = yAxisFormula[`#${thirdDriver.qid}`];
  if (!formula) {
    return null;
  }

  // Prepare values for formula
  const values = Object.values(driverMap).map((d) => {
    let val = d.current;
    if (d.name === xAxisDriver.name) {
      val = xVal;
    }
    if (d.name === yAxisDriver.name) {
      val = yVal;
    }
    return { id: `line-${d.qid}`, value: val };
  });

  // Add special IDs
  values.push({ id: "line-9001", value: target });

  let divVal = diversified;
  if (xAxisDriver.name === "Diversified Income") {
    divVal = xVal;
  }
  if (yAxisDriver.name === "Diversified Income") {
    divVal = yVal;
  }
  values.push({ id: "line-9002", value: divVal });

  const requiredThirdValue = getFunctionDefaultValue(
    { default_value: formula },
    "line",
    values
  );

  // Check feasibility
  const isXFeasible =
    xAxisDriver.current < xAxisDriver.feasible
      ? xVal >= xAxisDriver.current && xVal <= xAxisDriver.feasible
      : xVal <= xAxisDriver.current && xVal >= xAxisDriver.feasible;

  const isYFeasible =
    yAxisDriver.current < yAxisDriver.feasible
      ? yVal >= yAxisDriver.current && yVal <= yAxisDriver.feasible
      : yVal <= yAxisDriver.current && yVal >= yAxisDriver.feasible;

  const isThirdFeasible =
    thirdDriver.current < thirdDriver.feasible
      ? requiredThirdValue >= thirdDriver.current &&
        requiredThirdValue <= thirdDriver.feasible
      : requiredThirdValue <= thirdDriver.current &&
        requiredThirdValue >= thirdDriver.feasible;

  return {
    xValue: xVal,
    isXFeasible,
    yValue: yVal,
    isYFeasible,
    thirdValue: requiredThirdValue,
    isThirdFeasible,
    feasibleCount: [isXFeasible, isYFeasible, isThirdFeasible].filter(Boolean)
      .length,
  };
};

/**
 * Generates a grid of combinations for three-driver analysis.
 */
export const generateCombinations = ({
  thirdDriver,
  xAxisDriver,
  yAxisDriver,
  segmentData,
  sensitivityAnalysis,
  selectedSegment,
  xSteps = 5,
  ySteps = 4,
}) => {
  if (!thirdDriver || !xAxisDriver || !yAxisDriver || !segmentData) {
    return [];
  }

  const adjustedTarget =
    sensitivityAnalysis?.config?.[`${selectedSegment}_adjusted-target`] || 0;
  const target = adjustedTarget || segmentData.target || 0;
  const diversified = segmentData.total_current_diversified_income || 0;

  const answers = segmentData.answers
    .filter((s) => s.question?.parent_id === 1 && s.commodityFocus)
    .map((s) => ({
      qid: s.question.id,
      name: s.question.text,
      value: s.name === "current" ? s.value : 0,
      current: s.name === "current" ? s.value : 0,
      feasible: s.name === "feasible" ? s.value : 0,
    }));

  const driverMap = answers.reduce((acc, curr) => {
    if (!acc[curr.qid]) {
      acc[curr.qid] = { ...curr };
    }
    if (curr.current) {
      acc[curr.qid].current = curr.current;
    }
    if (curr.feasible) {
      acc[curr.qid].feasible = curr.feasible;
    }
    return acc;
  }, {});

  const getXAxisValue = (i) => {
    const configMin =
      sensitivityAnalysis?.config?.[`${selectedSegment}_x-axis-min-value`];
    const configMax =
      sensitivityAnalysis?.config?.[`${selectedSegment}_x-axis-max-value`];

    const min =
      typeof configMin !== "undefined" ? configMin : xAxisDriver.current;
    const max =
      typeof configMax !== "undefined" ? configMax : xAxisDriver.feasible;
    return min + (i * (max - min)) / (xSteps - 1);
  };

  const getYAxisValue = (i) => {
    const configMin =
      sensitivityAnalysis?.config?.[`${selectedSegment}_y-axis-min-value`];
    const configMax =
      sensitivityAnalysis?.config?.[`${selectedSegment}_y-axis-max-value`];

    const min =
      typeof configMin !== "undefined" ? configMin : yAxisDriver.current;
    const max =
      typeof configMax !== "undefined" ? configMax : yAxisDriver.feasible;
    return min + (i * (max - min)) / (ySteps - 1);
  };

  const results = [];
  for (let yIdx = 0; yIdx < ySteps; yIdx++) {
    const yVal = getYAxisValue(yIdx);
    const isYFeasible =
      yAxisDriver.current < yAxisDriver.feasible
        ? yVal >= yAxisDriver.current && yVal <= yAxisDriver.feasible
        : yVal <= yAxisDriver.current && yVal >= yAxisDriver.feasible;

    const row = {
      yValue: yVal,
      isYFeasible,
      cols: [],
    };

    for (let xIdx = 0; xIdx < xSteps; xIdx++) {
      const xVal = getXAxisValue(xIdx);
      const res = calculateRequiredThirdDriver({
        driverMap,
        xAxisDriver,
        yAxisDriver,
        thirdDriver,
        target,
        diversified,
        xVal,
        yVal,
      });
      if (res) {
        row.cols.push(res);
      }
    }
    results.push(row);
  }

  return results;
};
