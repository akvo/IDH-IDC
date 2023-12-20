import React, { useMemo } from "react";
import Chart from "../../../components/chart";
import { incomeTargetChartOption } from "../../../components/chart/options/common";

const ChartIncomeGap = ({ dashboardData, currentCase }) => {
  const chartData = useMemo(() => {
    return dashboardData.reduce((c, d) => {
      return [
        ...c,
        {
          name: `Current\n${d.name}`,
          target: d.total_current_income,
          stack: [
            {
              name: "Revenue Focus Commodity",
              title: "Revenue Focus Commodity",
              value: d.total_current_revenue_focus_commodity,
              total: d.total_current_revenue_focus_commodity,
              color: "#03625f",
              order: 1,
            },
            {
              name: "Diversified Income",
              title: "Diversified Income",
              value: d.total_current_diversified_income,
              total: d.total_current_diversified_income,
              color: "#49d985",
              order: 2,
            },
            {
              name: "Focus Commodity Costs of Production",
              title: "Focus Commodity Costs of Production",
              value: d.total_current_focus_commodity_cost_of_production,
              total: d.total_current_focus_commodity_cost_of_production,
              color: "#ff6d01",
              order: 3,
            },
          ],
        },
        {
          name: `Feasible\n${d.name}`,
          target: d.total_feasible_income,
          stack: [
            {
              name: "Revenue Focus Commodity",
              title: "Revenue Focus Commodity",
              value: d.total_feasible_revenue_focus_commodity,
              total: d.total_feasible_revenue_focus_commodity,
              color: "#03625f",
              order: 1,
            },
            {
              name: "Diversified Income",
              title: "Diversified Income",
              value: d.total_feasible_diversified_income,
              total: d.total_feasible_diversified_income,
              color: "#49d985",
              order: 2,
            },
            {
              name: "Focus Commodity Costs of Production",
              title: "Focus Commodity Costs of Production",
              value: d.total_feasible_focus_commodity_cost_of_production,
              total: d.total_feasible_focus_commodity_cost_of_production,
              color: "#ff6d01",
              order: 3,
            },
          ],
        },
      ];
    }, []);
  }, [dashboardData]);

  const targetChartData = useMemo(() => {
    if (!chartData.length) {
      return [];
    }
    return [
      {
        ...incomeTargetChartOption,
        color: "#000",
        data: chartData.map((cd) => ({
          name: "Total Household Income",
          value: cd?.target ? cd.target.toFixed(2) : 0,
        })),
      },
    ];
  }, [chartData]);

  return (
    <Chart
      wrapper={false}
      type="BARSTACK"
      data={chartData}
      affix={true}
      loading={!chartData.length || !targetChartData.length}
      targetData={targetChartData}
      extra={{ axisTitle: { y: `Income Gap (${currentCase.currency})` } }}
    />
  );
};

export default ChartIncomeGap;
