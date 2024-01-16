import React, { useMemo } from "react";
import Chart from "../../../components/chart";
import { incomeTargetChartOption } from "../../../components/chart/options/common";

const ChartIncomeGap = ({ dashboardData, currentCase }) => {
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
          target: Math.round(d.target),
          stack: [
            {
              name: "Household Income",
              title: "Household Income",
              value: Math.round(d.total_current_income),
              total: Math.round(d.total_current_income),
              color: "#03625f",
              order: 1,
            },
            {
              name: "Income Gap",
              title: "Income Gap",
              value: Math.round(currentIncomeGap),
              total: Math.round(currentIncomeGap),
              color: "#fbbc04",
              order: 2,
            },
          ],
        },
        {
          name: `Feasible\n${d.name}`,
          title: `Feasible\n${d.name}`,
          target: Math.round(d.target),
          stack: [
            {
              name: "Household Income",
              title: "Household Income",
              value: Math.round(d.total_feasible_income),
              total: Math.round(d.total_feasible_income),
              color: "#03625f",
              order: 1,
            },
            {
              name: "Income Gap",
              title: "Income Gap",
              value: Math.round(feasibleIncomeGap),
              total: Math.round(feasibleIncomeGap),
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
      extra={{ axisTitle: { y: `Income (${currentCase.currency})` } }}
    />
  );
};

export default ChartIncomeGap;
