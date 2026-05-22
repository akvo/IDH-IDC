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
      title="Breakdown of closing the gap"
      bordered
      exportElementRef={elementRef}
      exportFilename="Breakdown of closing the gap"
      tooltipText="This graph shows how effective the selected third driver is in helping close the income gap."
    >
      <Row gutter={[40, 20]} align="middle">
        <Col xs={24} md={12} style={{ padding: "12px 12px 12px 32px" }}>
          <p>
            This graph shows how effective the selected third driver is in
            helping close the income gap. It does this by counting how many
            combinations of the three selected drivers result in the income gap
            being fully or partially closed while staying within feasible
            levels.
          </p>
          <p>
            Use this graph to judge how likely it is that changes in these three
            drivers can realistically close the income gap. If only a small
            number of successful combinations fall within feasible ranges for
            all three drivers, it may be better to try modelling with different
            drivers instead.
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
