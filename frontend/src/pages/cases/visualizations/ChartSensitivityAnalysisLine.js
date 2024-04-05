import React, { useMemo, useRef, useState } from "react";
import { thousandFormatter } from "../../../components/chart/options/common";
import { getFunctionDefaultValue, yAxisFormula } from "../components";
import { range, orderBy, uniq, max } from "lodash";
import { Row, Col, Card, Space } from "antd";
import Chart from "../../../components/chart";
import { SaveAsImageButton } from "../../../components/utils";

const getOptions = ({
  xAxis = { name: "", min: 0, max: 0 },
  yAxis = { name: "", min: 0, max: 0 },
  answers = [],
  feasibleAnswers = [],
  binCharts = [],
  diversified = 0,
  diversified_feasible = 0,
  target = 0,
  // origin = [],
}) => {
  // Find x Axis curret feasible value
  const xAxisCurrentValue = xAxis.name.includes("Diversified")
    ? diversified
    : answers.find((a) => a.name === xAxis.name)?.value || 0;
  const xAxisFeasibleValue = xAxis.name.includes("Diversified")
    ? diversified_feasible
    : feasibleAnswers.find((fa) => fa.name === xAxis.name)?.value || 0;

  // Find y Axis curret feasible value
  const yAxisCurrentValue = yAxis.name.includes("Diversified")
    ? diversified
    : answers.find((a) => a.name === yAxis.name)?.value || 0;
  const yAxisFeasibleValue = yAxis.name.includes("Diversified")
    ? diversified_feasible
    : feasibleAnswers.find((fa) => fa.name === yAxis.name)?.value || 0;

  let xAxisData = [
    ...range(xAxis.min, xAxis.max, (xAxis.max - xAxis.min) / 20).map((x) =>
      x.toFixed(2)
    ),
    xAxis.max.toFixed(2),
  ];
  // add x axis current feasible value into xAxisData
  xAxisData = orderBy(
    uniq(
      [...xAxisData, xAxisCurrentValue, xAxisFeasibleValue].map((x) =>
        parseFloat(x)
      )
    )
  ).map((x) => x.toFixed(2));

  const yAxisId = yAxis.name.includes("Diversified")
    ? 9002
    : answers.find((a) => a.name === yAxis.name)?.qid;
  const yAxisDefaultValue = { default_value: yAxisFormula[`#${yAxisId}`] };

  const series = yAxisDefaultValue.default_value
    ? binCharts.map((b) => {
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
                id: `line-${x.qid}`,
                value: x.value,
              }));
            newValues = [
              ...newValues,
              {
                id: "line-9001",
                value: target, // total income using target value
              },
              {
                id: "line-9002",
                value: diversified,
              },
              {
                id: `line-${bId}`,
                value: b.binValue,
              },
            ];
            const newYAxisValue = getFunctionDefaultValue(
              yAxisDefaultValue,
              "line",
              newValues
            );
            return newYAxisValue?.toFixed(2);
          })
          .flatMap((x) => x);
        return {
          type: "line",
          smooth: true,
          name: `${b.binName}: ${b.binValue}`,
          data: dt,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        };
      })
    : [];

  const legends = binCharts.map((b) => `${b.binName}: ${b.binValue}`);

  const seriesMarkArea = {
    name: null,
    type: "line",
    data: [],
    markArea: {
      itemStyle: {
        color: "rgba(255, 143, 78, 0.175)",
      },
      data: [
        [
          {
            name: null,
            xAxis: xAxisCurrentValue?.toFixed(2),
          },
          {
            xAxis: xAxisFeasibleValue?.toFixed(2),
          },
        ],
        [
          {
            name: null,
            yAxis: yAxisCurrentValue?.toFixed(2),
          },
          {
            yAxis: yAxisFeasibleValue?.toFixed(2),
          },
        ],
      ],
    },
  };

  const maxDataValue = max(
    series.flatMap((s) => s.data).map((x) => parseFloat(x))
  );

  const options = {
    legend: {
      data: legends,
      bottom: 0,
      left: 0,
      formatter: (name) => {
        const [text, value] = name?.split(": ") || [];
        const formatValue = thousandFormatter(parseFloat(value));
        return `${text}: ${formatValue}`;
      },
    },
    tooltip: {
      position: "top",
      formatter: (p) => {
        if (!p?.seriesName) {
          return null;
        }
        const [seriesName, seriesValue] = p.seriesName?.split(": ") || [];
        const newSeriesName = `${seriesName}: ${thousandFormatter(
          parseFloat(seriesValue)
        )}`;
        const xValue = thousandFormatter(parseFloat(p.name));
        const yValue = thousandFormatter(parseFloat(p.value));
        let text = `<span style="color: #000;">${newSeriesName}</span><br>`;
        text += `<span>Income Target: ${
          target ? target?.toFixed() : 0
        }</span><br>`;
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
      max:
        maxDataValue > yAxisFeasibleValue
          ? Math.round(maxDataValue)
          : yAxis.max < yAxisFeasibleValue
          ? yAxisFeasibleValue
          : yAxis.max,
    },
    series: [...series, seriesMarkArea],
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
        const [segmentId, name] = x?.split("_") || [];
        return { id: parseInt(segmentId), name, value: data[x] };
      })
      .filter((x) => x.id === segment.id && x.value);
    const answers = segment.answers.filter(
      (s) => s.question.parent === 1 && s.name === "current" && s.commodityFocus
    );
    const feasibleAnswers = segment.answers.filter(
      (s) =>
        s.question.parent === 1 && s.name === "feasible" && s.commodityFocus
    );
    const binCharts = bins.filter(
      (b) => b.name.startsWith("binning-value") && b.value
    );
    const binName =
      bins.find((b) => b.name === "binning-driver-name")?.value || false;
    const xAxisName = bins.find((b) => b.name === "x-axis-driver")?.value || "";
    const yAxisName = bins.find((b) => b.name === "y-axis-driver")?.value || "";
    // label
    const label = `At what level of ${yAxisName}, ${xAxisName}, ${
      binName ? binName : ""
    } will we reach the income target?`;
    setLabel(label);
    // chart title
    setChartTitle(
      "Understanding the influence of a combination of income drivers on reaching the income target"
    );

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
      feasibleAnswers: feasibleAnswers.map((s) => ({
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

  return binningData.binCharts?.length ? (
    <Col span={24}>
      <Row gutter={[24, 24]}>
        <Col span={8}>
          <Space direction="vertical" className="binning-chart-info-wrapper">
            {/* <div className="segment">
              <b>{segment.name}</b>
            </div> */}
            <div className="label">{label}</div>
            <p>
              This line graph illustrates how different levels of the binning
              driver, in combination with the X and Y-axis drivers, affect
              farmers progress toward reaching the income target. By examining
              this line graph, you can make informed decisions about the
              feasibility of reaching the income target for farmers. For more
              granular information related to each line, please refer to the
              respective heatmaps provided below.
              <br />
              <br />
              Insight: When the lines are within the dark orange zone, it
              signals that the income target has been successfully achieved
              within feasible levels of the income drivers. On the other hand,
              if a line falls into the light orange zone, it indicates that the
              income drivers are within their feasible values, but the income
              target is not reached. This information allows you to assess which
              combinations of income driver levels are most likely to lead to
              the desired income target.
            </p>
          </Space>
        </Col>
        <Col span={16} ref={elLineChart}>
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
              height={400}
              wrapper={false}
              type="BAR"
              override={getOptions({ ...binningData, origin: origin })}
            />
          </Card>
        </Col>
      </Row>
    </Col>
  ) : (
    ""
  );
};

export default ChartSensitivityAnalysisLine;
