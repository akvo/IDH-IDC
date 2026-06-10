import React, { useMemo, useRef } from "react";
import { Row, Col } from "antd";
import { VisualCardWrapper } from "../components";
import { CaseVisualState } from "../store";
import { generateCombinations } from "../../../lib/threeDriverCalculations";
import Chart from "../../../components/chart";

const GapClosingPieChart = ({
  selectedSegment,
  thirdDriver,
  xAxisDriver,
  yAxisDriver,
}) => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);
  const elementRef = useRef(null);

  const segmentData = useMemo(() => {
    return dashboardData.find((s) => s.id === selectedSegment);
  }, [dashboardData, selectedSegment]);

  // If driver has no formula, it will return null combinations.
  // We check this upfront to avoid unnecessary work.
  const hasFormula = useMemo(() => {
    if (!thirdDriver) {
      return false;
    }
    const combinations = generateCombinations({
      thirdDriver,
      xAxisDriver,
      yAxisDriver,
      segmentData,
      sensitivityAnalysis,
      selectedSegment,
      xSteps: 1,
      ySteps: 1,
    });
    return combinations.length > 0 && combinations[0].cols.length > 0;
  }, [
    thirdDriver,
    xAxisDriver,
    yAxisDriver,
    segmentData,
    sensitivityAnalysis,
    selectedSegment,
  ]);

  const combinationSummary = useMemo(() => {
    const combinations = generateCombinations({
      thirdDriver,
      xAxisDriver,
      yAxisDriver,
      segmentData,
      sensitivityAnalysis,
      selectedSegment,
      xSteps: 10,
      ySteps: 10,
    });

    if (!combinations.length) {
      return null;
    }

    let allFeasible = 0;
    let twoFeasible = 0;
    let oneFeasible = 0;
    let zeroFeasible = 0;

    combinations.forEach((row) => {
      row.cols.forEach((col) => {
        if (col.feasibleCount === 3) {
          allFeasible++;
        } else if (col.feasibleCount === 2) {
          twoFeasible++;
        } else if (col.feasibleCount === 1) {
          oneFeasible++;
        } else {
          zeroFeasible++;
        }
      });
    });

    return [
      {
        name: "All three drivers fall within feasible ranges",
        value: allFeasible,
        color: "#49D985",
        order: 1,
      },
      {
        name: "One driver falls outside of feasible ranges",
        value: twoFeasible,
        color: "#FED754",
        order: 2,
      },
      {
        name: "Two drivers fall outside of feasible ranges",
        value: oneFeasible,
        color: "#FF7875",
        order: 3,
      },
      {
        name: "All drivers fall outside of feasible ranges",
        value: zeroFeasible,
        color: "#FF4D4F",
        order: 4,
      },
    ].filter((v) => v.value > 0);
  }, [
    thirdDriver,
    xAxisDriver,
    yAxisDriver,
    segmentData,
    sensitivityAnalysis,
    selectedSegment,
  ]);

  const greenPercentage = useMemo(() => {
    if (!combinationSummary) {
      return 0;
    }
    const allFeasibleItem = combinationSummary.find(
      (item) => item.color === "#49D985"
    );
    const allFeasible = allFeasibleItem ? allFeasibleItem.value : 0;
    const total = combinationSummary.reduce((sum, item) => sum + item.value, 0);
    return total > 0 ? Math.round((allFeasible / total) * 100) : 0;
  }, [combinationSummary]);

  if (
    !hasFormula ||
    !combinationSummary ||
    combinationSummary.length === 0 ||
    !xAxisDriver ||
    !yAxisDriver
  ) {
    return null;
  }

  return (
    <VisualCardWrapper
      title="Effectiveness of the Third Driver in Closing the Income Gap"
      bordered
      exportElementRef={elementRef}
      exportFilename="Effectiveness of the Third Driver in Closing the Income Gap"
      tooltipText="The chart evaluates multiple combinations of the three selected drivers and calculates the proportion that result in the income gap being fully or partially closed, while indicating whether each combination stays within feasible ranges for all drivers."
    >
      <Row gutter={[40, 20]} align="middle">
        <Col xs={24} md={12} style={{ padding: "12px 12px 12px 32px" }}>
          <h4
            style={{
              color: "#01625f",
              fontFamily: "RocGrotesk",
              fontSize: "16px",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "24px",
            }}
          >
            Which third driver is most effective for closing the income gap?
          </h4>
          <p>
            This chart shows the gap-closing success rate of combinations of the
            three selected income drivers. A third driver is added to the two
            drivers carried forward from the heat map by toggling through
            options from the down-drop. This helps compare which potential third
            driver creates the most feasible pathway to closing the income gap,
            by showing how frequently realistic combinations of all three
            drivers achieve the target. A larger share of combinations within
            feasible ranges (green slices of the chart) indicates that the
            selected third driver is more effective in helping close the income
            gap alongside the other two drivers.
          </p>
          <p>
            In this case, {greenPercentage}% of tested combinations close the
            income gap with all drivers within feasible levels.
          </p>
        </Col>
        <Col
          xs={24}
          md={12}
          style={{
            padding: "12px",
            borderLeft: "1px solid #e2e4e9",
          }}
        >
          <Chart
            wrapper={false}
            type="PIE"
            data={combinationSummary}
            percentage={true}
            extra={{
              tooltip: {
                formatter: '<div class="no-border">{b}: {d}%</div>',
              },
            }}
          />
        </Col>
      </Row>
    </VisualCardWrapper>
  );
};

export default GapClosingPieChart;
