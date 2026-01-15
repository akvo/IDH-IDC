import React, { useRef, useState, useMemo } from "react";
import { Row, Col, Divider } from "antd";
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

const ChartNeededIncomeLevel = () => {
  const chartNeededIncomeLevel = useRef(null);
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
    const currency = currentCase?.currency;
    // retrieve
    const caseCommoditiesTotalIncome = currentCase?.case_commodities
      ?.map((cc) => {
        const label =
          cc.commodity_type === "focus" ? "primary" : cc.commodity_type;
        const totalCurrentIncomeAll =
          currentDashboardData?.total_current_income || 0;
        const incomeTarget = currentDashboardData?.target || 0;
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
            incomeTarget,
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
          incomeTarget,
        };
      })
      ?.filter((v) => v?.totalCurrentIncome)
      ?.map((val) => {
        // income_target_source = income_target * (income_type/total_current_income)
        const income_target_source =
          val?.incomeTarget *
          (val?.totalCurrentIncome / val?.totalCurrentIncomeAll);
        return {
          name: upperFirst(val.label),
          value: income_target_source,
          color: val.color,
          currency,
        };
      });
    setLoading(false);
    return caseCommoditiesTotalIncome;
  }, [selectedSegment, dashboardData, currentCase]);

  return (
    <VisualCardWrapper
      title="Needed income levels"
      bordered
      exportElementRef={chartNeededIncomeLevel}
      exportFilename="Needed income levels"
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
          />
        </Col>
        <Col span={24}>
          <Divider style={{ margin: "5px" }} />
          <p>
            This graph shows how much household need to earn from each income
            source, based on their current income composition, in order to reach
            a Living Income. Use it to understand which income streams would
            need to increase and by how much.
          </p>
        </Col>
      </Row>
    </VisualCardWrapper>
  );
};

export default ChartNeededIncomeLevel;
