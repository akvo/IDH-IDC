import React, { useMemo, useRef, useState } from "react";
import { thousandFormatter } from "../../../components/chart/options/common";
import { getFunctionDefaultValue } from "../components";
import { range } from "lodash";
import { Row, Col, Card, Space } from "antd";
import Chart from "../../../components/chart";
import { SaveAsImageButton } from "../../../components/utils";

/**
 * NOTE
 * Target = 9001,
 * Diversified = 9002
 */
const yAxisCalculation = {
  "#2": "#9001 - #9002 + #5  / (#4 * #3)", // area
  "#3": "#9001 - #9002 + #5  / (#4 * #2)", // volume
  "#4": "#9001 - #9002 + #5  / (#3 * #2)", // price
  "#5": "#9001 - #9002 - (#2 * #4 * #3)", // CoP
  "#9002": "#9001 + #5 - (#2 * #4 * #3)", // diversified
};

const getOptions = ({
  xAxis = { name: "", min: 0, max: 0 },
  yAxis = { name: "", min: 0, max: 0 },
  answers = [],
  binCharts = [],
  diversified = 0,
  total_current_income,
  // target = 0,
  // origin = [],
}) => {
  const xAxisData = [
    ...range(xAxis.min, xAxis.max, (xAxis.max - xAxis.min) / 5).map((x) =>
      x.toFixed(2)
    ),
    xAxis.max.toFixed(2),
  ];

  const yAxisId = yAxis.name.includes("Diversified")
    ? 9002
    : answers.find((a) => a.name === yAxis.name)?.qid;
  const yAxisDefaultValue = { default_value: yAxisCalculation[`#${yAxisId}`] };

  const series = binCharts.map((b) => {
    const bId = b.binName.includes("Diversified")
      ? 9002
      : answers.find((a) => a.name === b.binName)?.qid;
    const dt = xAxisData
      .map((h) => {
        let newValues = answers
          .filter((m) => m.name !== b.binName)
          .map((m) => {
            if (m.name === xAxis.name) {
              return { ...m, value: h };
            }
            return m;
          })
          .map((x) => ({
            id: `c-${x.qid}`,
            value: x.value,
          }));
        newValues = [
          ...newValues,
          {
            id: "c-9001",
            value: total_current_income,
          },
          {
            id: "c-9002",
            value: diversified,
          },
          {
            id: `c-${bId}`,
            value: b.binValue,
          },
        ];
        const newYAxisValue = getFunctionDefaultValue(
          yAxisDefaultValue,
          "c",
          newValues
        );
        return newYAxisValue.toFixed(2);
      })
      .flatMap((x) => x);
    return {
      type: "line",
      smooth: true,
      stack: yAxis.name,
      name: `${b.binName}: ${b.binValue}`,
      data: dt,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    };
  });
  const legends = binCharts.map((b) => `${b.binName}: ${b.binValue}`);

  const options = {
    legend: {
      data: legends,
      bottom: 0,
      left: 0,
      formatter: (name) => {
        const [text, value] = name.split(": ");
        const formatValue = thousandFormatter(parseFloat(value));
        return `${text}: ${formatValue}`;
      },
    },
    tooltip: {
      position: "top",
      formatter: (p) => {
        const [seriesName, seriesValue] = p.seriesName.split(": ");
        const newSeriesName = `${seriesName}: ${thousandFormatter(
          parseFloat(seriesValue)
        )}`;
        const xValue = thousandFormatter(parseFloat(p.name));
        const yValue = thousandFormatter(parseFloat(p.value));
        let text = `<span style="color: #000;">${newSeriesName}</span><br>`;
        text += `<span>${xAxis.name}: ${xValue}</span><br>`;
        text += `<span>${yAxis.name}: ${yValue}</span><br>`;
        return text;
      },
    },
    grid: {
      top: "10%",
      bottom: "30%",
      left: "12%",
    },
    xAxis: {
      name: `${xAxis.name} (${xAxis.unitName})`,
      nameLocation: "middle",
      boundaryGap: true,
      nameGap: 40,
      type: "category",
      data: xAxisData,
      axisLabel: {
        formatter: (e) => thousandFormatter(e),
      },
    },
    yAxis: {
      name: `${yAxis.name} (${yAxis?.unitName})`,
      type: "value",
      axisLabel: {
        formatter: (e) => thousandFormatter(e),
      },
    },
    series: series,
  };
  return options;
};

