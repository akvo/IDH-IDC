import React, { useMemo } from "react";
import Chart from "../../../components/chart";
import { incomeTargetChartOption } from "../../../components/chart/options/common";

const ChartCurrentFeasible = ({ dashboardData = [], currentCase }) => {
  const chartData = useMemo(() => {
    return dashboardData.reduce((c, d) => {
      const currentIncomeGap =
        d.target - d.total_current_income < 0
          ? 0
          : d.target - d.total_current_income;
      const feasibleIncomeGap =
        d.target - d.total_feasible_income < 0
          ? 0
          : d.target - d.total_feasible_income;
      return [
        ...c,
        {
          name: `Current\n${d.name}`,
          title: `Current\n${d.name}`,
          target: d.target,
          stack: [
            {
              name: "Household Income",
              title: "Household Income",
              value: d.total_current_income,
              total: d.total_current_income,
              color: "#03625f",
              order: 1,
            },
            {
              name: "Income Gap",
              title: "Income Gap",
              value: currentIncomeGap,
              total: currentIncomeGap,
              color: "#fbbc04",
              order: 2,
            },
          ],
        },
        {
          name: `Feasible\n${d.name}`,
          title: `Feasible\n${d.name}`,
          target: d.target,
          stack: [
            {
              name: "Household Income",
              title: "Household Income",
              value: d.total_feasible_income,
              total: d.total_feasible_income,
              color: "#03625f",
              order: 1,
            },
            {
              name: "Income Gap",
              title: "Income Gap",
              value: feasibleIncomeGap,
              total: feasibleIncomeGap,
              color: "#fbbc04",
              order: 2,
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
