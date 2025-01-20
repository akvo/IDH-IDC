import React, { useMemo } from "react";
import Chart from "../../../components/chart";
import { getColumnStackBarOptions } from ".";

const seriesTmp = [
  {
    key: "total_current_income",
    name: "Current Household Income",
    type: "bar",
    stack: "current",
    color: "#1b726f",
  },
  {
    key: "total_feasible_income",
    name: "Feasible Household Income",
    type: "bar",
    stack: "feasible",
    color: "#9cc2c1",
  },
  {
    key: "current_income_gap",
    name: "Current Income Gap",
    type: "bar",
    stack: "current",
    color: "#fecb21",
  },
  {
    key: "feasible_income_gap",
    name: "Feasible Income Gap",
    type: "bar",
    stack: "feasible",
    color: "#ffeeb8",
  },
  {
    key: "target",
    name: "Income Target",
    type: "line",
    symbol: "diamond",
    symbolSize: 15,
    color: "#000",
  },
];

const ChartIncomeGap = ({ dashboardData, currentCase, showLabel = false }) => {
  const chartData = useMemo(() => {
    return seriesTmp.map((tmp) => {
      const data = dashboardData.map((d) => {
        let value = d?.[tmp.key] ? d[tmp.key] : 0;
        if (tmp.key === "current_income_gap") {
          const currentIncomeGap =
            d.target - d.total_current_income < 0
              ? 0
              : d.target - d.total_current_income;
          value = currentIncomeGap;
        }
        if (tmp.key === "feasible_income_gap") {
          const feasibleIncomeGap =
            d.target - d.total_feasible_income < 0
              ? 0
              : d.target - d.total_feasible_income;
          value = feasibleIncomeGap;
        }
        return {
          name: d.name,
          value: Math.round(value),
        };
      });
      return {
        ...tmp,
        data: data,
      };
    });
  }, [dashboardData]);

  return (
    <Chart
      wrapper={false}
      type="BAR"
      loading={!chartData.length}
      override={getColumnStackBarOptions({
        series: chartData,
        origin: dashboardData,
        yAxis: { name: `Income (${currentCase.currency})` },
        showLabel: showLabel,
      })}
    />
  );
};

export default ChartIncomeGap;
