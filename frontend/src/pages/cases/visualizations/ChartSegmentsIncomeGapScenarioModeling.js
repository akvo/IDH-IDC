import React, { useMemo, useState, useRef } from "react";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";
import { CurrentCaseState } from "../store";
import { orderBy } from "lodash";
import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  AxisShortLabelFormatter,
  Legend,
  NoData,
  thousandFormatter,
  formatNumberToString,
} from "../../../components/chart/options/common";

export const determineScenarioBarColor = (currentIncome, scenarioIncome) => {
  if (scenarioIncome > currentIncome) {
    return "#49D985"; // Light Green (Increase)
  }
  if (scenarioIncome < currentIncome) {
    return "#FF4D4F"; // Red (Decrease)
  }
  return "#9CC2C1"; // Teal (No Change)
};

export const formatTooltipContent = (item, currency = "") => {
  if (!item) {
    return "";
  }
  const currencySuffix = currency ? ` ${currency}` : "";
  const incomeChangeSign = item.incomeChange > 0 ? "+" : "";
  const changeColor =
    item.incomeChange > 0
      ? "#237804"
      : item.incomeChange < 0
      ? "#FF4D4F"
      : "#4b4b4e";

  return `
    <div style="font-family: inherit; font-size: 13px; min-width: 200px;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; color: #262626;">
        ${item.name}
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #595959;">Current Income:</span>
        <span style="font-weight: 600; color: #1B625F;">${thousandFormatter(
          Math.round(item.currentIncome)
        )}${currencySuffix}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #595959;">Scenario Income:</span>
        <span style="font-weight: 600; color: ${
          item.scenarioColor
        };">${thousandFormatter(
    Math.round(item.scenarioIncome)
  )}${currencySuffix}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #595959;">Income Change:</span>
        <span style="font-weight: 600; color: ${changeColor};">
          ${incomeChangeSign}${thousandFormatter(
    Math.round(item.incomeChange)
  )}${currencySuffix}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #595959;">Income Target:</span>
        <span style="font-weight: 600; color: #262626;">${thousandFormatter(
          Math.round(item.target)
        )}${currencySuffix}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #595959;">Remaining Gap:</span>
        <span style="font-weight: 600; color: #F9CB21;">${thousandFormatter(
          Math.round(item.gap)
        )}${currencySuffix}</span>
      </div>
    </div>
  `.trim();
};

export const generateScenarioModelingChartData = (
  scenarioValues = [],
  segments = [],
  showLabel = false
) => {
  const orderedSegments = orderBy(segments || [], ["id"]);
  const segmentData = orderedSegments.map((segment) => {
    const sv = (scenarioValues || []).find((v) => v.segmentId === segment.id);
    const currentIncome =
      typeof sv?.currentSegmentValue?.total_current_income !== "undefined"
        ? sv.currentSegmentValue.total_current_income
        : segment?.total_current_income || 0;
    const scenarioIncome =
      typeof sv?.updatedSegmentScenarioValue?.total_current_income !==
      "undefined"
        ? sv.updatedSegmentScenarioValue.total_current_income
        : currentIncome;
    const target =
      typeof sv?.currentSegmentValue?.target !== "undefined"
        ? sv.currentSegmentValue.target
        : segment?.target || 0;

    const incomeChange = scenarioIncome - currentIncome;
    const gap = Math.max(0, target - scenarioIncome);
    const scenarioColor = determineScenarioBarColor(
      currentIncome,
      scenarioIncome
    );

    return {
      segmentId: segment.id,
      name: segment.name,
      currentIncome,
      scenarioIncome,
      incomeChange,
      target,
      gap,
      scenarioColor,
    };
  });

  const series = [
    {
      name: "Current total household income",
      type: "bar",
      barMaxWidth: 35,
      barGap: "20%",
      itemStyle: { color: "#1B625F" },
      data: segmentData.map((d) => ({
        name: d.name,
        value: Math.round(d.currentIncome),
        itemStyle: { color: "#1B625F" },
      })),
      label: {
        show: showLabel,
        position: "top",
        color: "#fff",
        backgroundColor: "rgba(0,0,0,.4)",
        padding: [2, 4],
        borderRadius: 3,
        formatter: (params) => formatNumberToString(params.value),
        ...TextStyle,
      },
    },
    {
      name: "Scenario income",
      type: "bar",
      barMaxWidth: 35,
      data: segmentData.map((d) => ({
        name: d.name,
        value: Math.round(d.scenarioIncome),
        itemStyle: { color: d.scenarioColor },
      })),
      label: {
        show: showLabel,
        position: "top",
        color: "#fff",
        backgroundColor: "rgba(0,0,0,.4)",
        padding: [2, 4],
        borderRadius: 3,
        formatter: (params) => formatNumberToString(params.value),
        ...TextStyle,
      },
    },
    {
      name: "Scenario income (increase)",
      type: "line",
      symbol: "circle",
      showSymbol: false,
      lineStyle: { width: 0, opacity: 0 },
      itemStyle: { color: "#49D985" },
      data: [],
    },
    {
      name: "Scenario income (decrease)",
      type: "line",
      symbol: "circle",
      showSymbol: false,
      lineStyle: { width: 0, opacity: 0 },
      itemStyle: { color: "#FF4D4F" },
      data: [],
    },
    {
      name: "Scenario income (no change)",
      type: "line",
      symbol: "circle",
      showSymbol: false,
      lineStyle: { width: 0, opacity: 0 },
      itemStyle: { color: "#9CC2C1" },
      data: [],
    },
    {
      name: "Income Target",
      type: "line",
      symbol: "diamond",
      symbolSize: 15,
      color: "#000000",
      lineStyle: { width: 0 },
      itemStyle: { color: "#000000" },
      data: segmentData.map((d) => ({
        name: "Benchmark",
        value: Math.round(d.target),
      })),
      z: 10,
    },
  ];

  return {
    segmentData,
    series,
  };
};

