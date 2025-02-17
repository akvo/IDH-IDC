import React, { useMemo } from "react";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";

const generateTargetChartData = (data) => {
  const target = [
    {
      name: "Income Target",
      type: "line",
      symbol: "diamond",
      symbolSize: 15,
      color: "#000",
      lineStyle: {
        width: 0,
      },
      data: data.map((d) => ({
        name: "Benchmark",
        value: d?.target ? Math.round(d.target) : 0,
      })),
    },
  ];
  return target;
};

const generateChartData = (data, current = false) => {
  return data.map((d) => {
    const incomeTarget = d?.currentSegmentValue?.target || 0;
    const currentTotalIncome =
      d?.currentSegmentValue?.total_current_income || 0;

    const newTotalIncome = d?.newTotalIncome || 0;
    const additionalValue = newTotalIncome
      ? newTotalIncome - currentTotalIncome
      : 0;

    let gapValue = incomeTarget - newTotalIncome;
    gapValue = gapValue < 0 ? 0 : gapValue;

    return {
      name: current ? d.name : `${d.scenarioName}-${d.name}`,
      target: Math.round(incomeTarget),
      stack: [
        {
          name: "Current total\nhousehold income",
          title: "Current total\nhousehold income",
          value: Math.round(currentTotalIncome),
          total: Math.round(currentTotalIncome),
          color: "#1B625F",
          order: 1,
        },
        {
          name: "Additional income\nwhen income drivers\nare changed",
          title: "Additional income\nwhen income drivers\nare changed",
          value: Math.round(additionalValue),
          total: Math.round(additionalValue),
          color: "#49D985",
          order: 2,
        },
        {
          name: "Gap",
          title: "Gap",
          value: Math.round(gapValue),
          total: Math.round(gapValue),
          color: "#F9CB21",
          order: 3,
        },
      ],
    };
  });
};

const ChartSegmentsIncomeGapScenarioModeling = ({ currentScenarioData }) => {
  const chartData = useMemo(() => {
    const scenarioValues = currentScenarioData?.scenarioValues || [];
    return generateChartData(scenarioValues, true);
  }, [currentScenarioData]);

  const targetChartData = useMemo(
    () => generateTargetChartData(chartData),
    [chartData]
  );

  return (
    <VisualCardWrapper
      title="Optimal driver values to reach your target"
      bordered
    >
      <Chart
        wrapper={false}
        type="BARSTACK"
        data={chartData}
        targetData={targetChartData}
        loading={!chartData.length}
        extra={{ axisTitle: { y: `Income CURRENCY` } }}
        grid={{ right: 161 }}
        // showLabel={showLabel}
        height={385}
      />
    </VisualCardWrapper>
  );
};

export default ChartSegmentsIncomeGapScenarioModeling;
