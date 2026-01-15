import React, { useRef, useState, useMemo } from "react";
import { Card, Row, Col, Divider } from "antd";
import { VisualCardWrapper, SegmentSelector } from "../components";
import { CurrentCaseState, CaseVisualState } from "../store";
import Chart from "../../../components/chart";
import { sumBy, upperFirst } from "lodash";

const colors = {
  primary: "#01625F",
  secondary: "#5BDD91",
  tertiary: "#9CC2C1",
  diversified: "#FFC09C",
};

const ChartHouseholdIncomeComposition = () => {
  const chartHouseholdIncomeCompositionRef = useRef(null);
  const currentCase = CurrentCaseState.useState((s) => s);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [loading, setLoading] = useState(false);

  const chartData = useMemo(() => {
    setLoading(true);
    // find current dashboard data by selected segment
    const currentDashboardData = dashboardData.find(
      (d) => d.id === selectedSegment
    );
    // retrieve
    const caseCommoditiesTotalIncome = currentCase?.case_commodities
      ?.map((cc) => {
        const label =
          cc.commodity_type === "focus" ? "primary" : cc.commodity_type;
        const totalCurrentIncomeAll =
          currentDashboardData?.total_current_income || 0;
        //
        if (cc.commodity_type === "diversified") {
          // without primary, secondary, tertiary
          const diffIncome = currentDashboardData?.answers?.filter(
            (a) => a.caseCommodityId === cc.id
          );
          const totalDiffCurrentIncome = diffIncome?.filter(
            (di) => di.name === "current"
          );
          const totalDiffFeasibleIncome = diffIncome?.filter(
            (di) => di.name === "feasible"
          );
          return {
            label,
            color: colors[label],
            totalCurrentIncome: sumBy(totalDiffCurrentIncome, "value"),
            totalFeasibleIncome: sumBy(totalDiffFeasibleIncome, "value"),
            totalCurrentIncomeAll,
          };
        }
        //
        const totalIncome = currentDashboardData?.answers?.filter(
          (a) =>
            a?.question?.question_type === "aggregator" &&
            a.caseCommodityId === cc.id
        );
        const totalCurrentIncome =
          totalIncome?.find((ti) => ti.name === "current")?.value || 0;
        const totalFeasibleIncome =
          totalIncome?.find((ti) => ti.name === "feasible")?.value || 0;
        return {
          label,
          color: colors[label],
          totalCurrentIncome,
          totalFeasibleIncome,
          totalCurrentIncomeAll,
        };
      })
      ?.filter((v) => v?.totalCurrentIncome)
      ?.map((val) => {
        // percentage_income = income_type/total_current_income *100
        const percentageIncome =
          (val?.totalCurrentIncome / val?.totalCurrentIncomeAll) * 100;
        return {
          name: upperFirst(val.label),
          value: percentageIncome,
          color: val.color,
        };
      });
    setLoading(false);
    return caseCommoditiesTotalIncome;
  }, [selectedSegment, dashboardData, currentCase]);

  return (
    <Card className="card-visual-wrapper">
      <VisualCardWrapper
        title="Household Income Composition"
        bordered
        exportElementRef={chartHouseholdIncomeCompositionRef}
        exportFilename="Household Income Composition"
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
              type="PIE"
              loading={loading}
              data={chartData}
              percentage={true}
            />
          </Col>
          <Col span={24}>
            <Divider style={{ margin: "5px" }} />
            <p>
              This graph shows the composition of income and how much each
              income source contributes to total household earnings.
              <br />
              Use it to identify the activities that contribute most to farmer
              incomes.
            </p>
          </Col>
        </Row>
      </VisualCardWrapper>
    </Card>
  );
};

export default ChartHouseholdIncomeComposition;
