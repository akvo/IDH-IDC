import React, { useMemo, useRef, useState } from "react";
import { Card, Col, Row, Space, Image } from "antd";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";
import { range, orderBy, uniq, max } from "lodash";
import { getFunctionDefaultValue } from "../../../lib";
import { yAxisFormula } from "../../../lib/formula";
import { thousandFormatter } from "../../../components/chart/options/common";
import SensitivityAnalisysImg from "../../../assets/images/sensitivity-analysis-line-chart.png";

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
      bottom: 10,
      left: 10,
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
      top: "12%",
      bottom: "25%",
      left: "15%",
      right: "5%",
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
      min: xAxis.min.toFixed(2),
      max: xAxis.max.toFixed(2),
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

const lineChartTooltipText = (
  <span>
    We calculate what value for the Y-axis driver should be to reach the income
    target. For any commodities in the crop category, we use the formula:
    &apos;Income target = (Area x Volume x Price) - (Area x CoP) + diversified
    income&apos;. For any commodities in the aquaculture category, we use the
    formula: &apos;Income target = (Area x Volume x Price) - (Area x Volume x
    CoP) + diversified income&apos;. The Y-axis driver value is unknown, while
    all the values for the other drivers and income target are known. By
    transforming the mentioned formulas, we can then calculate what the value
    should be for the Y-axis driver.
  </span>
);

const ChartBinningDriversSensitivityAnalysis = ({
  data,
  segment,
  origin,
  setAdjustTargetVisible = () => {},
}) => {
  const [label, setLabel] = useState(null);
  const [chartTitle, setChartTitle] = useState(null);
  const [description, setDescription] = useState(null);

  const elLineChart = useRef(null);

  const binningData = useMemo(() => {
    if (!segment?.id) {
      return {};
    }
    // support adjusted custom target
    const adjustedTarget = data?.[`${segment.id}_adjusted-target`] || 0;

    const bins = Object.keys(data)
      .filter((x) => !x.includes("adjusted-target"))
      .map((x) => {
        const [segmentId, name] = x?.split("_") || [];
        return { id: parseInt(segmentId), name, value: data[x] };
      })
      .filter((x) => x.id === segment.id && x.value);
    const answers = segment.answers.filter(
      (s) =>
        s.question?.parent === 1 && s.name === "current" && s.commodityFocus
    );
    const feasibleAnswers = segment.answers.filter(
      (s) =>
        s.question?.parent === 1 && s.name === "feasible" && s.commodityFocus
    );
    const binCharts = bins.filter(
      (b) => b.name.startsWith("binning-value") && b.value
    );
    const binName =
      bins.find((b) => b.name === "binning-driver-name")?.value || false;
    const xAxisName = bins.find((b) => b.name === "x-axis-driver")?.value || "";
    const yAxisName = bins.find((b) => b.name === "y-axis-driver")?.value || "";
    // label
    const label = `At what level of ${xAxisName}, ${yAxisName}, ${
      binName ? binName : ""
    } do farmers reach the income target?`;

    const description = (
      <>
        This line graph illustrates whether the income target is reached at
        different levels of {binName ? binName : ""}, given your selected
        combination of {xAxisName} (horizontal axis) and {yAxisName} (vertical
        axis).
        <br />
        <br />
        When a data point is within the dark orange zone, it means your income
        target is achieved at the current combination of {xAxisName},{" "}
        {yAxisName}, and {binName ? binName : ""}. When a data point falls
        within the light orange zone, the selected levels of {xAxisName} and{" "}
        {yAxisName} are feasible, but the income target is not yet achieved at
        this particular level of {binName ? binName : ""}.
        <br />
        <br />
        Consult this graph to determine exactly at which level(s) of{" "}
        {binName ? binName : ""} your current selections of {xAxisName} and{" "}
        {yAxisName} meet or fail to meet your income target. For more detailed
        exploration of specific combinations, refer to the heatmaps below.
      </>
    );
    setLabel(label);
    setDescription(description);
    // chart title
    setChartTitle("Influence of income drivers on reaching the income target");

    const binChartsRes = binName
      ? binCharts.map((b) => ({
          binName: binName,
          binValue: b.value,
          unitName: origin.find((or) => or.name === binName)?.unitName,
        }))
      : [];

    setAdjustTargetVisible(binChartsRes?.length);

    return {
      binCharts: binChartsRes,
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
          s.question?.parent === null &&
          s.name === "current" &&
          s.commodityFocus
      ),
      total_current_income: segment.total_current_income,
      total_feasible_income: segment.total_feasible_income,
      diversified: segment.total_current_diversified_income,
      diversified_feasible: segment.total_feasible_diversified_income,
      target: adjustedTarget
        ? adjustedTarget
        : segment?.target
        ? segment.target
        : 0, // support adjusted target value
    };
  }, [data, segment, origin, setAdjustTargetVisible]);

  if (!binningData.binCharts?.length) {
    return null;
  }

  return (
    <Card className="card-visual-wrapper no-padding" style={{ marginTop: 20 }}>
      <Row gutter={[20, 20]} align="start">
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">{label}</div>
            <div className="section-description">{description}</div>
            <Space align="center" style={{ marginTop: "5px" }}>
              <Image src={SensitivityAnalisysImg} preview={false} width={75} />
              <p>
                The orange zone represents the range between current and
                feasible values for the X and Y-axis drivers.
              </p>
            </Space>
          </Space>
        </Col>
        <Col span={16}>
          <VisualCardWrapper
            title={chartTitle}
            tooltipText={lineChartTooltipText}
            bordered
            exportElementRef={elLineChart}
            exportFilename={chartTitle}
          >
            <Chart
              height={525}
              wrapper={false}
              type="BAR"
              override={getOptions({ ...binningData, origin: origin })}
            />
          </VisualCardWrapper>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartBinningDriversSensitivityAnalysis;
