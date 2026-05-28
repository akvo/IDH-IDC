import React, { useRef, useMemo, useState } from "react";
import { Card, Row, Col, Space } from "antd";
import { VisualCardWrapper } from "../components";
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

  const [showLabel, setShowLabel] = useState(false);

  const chartData = useMemo(() => {
    const primaryCaseCommodityID = currentCase?.case_commodities?.find(
      (cc) => cc?.commodity_type === "focus"
    )?.id;

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

    return dashboardData.map((d) => {
      const primaryAnswers = d?.answers?.filter(
        (a) => a.caseCommodityId === primaryCaseCommodityID
      );

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

      const rowData = ["current", "feasible"].map((it) => {
        const cost = costAnswers?.find((val) => val.name === it)?.value || 0;
        const land = landAnswers?.find((val) => val.name === it)?.value || 0;
        const volume =
          volumeAnswers?.find((val) => val.name === it)?.value || 0;
        const price = priceAnswers?.find((val) => val.name === it)?.value || 0;

        const totalCost = cost * land;
        const revenue = land * price * volume;
        const revenueToCostRatio = totalCost ? revenue / totalCost : 0;

        const label = it.charAt(0).toUpperCase() + it.slice(1);
        return {
          name: label,
          title: label,
          value: parseFloat(revenueToCostRatio.toFixed(2)),
          currency: currentCase?.currency,
          color: colors[it],
        };
      });

      return {
        name: d.name,
        data: rowData,
      };
    });
  }, [currentCase, dashboardData, incomeDataDrivers]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={10}>
          <Space direction="vertical">
            <div className="section-title">
              How much household revenue is produced for every unit of currency
              spent?
            </div>
            <div className="section-description">
              This graph shows how much revenue the primary commodity generates
              for every unit of money spent producing it. It reflects the
              farmer&apos;s return on investment after accounting for price
              levels, premiums and production practices. Higher values indicate
              profitable production and effective farm and post-harvest
              management, while lower values point to thin margins, unfavourable
              prices or overspending on inputs.
            </div>
          </Space>
        </Col>
        <Col span={14}>
          <VisualCardWrapper
            title="Household revenue to cost ratio"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartFarmEconomicEfficiencyRef}
            exportFilename="Household revenue to cost ratio"
            tooltipText="This indicator is calculated by dividing the primary commodity revenue by commodity production cost. "
          >
            <Row gutter={[20, 20]}>
              <Col span={24}>
                <Chart
                  wrapper={false}
                  type="COLUMN-BAR"
                  loading={!chartData.length}
                  data={chartData}
                  showLabel={showLabel}
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
