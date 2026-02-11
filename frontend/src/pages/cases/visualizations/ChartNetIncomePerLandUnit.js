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
  const { dashboardData, questionGroups, incomeDataDrivers } =
    CaseVisualState.useState((s) => s);

  const [selectedSegment, setSelectedSegment] = useState(null);

  const focusCommodity = useMemo(() => {
    return questionGroups?.find((qg) => qg.case_commodity_type === "focus");
  }, [questionGroups]);

  const chartData = useMemo(() => {
    const primaryCaseCommodityID = currentCase?.case_commodities?.find(
      (cc) => cc?.commodity_type === "focus"
    )?.id;

    const currentDashboardData =
      dashboardData.find((d) => d.id === selectedSegment) || dashboardData?.[0];

    const primaryAnswers = currentDashboardData?.answers?.filter(
      (a) => a.caseCommodityId === primaryCaseCommodityID
    );

    const focusCommodityGroup = incomeDataDrivers?.find(
      (d) => d.type === "primary"
    )?.questionGroups?.[0];

    const commodityCategory = focusCommodityGroup?.commodity_category;

    // Determine QIDs based on category from question.csv and docs/INCOME_CALCULATION.md
    let qidMap = { totalIncome: 1, land: 2 };
    if (commodityCategory === "Livestock") {
      qidMap = { totalIncome: 1, land: 40 };
    }

    const totalIncomeAnswers = primaryAnswers?.filter(
      (a) => (a.questionId || a?.question?.id) === qidMap.totalIncome
    );
    const landAnswers = primaryAnswers?.filter(
      (a) => (a.questionId || a?.question?.id) === qidMap.land
    );

    // psudocode
    // for values in (current, feasible):
    //   net_income_land_unit = primary-1/primary-2

    const data = ["current", "feasible"].map((it) => {
      const totalIncome = totalIncomeAnswers?.find(
        (val) => val.name === it
      )?.value;
      const land = landAnswers?.find((val) => val.name === it)?.value || 0;
      const netIncomeLandUnit = land ? totalIncome / land : 0;

      return {
        name: it,
        value: netIncomeLandUnit,
        currency: currentCase?.currency,
        color: colors[it],
      };
    });
    return data;
  }, [currentCase, dashboardData, selectedSegment, incomeDataDrivers]);

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
              Focus crop net income per{" "}
              {focusCommodity?.area_size_unit || "land unit"}
            </div>
            <div className="section-description">
              This metric captures the profit earned from the crop per unit of
              land and is calculated by dividing net income by the cultivated
              area. It reflects how well farmers translate land into financial
              returns and is influenced by yields, input use, soil health and
              management practices. Higher values show profitable and efficient
              land use, while lower values signal underperforming plots,
              degraded soils or suboptimal agronomy. Monitoring changes in this
              indicator helps understand whether land productivity is improving
              and whether interventions are resulting in better economic
              outcomes
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartNetIncomePerLandUnit;
