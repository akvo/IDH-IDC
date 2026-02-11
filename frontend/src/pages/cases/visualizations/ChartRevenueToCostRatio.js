import React, { useRef, useMemo, useState } from "react";
import { Card, Row, Col, Space } from "antd";
import { SegmentSelector, VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";
import { CaseVisualState, CurrentCaseState } from "../store";

// What we are showing here:
// The total income earned from the primary commodity divided by total cost of the primary commodity.

const colors = { current: "#1b726f", feasible: "#9cc2c1" };

const ChartRevenueToCostRatio = () => {
  const chartFarmEconomicEfficiencyRef = useRef(null);
  const currentCase = CurrentCaseState.useState((s) => s);
  const { dashboardData, incomeDataDrivers } = CaseVisualState.useState(
    (s) => s
  );

  const [selectedSegment, setSelectedSegment] = useState(null);

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
    let qidMap = { price: 4, volume: 3, cop: 5, land: 2 };
    if (commodityCategory === "Livestock") {
      qidMap = { price: 42, volume: 41, cop: 43, land: 40 };
    } else if (commodityCategory === "Aquaculture") {
      qidMap = { price: 4, volume: 3, cop: 26, land: 2 };
    }

    const costAnswers = primaryAnswers?.filter(
      (a) => (a.questionId || a?.question?.id) === qidMap.cop
    );
    const landAnswers = primaryAnswers?.filter(
      (a) => (a.questionId || a?.question?.id) === qidMap.land
    );
    const volumeAnswers = primaryAnswers?.filter(
      (a) => (a.questionId || a?.question?.id) === qidMap.volume
    );
    const priceAnswers = primaryAnswers?.filter(
      (a) => (a.questionId || a?.question?.id) === qidMap.price
    );

    const data = ["current", "feasible"].map((it) => {
      const cost = costAnswers?.find((val) => val.name === it)?.value || 0;
      const land = landAnswers?.find((val) => val.name === it)?.value || 0;
      const volume = volumeAnswers?.find((val) => val.name === it)?.value || 0;
      const price = priceAnswers?.find((val) => val.name === it)?.value || 0;

      // for values in (current, feasible):
      //   total_cost = primary-5 * primary-2
      //   revenue = primary-2*primary-3*primary-4
      //   revenue_to_cost_ration = revenue/total_cost

      const totalCost = cost * land;
      const revenue = land * price * volume;
      const revenueToCostRatio = totalCost ? revenue / totalCost : 0;

      return {
        name: it,
        value: revenueToCostRatio,
        currency: currentCase?.currency,
        color: colors[it],
      };
    });
    return data;
  }, [currentCase, dashboardData, selectedSegment, incomeDataDrivers]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={10}>
          <Space direction="vertical">
            <div className="section-title">Revenue to cost ratio</div>
            <div className="section-description">
              This graph shows how much revenue the primary commodity generates
              for every unit of money spent producing it. It is calculated as
              primary commodity revenue divided by production costs and reflects
              the farmer&apos;s return on investment after accounting for price
              levels, premiums and production practices. Higher values indicate
              profitable production and effective farm and post-harvest
              management, while lower values point to thin margins, unfavourable
              prices or overspending on inputs. Tracking this ratio over time
              helps assess financial resilience and how market conditions or
              agronomic changes influence household income.
            </div>
          </Space>
        </Col>
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
      </Row>
    </Card>
  );
};

export default ChartRevenueToCostRatio;
