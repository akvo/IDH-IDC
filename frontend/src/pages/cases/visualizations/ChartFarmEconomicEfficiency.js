import React, { useRef, useMemo, useState } from "react";
import { Card, Row, Col, Space } from "antd";
import { SegmentSelector, VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";
import { CaseVisualState, CurrentCaseState } from "../store";

// What we are showing here:
// Essentially cost of production per weight unit of crop (primary commodity).
//  In the IDC we currently have cost of production per land unit (primary-5).
//  E.g.: we want cost per kg and not cost per acre

const colors = { current: "#1b726f", feasible: "#9cc2c1" };

const ChartFarmEconomicEfficiency = () => {
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
    const costAnswers = primaryAnswers?.filter((a) => a?.question?.id === 5);
    const landAnswers = primaryAnswers?.filter((a) => a?.question?.id === 2);
    // const volumeAnswers = primaryAnswers?.filter((a) => a?.question?.id === 3);

    // psudocode
    // for values in (current, feasible)
    //   total_cost = primary-5 * primary-2
    //   total_volume = primary-3 * primary-2
    //   farm_economic_efficiency = total_cost/primary_1

    const data = ["current", "feasible"].map((it) => {
      const totalIncome = totalIncomeAnswers?.find(
        (val) => val.name === it
      )?.value;
      const cost = costAnswers?.find((val) => val.name === it)?.value || 0;
      const land = landAnswers?.find((val) => val.name === it)?.value || 0;
      // const volume = volumeAnswers?.find((val) => val.name === it)?.value || 0;

      const totalCost = cost * land;
      const farmEconomicEfficiency = totalIncome ? totalCost / totalIncome : 0;

      return {
        name: it,
        value: farmEconomicEfficiency,
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
            <div className="section-title">Farm Economic Efficiency</div>
            <div className="section-description">
              This indicator shows the amount of cash a farmer must invest to
              produce one unit of raw material. It reflects how effectively
              inputs are converted into harvest and is calculated by dividing
              total production costs by total volume produced. A lower value
              suggests efficient use of inputs and strong agronomic performance,
              while a higher value may indicate low yields, poor input-use
              efficiency or rising input prices. Over time, this metric helps
              identify whether farmers are becoming more cost-efficient and
              whether production systems are improving or deteriorating.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartFarmEconomicEfficiency;
