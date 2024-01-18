import React, { useMemo } from "react";
import Chart from "../../../components/chart";
import { incomeTargetChartOption } from "../../../components/chart/options/common";

const ChartCurrentFeasible = ({
  dashboardData = [],
  currentCase,
  showLabel = false,
}) => {
  const chartData = useMemo(() => {
    return dashboardData.reduce((c, d) => {
      return [
        ...c,
        {
          name: `Current\n${d.name}`,
          target: Math.round(d.total_current_income),
          stack: [
            {
              name: "Revenue Focus Commodity",
              title: "Revenue Focus Commodity",
              value: Math.round(d.total_current_revenue_focus_commodity),
              total: Math.round(d.total_current_revenue_focus_commodity),
              color: "#03625f",
              order: 1,
            },
            {
              name: "Diversified Income",
              title: "Diversified Income",
              value: Math.round(d.total_current_diversified_income),
              total: Math.round(d.total_current_diversified_income),
              color: "#49d985",
              order: 2,
            },
            {
              name: "Focus Commodity\nCosts of Production",
              title: "Focus Commodity\nCosts of Production",
              value: Math.round(
                d.total_current_focus_commodity_cost_of_production
              ),
              total: Math.round(
                d.total_current_focus_commodity_cost_of_production
              ),
              color: "#ff6d01",
              order: 3,
            },
          ],
        },
        {
          name: `Feasible\n${d.name}`,
          target: Math.round(d.total_feasible_income),
          stack: [
            {
              name: "Revenue Focus Commodity",
              title: "Revenue Focus Commodity",
              value: Math.round(d.total_feasible_revenue_focus_commodity),
              total: Math.round(d.total_feasible_revenue_focus_commodity),
              color: "#03625f",
              order: 1,
            },
            {
              name: "Diversified Income",
              title: "Diversified Income",
              value: Math.round(d.total_feasible_diversified_income),
              total: Math.round(d.total_feasible_diversified_income),
              color: "#49d985",
              order: 2,
            },
            {
              name: "Focus Commodity\nCosts of Production",
              title: "Focus Commodity\nCosts of Production",
              value: Math.round(
                d.total_feasible_focus_commodity_cost_of_production
              ),
              total: Math.round(
                d.total_feasible_focus_commodity_cost_of_production
              ),
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
          value: cd?.target ? Math.round(cd.target) : 0,
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
      extra={{
        axisTitle: { y: `Income (${currentCase.currency})` },
        xAxisLabel: { rotate: 45, margin: 20 },
      }}
      grid={{
        right: 190,
        bottom: 10,
      }}
      showLabel={showLabel}
    />
  );
};

export default ChartCurrentFeasible;
