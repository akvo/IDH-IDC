import React, { useRef, useMemo, useState } from "react";
import { Card, Row, Col, Space } from "antd";
import { VisualCardWrapper } from "../components";
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
    let qidMap = { volume: 3, cop: 5, land: 2 };
    if (commodityCategory === "Livestock") {
      qidMap = { volume: 41, cop: 43, land: 40 };
    } else if (commodityCategory === "Aquaculture") {
      qidMap = { volume: 3, cop: 26, land: 2 };
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

      const rowData = ["current", "feasible"].map((it) => {
        const cost = costAnswers?.find((val) => val.name === it)?.value || 0;
        const land = landAnswers?.find((val) => val.name === it)?.value || 0;
        const volume =
          volumeAnswers?.find((val) => val.name === it)?.value || 0;

        const totalCost = cost * land;
        const totalVolume = volume * land;
        const farmEconomicEfficiency = totalVolume
          ? totalCost / totalVolume
          : 0;

        const label = it.charAt(0).toUpperCase() + it.slice(1);
        return {
          name: label,
          title: label,
          value: parseFloat(farmEconomicEfficiency.toFixed(2)),
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
        <Col span={14}>
          <VisualCardWrapper
            title="Change indicator: Farm economic efficiency"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartFarmEconomicEfficiencyRef}
            exportFilename="Change indicator: Farm economic efficiency"
            tooltipText="This indicator is calculated by dividing total production costs by total output."
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
        <Col span={10}>
          <Space direction="vertical">
            <div className="section-title">
              How much money is needed to produce 1
              {currentCase?.volume_measurement_unit || "kg"} of the primary
              commodity?
            </div>
            <div className="section-description">
              This graph visualises production efficiency per unit of the
              primary commodity. It indicates how efficiently inputs are
              converted into harvest. Low values reflect more efficient input
              use and stronger agronomic performance, while higher values may
              point to low yields, inefficient input use, or higher input
              prices.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartFarmEconomicEfficiency;
