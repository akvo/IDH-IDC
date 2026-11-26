import React, { useMemo, useRef, useState } from "react";
import { Button, Radio, Switch, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { downloadUrl, formatNumber } from "../utils";

export const CHART_TITLE = "How many modules have users completed?";
export const CHART_COLOR = "#01625f";
export const UNIT_PERCENTAGE = "percentage";
export const UNIT_NUMBER = "number";

const unitOptions = [
  { label: "%", value: UNIT_PERCENTAGE },
  { label: "Number", value: UNIT_NUMBER },
];

const moduleLabel = (modules) => `${modules} module${modules === 1 ? "" : "s"}`;

export const getChartOption = ({ distribution = [], unit, showLabel }) => {
  const isPercentage = unit === UNIT_PERCENTAGE;
  return {
    grid: { left: 8, right: 8, top: 32, bottom: 8, containLabel: true },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: ([param]) => {
        const bin = distribution[param.dataIndex];
        return `${moduleLabel(bin.modules_completed)}: ${formatNumber(
          bin.count
        )} users (${bin.percentage}%)`;
      },
    },
    xAxis: {
      type: "category",
      data: distribution.map((bin) => `${bin.modules_completed}`),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#6b7280", fontSize: 14 },
    },
    // Bars scale to the data; the values are on the labels (Figma 13036:20503)
    yAxis: { type: "value", show: false },
    series: [
      {
        type: "bar",
        barWidth: "45%",
        data: distribution.map((bin) =>
          isPercentage ? bin.percentage : bin.count
        ),
        itemStyle: { color: CHART_COLOR, borderRadius: [4, 4, 0, 0] },
        label: {
          show: showLabel,
          position: "top",
          color: "#6b7280",
          formatter: ({ value }) =>
            isPercentage ? `${value}%` : formatNumber(value),
        },
      },
    ],
  };
};

const ModuleDistributionChart = ({ distribution = [], loading = false }) => {
  const chartRef = useRef(null);
  const [unit, setUnit] = useState(UNIT_PERCENTAGE);
  const [showLabel, setShowLabel] = useState(true);

  const option = useMemo(
    () => getChartOption({ distribution, unit, showLabel }),
    [distribution, unit, showLabel]
  );

  const handleDownload = () => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) {
      return;
    }
    const url = instance.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    downloadUrl(url, "li_academy_modules_completed.png");
  };

  return (
    <div
      className="academy-stats-card academy-stats-chart"
      data-testid="module-distribution-chart"
    >
      <div className="academy-stats-chart__header">
        <h3 className="academy-stats-chart__title">
          {CHART_TITLE}{" "}
          <Tooltip title="Share of Academy users by how many of the 6 modules they have completed.">
            <QuestionCircleOutlined aria-label="About this chart" />
          </Tooltip>
        </h3>
        <Button
          className="button-ghost"
          size="small"
          onClick={handleDownload}
          disabled={!distribution.length}
          data-testid="btn-download-chart"
        >
          Download chart
        </Button>
      </div>
      <div className="academy-stats-chart__controls">
        <span className="academy-stats-chart__control">
          <span className="academy-stats-chart__control-label">Show as</span>
          <Radio.Group
            size="small"
            optionType="button"
            options={unitOptions}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            data-testid="chart-unit-toggle"
          />
        </span>
        <span className="academy-stats-chart__control">
          <Switch
            size="small"
            checked={showLabel}
            onChange={setShowLabel}
            aria-label="Show label"
            data-testid="chart-show-label"
          />
          <span>Show label</span>
        </span>
      </div>
      <ReactECharts
        ref={chartRef}
        option={option}
        notMerge
        showLoading={loading}
        style={{ height: 320, width: "100%" }}
      />
    </div>
  );
};

export default ModuleDistributionChart;
