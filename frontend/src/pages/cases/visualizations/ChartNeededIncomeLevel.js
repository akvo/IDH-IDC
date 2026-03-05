import React, { useRef, useState, useMemo } from "react";
import { Row, Col, Divider } from "antd";
import {
  VisualCardWrapper,
  SegmentSelector,
  IncomeGatingAlert,
} from "../components";
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

  // find current dashboard data by selected segment
  const currentDashboardData = useMemo(
    () => dashboardData.find((d) => d.id === selectedSegment),
    [dashboardData, selectedSegment]
  );

  const isAboveTarget = useMemo(() => {
    return (
      (currentDashboardData?.total_current_income || 0) >=
      (currentDashboardData?.target || 0)
    );
  }, [currentDashboardData]);

  const chartData = useMemo(() => {
    if (isAboveTarget) {
      return [];
    }
    setLoading(true);

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
            !a?.question?.parent &&
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
        // income_target_source = (income_target * (income_type/total_current_income)) - current_income
        const share = val?.totalCurrentIncomeAll
          ? val?.totalCurrentIncome / val?.totalCurrentIncomeAll
          : 0;
        const gap = val?.incomeTarget * share - val?.totalCurrentIncome;
        return {
          name: upperFirst(val.label),
          value: Math.abs(gap),
          count: gap,
          color: val.color,
          currency,
        };
      })
      ?.filter((v) => v.count !== 0);
    setLoading(false);
    return caseCommoditiesTotalIncome;
  }, [
    isAboveTarget,
    currentDashboardData,
    currentCase?.currency,
    currentCase?.case_commodities,
  ]);

  return (
    <VisualCardWrapper
      title="Additional income needed by income source to reach a living income"
      bordered
      exportElementRef={chartNeededIncomeLevel}
      exportFilename="Additional income needed by income source to reach a living income"
    >
      <Row gutter={[20, 20]}>
        <Col span={24}>
          <SegmentSelector
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
        </Col>
        <Col span={24}>
          {isAboveTarget ? (
            <div style={{ height: 415, display: "flex", alignItems: "center" }}>
              <IncomeGatingAlert style={{ width: "100%" }} />
            </div>
          ) : (
            <Chart
              wrapper={false}
              type="PIE"
              loading={loading}
              data={chartData}
              height={415}
            />
          )}
        </Col>
        <Col span={24}>
          <Divider style={{ margin: "5px" }} />
          <p style={{ minHeight: 100 }}>
            This chart shows how much <i>additional</i> income a household would
            need from each income source to reach a living income, assuming the
            current income composition remains the same. Use it to understand
            which income sources would need to increase, and by how much, to
            close the living income gap.
          </p>
        </Col>
      </Row>
    </VisualCardWrapper>
  );
};

export default ChartNeededIncomeLevel;
