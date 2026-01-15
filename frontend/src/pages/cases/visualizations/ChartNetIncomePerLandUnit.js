import React, { useRef, useMemo, useState } from "react";
import { Card, Row, Col, Space } from "antd";
import { SegmentSelector, VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";
import { CaseVisualState, CurrentCaseState } from "../store";

// What we are showing here:
// How much a farmer earns per land unit.

const colors = { current: "#1b726f", feasible: "#9cc2c1" };

const ChartNetIncomePerLandUnit = () => {
  const chartFarmEconomicEfficiencyRef = useRef(null);
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [selectedSegment, setSelectedSegment] = useState(null);

  const chartData = useMemo(() => {
    const primaryCaseCommodityID = currentCase?.case_commodities?.find(
      (cc) => cc?.commodity_type === "focus"
    )?.id;

    const currentDashboardData = dashboardData.find(
      (d) => d.id === selectedSegment
    );

    const primaryAnswers = currentDashboardData?.answers?.filter(
      (a) => a.caseCommodityId === primaryCaseCommodityID
    );

    const totalIncomeAnswers = primaryAnswers?.filter(
      (a) => a?.question?.id === 1
    );
    const landAnswers = primaryAnswers?.filter((a) => a?.question?.id === 2);

    // psudocode
    // for values in (current, feasible):
    //   net_income_land_unit = primary-1/primary-2

    const data = ["current", "feasible"].map((it) => {
      const totalIncome = totalIncomeAnswers?.find(
        (val) => val.name === it
      )?.value;
      const land = landAnswers?.find((val) => val.name === it)?.value || 0;
      const netIncomeLandUnit = totalIncome / land;

      return {
        name: it,
        value: netIncomeLandUnit,
        currency: currentCase?.currency,
        color: colors[it],
      };
    });
    return data;
  }, [currentCase, dashboardData, selectedSegment]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={14}>
          <VisualCardWrapper
            title="Change Indicators"
            bordered
            exportElementRef={chartFarmEconomicEfficiencyRef}
            exportFilename="Farm Economic Efficiency"
          >
            <Row gutter={[20, 20]}>
              <Col span={24}>
                <SegmentSelector
                  selectedSegment={selectedSegment}
                  setSelectedSegment={setSelectedSegment}
                />
              </Col>
              <Col span={24}>
                <Chart
                  wrapper={false}
                  type="BAR"
                  loading={!chartData.length}
                  data={chartData}
                  extra={{ axisTitle: { y: `${currentCase?.currency}` } }}
                />
              </Col>
            </Row>
          </VisualCardWrapper>
        </Col>
        <Col span={10}>
          <Space direction="vertical">
            <div className="section-title">
              Focus crop net income per land unit
            </div>
            <div className="section-description">
              This metric captures the net profit earned from the crop per unit
              of land and is calculated by dividing net income by the cultivated
              area. It reflects how well farmers translate land into financial
              returns and is influenced by yields, input use, soil health and
              management practices. Higher values show profitable and efficient
              land use, while lower values signal underperforming plots,
              degraded soils or suboptimal agronomy. Monitoring changes in this
              indicator helps understand whether land productivity is improving
              and whether interventions are resulting in better economic
              outcomes.
              <br />
              <small style={{ color: "#959390" }}>
                *“land unit” to automatically change to what user selected e.g.
                hectare/acre etc.
              </small>
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartNetIncomePerLandUnit;
