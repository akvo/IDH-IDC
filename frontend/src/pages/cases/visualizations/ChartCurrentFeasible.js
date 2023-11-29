import React, { useMemo } from "react";
import Chart from "../../../components/chart";
import { incomeTargetChartOption } from "../../../components/chart/options/common";

const ChartCurrentFeasible = ({ dashboardData = [], currentCase }) => {
  const chartData = useMemo(() => {
    return dashboardData.reduce((c, d) => {
      return [
        ...c,
        {
          name: `Current\n${d.name}`,
          title: `Current\n${d.name}`,
          target: d.target,
          stack: [
            {
              name: "Cost of Production",
              title: "Cost of Production",
              value: d.total_current_cost,
              total: d.total_current_cost,
              order: 1,
              color: "#ff5d00",
            },
            {
              name: "Focus Crop Revenue",
              title: "Focus Crop Revenue",
              value: d.total_current_focus_income,
              total: d.total_current_focus_income,
              color: "#47d985",
              order: 2,
            },
            {
              name: "Diversified Income",
              title: "Diversified Income",
              value: d.total_current_diversified_income,
              total: d.total_current_diversified_income,
              color: "#fdc305",
              order: 3,
            },
          ],
        },
        {
          name: `Feasible\n${d.name}`,
          title: `Feasible\n${d.name}`,
          target: d.target,
          stack: [
            {
              name: "Cost of Production",
              title: "Cost of Production",
              value: d.total_feasible_cost,
              total: d.total_feasible_cost,
              order: 1,
            },
            {
              name: "Focus Crop Revenue",
              title: "Focus Crop Revenue",
              value: d.total_feasible_focus_income,
              total: d.total_feasible_focus_income,
              order: 2,
            },
            {
              name: "Diversified Income",
              title: "Diversified Income",
              value: d.total_feasible_diversified_income,
              total: d.total_feasible_diversified_income,
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
        data: chartData.map((cd) => ({
          name: "Income Target",
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
      extra={{ axisTitle: { y: `Income (${currentCase.currency})` } }}
    />
  );
};

export default ChartCurrentFeasible;
