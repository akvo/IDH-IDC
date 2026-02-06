import React, { useMemo } from "react";
import { CaseVisualState } from "../store";
import { Space } from "antd";
import { thousandFormatter } from "../../../components/chart/options/common";
import { generateCombinations } from "../../../lib/threeDriverCalculations";

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
    return generateCombinations({
      thirdDriver,
      xAxisDriver,
      yAxisDriver,
      segmentData,
      sensitivityAnalysis,
      selectedSegment,
      xSteps: 5,
      ySteps: 4,
    });
  }, [
    thirdDriver,
    xAxisDriver,
    yAxisDriver,
    segmentData,
    sensitivityAnalysis,
    selectedSegment,
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
              <span
                className={`value ${
                  row.isYFeasible ? "feasible" : "not-feasible"
                }`}
              >
                {thousandFormatter(row.yValue, 2)} {yAxisDriver.unitName}
              </span>
            </div>
            <div className="card-body">
              <div className="combination-flex-wrapper">
                <div className="side-labels">
                  <div className="side-label-item">
                    And {xAxisDriver.name} is:
                  </div>
                  <div className="side-label-item">
                    Then {thirdDriver.name} has to be:
                  </div>
                </div>
                <div className="value-columns-flex">
                  {row.cols.map((col, colIdx) => (
                    <div key={colIdx} className="value-column">
                      <div
                        className={`value-box x-value ${
                          col.isXFeasible ? "feasible" : "not-feasible"
                        }`}
                      >
                        {thousandFormatter(col.xValue, 2)}
                        {/* Disable unit name for now, not looking good in small screen */}
                        {/* {xAxisDriver.unitName} */}
                      </div>
                      <div
                        className={`value-box third-value ${
                          col.isThirdFeasible ? "feasible" : "not-feasible"
                        }`}
                      >
                        {thousandFormatter(col.thirdValue, 2)}
                        {/* Disable unit name for now, not looking good in small screen */}
                        {/* {thirdDriver.unitName} */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="chart-legend">
          <Space size={24} align="center">
            <Space align="center">
              <div className="legend-pips feasible" />
              <span>Driver within feasible ranges</span>
            </Space>
            <Space align="center">
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