export const getScenarioModelingChartOptions = ({
  segmentData = [],
  series = [],
  currency = "",
  grid = {},
}) => {
  if (!segmentData.length) {
    return NoData;
  }

  const xAxisData = segmentData.map((d) => d.name);

  return {
    ...Color,
    ...backgroundColor,
    ...Easing,
    legend: {
      ...Legend,
      selectedMode: false,
      data: [
        {
          name: "Current total household income",
          icon: "circle",
          itemStyle: { color: "#1B625F" },
        },
        {
          name: "Scenario income (increase)",
          icon: "circle",
          itemStyle: { color: "#49D985" },
        },
        {
          name: "Scenario income (decrease)",
          icon: "circle",
          itemStyle: { color: "#FF4D4F" },
        },
        {
          name: "Scenario income (no change)",
          icon: "circle",
          itemStyle: { color: "#9CC2C1" },
        },
        {
          name: "Income Target",
          icon: "diamond",
          itemStyle: { color: "#000000" },
        },
      ],
      top: 5,
      left: "center",
      orient: "horizontal",
    },
    grid: {
      top: grid?.top || 75,
      bottom: grid?.bottom || 25,
      left: grid?.left || 50,
      right: grid?.right || 20,
      containLabel: true,
      show: true,
      label: {
        color: "#222",
        ...TextStyle,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      show: true,
      backgroundColor: "#ffffff",
      padding: 10,
      formatter: (params) => {
        if (!params || !params.length) {
          return "";
        }
        const dataIndex = params[0].dataIndex;
        const item = segmentData[dataIndex];
        return formatTooltipContent(item, currency);
      },
      ...TextStyle,
    },
    xAxis: {
      type: "category",
      data: xAxisData,
      axisLabel: {
        width: 100,
        interval: 0,
        overflow: "break",
        ...TextStyle,
        color: "#4b4b4e",
        formatter: AxisShortLabelFormatter?.formatter,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      name: `Income ${currency || ""}`.trim(),
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 55,
      axisLabel: {
        ...TextStyle,
        color: "#9292ab",
        formatter: (value) => formatNumberToString(value),
      },
    },
    series,
  };
};

const ChartSegmentsIncomeGapScenarioModeling = ({ currentScenarioData }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { segments, currency } = currentCase || {};

  const [showLabel, setShowLabel] = useState(false);
  const chartRef = useRef(null);

  const { chartOptions, loading } = useMemo(() => {
    if (!segments?.length) {
      return { chartOptions: null, loading: true };
    }

    const { segmentData, series } = generateScenarioModelingChartData(
      currentScenarioData?.scenarioValues || [],
      segments,
      showLabel
    );

    const options = getScenarioModelingChartOptions({
      segmentData,
      series,
      currency,
      grid: { top: 75, right: 20, left: 50, bottom: 25 },
    });

    return {
      chartOptions: options,
      loading: false,
    };
  }, [currentScenarioData, segments, currency, showLabel]);

  return (
    <VisualCardWrapper
      title="Optimal driver values to reach your target"
      bordered
      showLabel={showLabel}
      setShowLabel={setShowLabel}
      exportElementRef={chartRef}
      exportFilename="Optimal driver values to reach your target"
    >
      <div ref={chartRef} style={{ width: "100%", height: 385 }}>
        <Chart
          wrapper={false}
          override={chartOptions}
          loading={loading}
          height={385}
        />
      </div>
    </VisualCardWrapper>
  );
};

export default ChartSegmentsIncomeGapScenarioModeling;
