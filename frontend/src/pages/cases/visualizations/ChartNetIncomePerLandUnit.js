import React, { useRef, useMemo, useState } from "react";
import { Card, Row, Col, Space } from "antd";
import { VisualCardWrapper } from "../components";
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

  const [showLabel, setShowLabel] = useState(false);

  const focusCommodity = useMemo(() => {
    return questionGroups?.find((qg) => qg.case_commodity_type === "focus");
  }, [questionGroups]);

  const chartData = useMemo(() => {
    const primaryCaseCommodityID = currentCase?.case_commodities?.find(
      (cc) => cc?.commodity_type === "focus"
    )?.id;

    const focusCommodityGroup = incomeDataDrivers?.find(
      (d) => d.type === "primary"
    )?.questionGroups?.[0];

    const commodityCategory = focusCommodityGroup?.commodity_category;

    // Determine QIDs based on category from question.csv and docs/INCOME_CALCULATION.md
    let qidMap = { totalIncome: 1, land: 2 };
    if (commodityCategory === "Livestock") {
      qidMap = { totalIncome: 1, land: 40 };
    }

    return dashboardData.map((d) => {
      const primaryAnswers = d?.answers?.filter(
        (a) => a.caseCommodityId === primaryCaseCommodityID
      );

      const totalIncomeAnswers = primaryAnswers?.filter(
        (a) => (a.questionId || a?.question?.id) === qidMap.totalIncome
      );
      const landAnswers = primaryAnswers?.filter(
        (a) => (a.questionId || a?.question?.id) === qidMap.land
      );

      const rowData = ["current", "feasible"].map((it) => {
        const totalIncome = totalIncomeAnswers?.find(
          (val) => val.name === it
        )?.value;
        const land = landAnswers?.find((val) => val.name === it)?.value || 0;
        const netIncomeLandUnit = land ? totalIncome / land : 0;

        const label = it.charAt(0).toUpperCase() + it.slice(1);
        return {
          name: label,
          title: label,
          value: parseFloat(netIncomeLandUnit.toFixed(2)),
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

  const rawUnit = useMemo(
    () => focusCommodity?.area_size_unit || "land unit",
    [focusCommodity?.area_size_unit]
  );

  const landUnit = useMemo(() => {
    const unitLower = rawUnit.toLowerCase();
    if (unitLower === "hectares") {
      return "hectare";
    }
    if (unitLower === "acres") {
      return "acre";
    }
    if (unitLower === "cubic-metres") {
      return "cubic-metre";
    }
    if (unitLower === "cubic-feet") {
      return "cubic-foot";
    }
    if (unitLower === "cubic-yards") {
      return "cubic-yard";
    }
    if (unitLower === "square-feet") {
      return "square-foot";
    }
    if (unitLower === "square-meter") {
      return "square-meter";
    }
    if (unitLower.endsWith("s")) {
      return rawUnit.slice(0, -1);
    }
    return rawUnit;
  }, [rawUnit]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={14}>
          <VisualCardWrapper
            title={`Change indicator: Primary commodity income per ${landUnit}`}
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartFarmEconomicEfficiencyRef}
            exportFilename={`Change indicator: Primary commodity income per ${landUnit}`}
            tooltipText="This indicator is calculated by dividing net income by the cultivated area."
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
              How much profit is earned from the primary commodity per unit of
              land?
            </div>
            <div className="section-description">
              This graph captures the profit earned from the commodity per unit
              of land, reflecting how well farmers translate land into financial
              returns. It is influenced by yields, input use, soil health and
              management practices. Higher values show profitable and efficient
              land use, while lower values signal underperforming plots,
              degraded soils or suboptimal agronomy.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartNetIncomePerLandUnit;
