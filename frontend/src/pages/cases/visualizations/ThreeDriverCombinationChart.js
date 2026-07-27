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
      <div className="combination-cards-grid">
        {combinations.map((row, rowIdx) => (
          <div key={rowIdx} className="combination-card">
            {/* If Section */}
            <div className="row-label">If {yAxisDriver.name} is:</div>
            <div className="value-pill-if">
              <div
                className={`value-blob ${
                  row.isYFeasible ? "feasible" : "not-feasible"
                }`}
              >
                {thousandFormatter(row.yValue, 2)} {yAxisDriver.unitName}
              </div>
            </div>

            {/* And Section */}
            <div className="row-label indented-label">
              And {xAxisDriver.name} is:
            </div>
            <div className="values-wrapper">
              {row.cols.map((col, colIdx) => (
                <div key={`x-${colIdx}`} className="grid-tag">
                  <div
                    className={`value-blob ${
                      col.isXFeasible ? "feasible" : "not-feasible"
                    }`}
                  >
                    {thousandFormatter(col.xValue, 2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Then Section */}
            <div className="row-label indented-label">
              Then {thirdDriver.name} has to be:
            </div>
            <div className="values-wrapper">
              {row.cols.map((col, colIdx) => (
                <div key={`third-${colIdx}`} className="grid-tag">
                  <div
                    className={`value-blob ${
                      col.isThirdFeasible ? "feasible" : "not-feasible"
                    }`}
                  >
                    {thousandFormatter(col.thirdValue, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreeDriverCombinationChart;