const ChartSensitivityAnalysisLine = ({ data, segment, origin }) => {
  const [label, setLabel] = useState(null);
  const [chartTitle, setChartTitle] = useState(null);
  const elLineChart = useRef(null);

  const binningData = useMemo(() => {
    if (!segment?.id) {
      return {};
    }
    const bins = Object.keys(data)
      .map((x) => {
        const [segmentId, name] = x.split("_");
        return { id: parseInt(segmentId), name, value: data[x] };
      })
      .filter((x) => x.id === segment.id && x.value);
    const answers = segment.answers.filter(
      (s) => s.question.parent === 1 && s.name === "current" && s.commodityFocus
    );
    const binCharts = bins.filter(
      (b) => b.name.startsWith("binning-value") && b.value
    );
    const binName =
      bins.find((b) => b.name === "binning-driver-name")?.value || false;
    const xAxisName = bins.find((b) => b.name === "x-axis-driver")?.value || "";
    const yAxisName = bins.find((b) => b.name === "y-axis-driver")?.value || "";
    // label
    const label = `The following tables represent combination ${yAxisName} and ${xAxisName} to reach the income target for a each ${
      binName ? binName : ""
    } bin.`;
    setLabel(label);
    // chart title
    setChartTitle(`Combination ${yAxisName} and ${xAxisName} value`);

    return {
      binCharts: binName
        ? binCharts.map((b) => ({
            binName: binName,
            binValue: b.value,
            unitName: origin.find((or) => or.name === binName)?.unitName,
          }))
        : [],
      xAxis: {
        name: xAxisName,
        min: bins.find((b) => b.name === "x-axis-min-value")?.value || 0,
        max: bins.find((b) => b.name === "x-axis-max-value")?.value || 0,
        unitName: origin.find((or) => or.name === xAxisName)?.unitName,
      },
      yAxis: {
        name: yAxisName,
        min: bins.find((b) => b.name === "y-axis-min-value")?.value || 0,
        max: bins.find((b) => b.name === "y-axis-max-value")?.value || 0,
        unitName: origin.find((or) => or.name === yAxisName)?.unitName,
      },
      answers: answers.map((s) => ({
        qid: s.question.id,
        name: s.question.text,
        value: s.value,
      })),
      incomeQuestion: segment.answers.find(
        (s) =>
          s.question.parent === null && s.name === "current" && s.commodityFocus
      ),
      total_current_income: segment.total_current_income,
      total_feasible_income: segment.total_feasible_income,
      diversified: segment.total_current_diversified_income,
      diversified_feasible: segment.total_feasible_diversified_income,
      target: segment.target,
    };
  }, [data, segment, origin]);

  return (
    <Col span={24}>
      <Row gutter={[24, 24]} ref={elLineChart}>
        <Col span={8}>
          <Space direction="vertical" className="binning-chart-info-wrapper">
            <div className="segment">
              <b>{segment.name}</b>
            </div>
            <div className="label">{label}</div>
          </Space>
        </Col>
        <Col span={16}>
          <Card
            title={chartTitle}
            className="chart-card-wrapper with-padding"
            extra={
              <SaveAsImageButton
                elementRef={elLineChart}
                filename="Title"
                type="ghost-white"
              />
            }
          >
            <Chart
              height={350}
              wrapper={false}
              type="BAR"
              override={getOptions({ ...binningData, origin: origin })}
            />
          </Card>
        </Col>
      </Row>
    </Col>
  );
};

export default ChartSensitivityAnalysisLine;
