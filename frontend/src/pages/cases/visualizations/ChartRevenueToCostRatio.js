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

    const costAnswers = primaryAnswers?.filter((a) => a?.question?.id === 5);
    const landAnswers = primaryAnswers?.filter((a) => a?.question?.id === 2);
    const volumeAnswers = primaryAnswers?.filter((a) => a?.question?.id === 3);
    const priceAnswers = primaryAnswers?.filter((a) => a?.question?.id === 4);

    // psudocode
    // for values in (current, feasible):
    //   total_cost = primary-5 * primary-2
    //   revenue = primary-2*primary-3*primary-4
    //   revenue_to_cost_ration = revnue/total_cost

    const data = ["current", "feasible"].map((it) => {
      const cost = costAnswers?.find((val) => val.name === it)?.value || 0;
      const land = landAnswers?.find((val) => val.name === it)?.value || 0;
      const volume = volumeAnswers?.find((val) => val.name === it)?.value || 0;
      const price = priceAnswers?.find((val) => val.name === it)?.value || 0;

      const totalCost = cost * land;
      const revenue = land * price * volume;
      const revenueToCostRatio = revenue / totalCost;

      return {
        name: it,
        value: revenueToCostRatio,
        currency: currentCase?.currency,
        color: colors[it],
      };
    });
    return data;
  }, [currentCase, dashboardData, selectedSegment]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={10}>
          <Space direction="vertical">
            <div className="section-title">Revenue to cost ratio</div>
            <div className="section-description">
              This ratio shows how much revenue the crop generates for every
              unit of money spent producing it. It is calculated as crop revenue
              divided by production costs and reflects the farmer&apos;s return
              on investment after accounting for price levels, premiums and
              production practices. Higher values indicate profitable production
              and effective farm and post-harvest management, while lower values
              point to thin margins, unfavourable prices or overspending on
              inputs. Tracking this ratio over time helps assess financial
              resilience and how market conditions or agronomic changes
              influence household income.
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
