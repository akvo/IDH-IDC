import React, { useMemo, useState, useRef } from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";
import { CaseVisualState, CurrentCaseState } from "../store";
import Chart from "../../../components/chart";
import { getColumnStackBarOptions } from "../../../components/chart/lib";

const seriesTmp = [
  {
    key: "total_current_income",
    name: "Current Household Income",
    type: "bar",
    stack: "current",
    color: "#1b726f",
  },
  {
    key: "total_feasible_income",
    name: "Feasible Household Income",
    type: "bar",
    stack: "feasible",
    color: "#9cc2c1",
  },
  {
    key: "current_income_gap",
    name: "Current Income Gap",
    type: "bar",
    stack: "current",
    color: "#fecb21",
  },
  {
    key: "feasible_income_gap",
    name: "Feasible Income Gap",
    type: "bar",
    stack: "feasible",
    color: "#ffeeb8",
  },
  {
    key: "target",
    name: "Income Target",
    type: "line",
    symbol: "diamond",
    symbolSize: 15,
    color: "#000",
  },
];

const ChartIncomeGap = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [showLabel, setShowLabel] = useState(false);
  const chartIncomeGapRef = useRef(null);

  const chartData = useMemo(() => {
    return seriesTmp.map((tmp) => {
      const data = dashboardData.map((d) => {
        let value = d?.[tmp.key] ? d[tmp.key] : 0;
        if (tmp.key === "current_income_gap") {
          const currentIncomeGap =
            d.target - d.total_current_income < 0
              ? 0
              : d.target - d.total_current_income;
          value = currentIncomeGap;
        }
        if (tmp.key === "feasible_income_gap") {
          const feasibleIncomeGap =
            d.target - d.total_feasible_income < 0
              ? 0
              : d.target - d.total_feasible_income;
          value = feasibleIncomeGap;
        }
        return {
          name: d.name,
          value: Math.round(value),
        };
      });
      return {
        ...tmp,
        data: data,
      };
    });
  }, [dashboardData]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Income gap"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartIncomeGapRef}
            exportFilename="What is the current income of the farmers and their income gap?"
          >
            <Chart
              wrapper={false}
              type="BAR"
              loading={!chartData.length}
              override={getColumnStackBarOptions({
                series: chartData,
                origin: dashboardData,
                yAxis: { name: `Income (${currentCase.currency})` },
                showLabel: showLabel,
              })}
            />
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              What is the current income of the farmers and their income gap?
            </div>
            <div className="section-description">
              This graph shows the gap between the household income levels and
              the income target for different segments, in their current and
              feasible levels. This shows that the income gaps can vary across
              different segments and hence each segment may need it&apos;s own
              custom strategy.
              <br />
              <br />
              <b>TIP!</b> By clicking on an item in the legend you can enable
              and disable that variable on the graph.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeGap;
