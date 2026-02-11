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
    let qidMap = { volume: 3, cop: 5, land: 2 };
    if (commodityCategory === "Livestock") {
      qidMap = { volume: 41, cop: 43, land: 40 };
    } else if (commodityCategory === "Aquaculture") {
      qidMap = { volume: 3, cop: 26, land: 2 };
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

    const data = ["current", "feasible"].map((it) => {
      const cost = costAnswers?.find((val) => val.name === it)?.value || 0;
      const land = landAnswers?.find((val) => val.name === it)?.value || 0;
      const volume = volumeAnswers?.find((val) => val.name === it)?.value || 0;

      // for values in (current, feasible)
      //   total_cost = primary-5 * primary-2
      //   total_volume = primary-3 * primary-2
      //   farm_economic_efficiency = total_cost/primary_1

      const totalCost = cost * land;
      const totalVolume = volume * land;
      const farmEconomicEfficiency = totalVolume ? totalCost / totalVolume : 0;

      return {
        name: it,
        value: farmEconomicEfficiency,
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
            <div className="section-title">Farm Economic Efficiency</div>
            <div className="section-description">
              This graph shows the cash a farmer needs to invest to produce one
              unit of the primary commodity. It is calculated by dividing total
              production costs by total output and indicates how efficiently
              inputs are converted into harvest. Lower values reflect more
              efficient input use and stronger agronomic performance, while
              higher values may point to low yields, inefficient input use, or
              higher input prices. Over time, this metric helps assess whether
              cost efficiency and production performance are improving or
              deteriorating.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartFarmEconomicEfficiency;
