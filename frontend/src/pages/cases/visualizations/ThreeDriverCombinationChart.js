import React, { useMemo } from "react";
import { CaseVisualState } from "../store";
import { getFunctionDefaultValue } from "../../../lib";
import { yAxisFormula } from "../../../lib/formula";
import { Row, Col, Space } from "antd";
import { thousandFormatter } from "../../../components/chart/options/common";

const ThreeDriverCombinationChart = ({
  selectedSegment,
  thirdDriver,
  xAxisDriver,
  yAxisDriver,
}) => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);

  const segmentData = useMemo(() => {
    return dashboardData.find((s) => s.id === selectedSegment);
  }, [dashboardData, selectedSegment]);

  const combinations = useMemo(() => {
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
        value: s.name === "current" ? s.value : 0, // default to current
        current: s.name === "current" ? s.value : 0,
        feasible: s.name === "feasible" ? s.value : 0,
      }));

    // Group answers by qid to have current/feasible in one object
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
      return min + (i * (max - min)) / 4;
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
      return min + (i * (max - min)) / 3;
    };

    const formula = yAxisFormula[`#${thirdDriver.qid}`];
    if (!formula) {
      return [];
    }

    const results = [];
    for (let yIdx = 0; yIdx < 4; yIdx++) {
      const yVal = getYAxisValue(yIdx);
      const row = {
        yValue: yVal,
        cols: [],
      };

      for (let xIdx = 0; xIdx < 5; xIdx++) {
        const xVal = getXAxisValue(xIdx);

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
        values.push({ id: "line-9002", value: diversified });

        const requiredThirdValue = getFunctionDefaultValue(
          { default_value: formula },
          "line",
          values
        );

        // Check if within feasible ranges
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

        row.cols.push({
          xValue: xVal,
          thirdValue: requiredThirdValue,
          isAllFeasible: isXFeasible && isYFeasible && isThirdFeasible,
        });
      }
      results.push(row);
    }

    return results;
  }, [
    thirdDriver,
    xAxisDriver,
    yAxisDriver,
    segmentData,
    selectedSegment,
    sensitivityAnalysis?.config,
  ]);

  if (!combinations.length) {
    return null;
  }

  return (
    <div className="three-driver-combination-chart">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {combinations.map((row, rowIdx) => (
          <div key={rowIdx} className="combination-card">
            <div className="card-header">
              <span className="label">If {yAxisDriver.name} is:</span>
              <span className="value">
                {thousandFormatter(row.yValue, 2)} {yAxisDriver.unitName}
              </span>
            </div>
            <div className="card-body">
              <Row gutter={12}>
                <Col span={4} className="side-labels">
                  <div className="side-label-item">
                    And {xAxisDriver.name} is:
                  </div>
                  <div className="side-label-item">
                    Then {thirdDriver.name} has to be:
                  </div>
                </Col>
                <Col span={20}>
                  <Row gutter={8}>
                    {row.cols.map((col, colIdx) => (
                      <Col key={colIdx} span={4}>
                        <div className="value-box x-value">
                          {thousandFormatter(col.xValue, 2)}
                        </div>
                        <div
                          className={`value-box third-value ${
                            col.isAllFeasible ? "feasible" : "not-feasible"
                          }`}
                        >
                          {thousandFormatter(col.thirdValue, 2)}
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </div>
          </div>
        ))}

        <div className="chart-legend">
          <Space size={24}>
            <Space>
              <div className="legend-pips feasible" />
              <span>Driver within feasible ranges</span>
            </Space>
            <Space>
              <div className="legend-pips not-feasible" />
              <span>Driver outside feasible ranges</span>
            </Space>
          </Space>
        </div>
      </Space>
    </div>
  );
};

export default ThreeDriverCombinationChart;
