import React, { useMemo, useState, useRef } from "react";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";
import { CurrentCaseState } from "../store";

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
    const newTotalIncome =
      d?.updatedSegmentScenarioValue?.total_current_income || 0;

    // Floor values at 0 for visualization consistency
    const safeCurrentIncome = Math.max(0, currentTotalIncome);
    const safeNewIncome = Math.max(0, newTotalIncome);

    const baseValue = safeCurrentIncome;
    const changeValue = Math.max(0, safeNewIncome - safeCurrentIncome);
    const gapValue = Math.max(0, incomeTarget - safeNewIncome);

    const changeLabel = "Additional income\nwhen income drivers\nare changed";
    const changeColor = "#49D985"; // Light Green

    return {
      name: current ? d.name : `${d.scenarioName}-${d.name}`,
      target: Math.round(incomeTarget),
      stack: [
        {
          name: "Current total\nhousehold income",
          title: "Current total\nhousehold income",
          value: Math.round(baseValue),
          total: Math.round(baseValue),
          color: "#1B625F",
          order: 1,
        },
        {
          name: changeLabel,
          title: changeLabel,
          value: Math.round(changeValue),
          total: Math.round(changeValue),
          color: changeColor,
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
  const currentCase = CurrentCaseState.useState((s) => s);

  const [showLabel, setShowLabel] = useState(false);
  const chartRef = useRef(null);

  const chartData = useMemo(() => {
    const scenarioValues = currentScenarioData?.scenarioValues?.map((sv) => {
      const findSegment = currentCase?.segments?.find(
        (s) => s.id === sv.segmentId
      );
      return {
        ...sv,
        name: findSegment?.name || sv.name,
      };
    });
    return generateChartData(scenarioValues, true);
  }, [currentScenarioData, currentCase?.segments]);

  const targetChartData = useMemo(
    () => generateTargetChartData(chartData),
    [chartData]
  );

  return (
    <VisualCardWrapper
      title="Optimal driver values to reach your target"
      bordered
      showLabel={showLabel}
      setShowLabel={setShowLabel}
      exportElementRef={chartRef}
      exportFilename="Optimal driver values to reach your target"
    >
      <Chart
        wrapper={false}
        type="BARSTACK"
        data={chartData}
        targetData={targetChartData}
        loading={!chartData.length}
        extra={{
          axisTitle: { y: `Income ${currentCase?.currency || ""}` },
          legend: {
            top: 0,
            left: "top",
            orient: "horizontal",
          },
        }}
        grid={{ top: 60, right: 5, left: 35, bottom: 10 }}
        showLabel={showLabel}
        height={385}
      />
    </VisualCardWrapper>
  );
};

export default ChartSegmentsIncomeGapScenarioModeling;
