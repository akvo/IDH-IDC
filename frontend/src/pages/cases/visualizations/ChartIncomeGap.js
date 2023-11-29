import React, { useMemo } from "react";
import Chart from "../../../components/chart";

const ChartIncomeGap = ({ dashboardData, currentCase }) => {
  const chartData = useMemo(() => {
    return dashboardData.reduce((c, d) => {
      const target = d?.target || 0;
      const currentValue = target - d.total_current_income;
      const feasibleValue = target - d.total_feasible_income;
      return [
        ...c,
        {
          name: `Current\n${d.name}`,
          value: currentValue.toFixed(2),
          total: currentValue.toFixed(2),
          color: "#854634",
        },
        {
          name: `Feasible\n${d.name}`,
          value: feasibleValue.toFixed(2),
          total: feasibleValue.toFixed(2),
          color: "#ff6c19",
        },
      ];
    }, []);
  }, [dashboardData]);

  return (
    <Chart
      wrapper={false}
      type="BAR"
      data={chartData}
      affix={true}
      extra={{ axisTitle: { y: `Income Gap (${currentCase.currency})` } }}
    />
  );
};

export default ChartIncomeGap;
