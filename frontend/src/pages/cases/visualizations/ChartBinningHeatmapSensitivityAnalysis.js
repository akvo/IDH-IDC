import React, { useMemo, useState, useRef } from "react";
import Chart from "../../../components/chart";
import { range } from "lodash";
import { getFunctionDefaultValue } from "../../../lib";
import { Row, Col, Space, Card, Carousel, Button } from "antd";
import { thousandFormatter } from "../../../components/chart/options/common";
import { VisualCardWrapper } from "../components";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

const getOptions = ({
  xAxis = { name: "", min: 0, max: 0 },
  yAxis = { name: "", min: 0, max: 0 },
  binName = "",
  binValue = 0,
  answers = [],
  incomeQuestion = {},
  min = 0,
  max = 0,
  diversified = 0,
  // diversified_feasible = 0,
  target = 0,
  origin = [],
}) => {
  const xAxisData = [
    ...range(xAxis.min, xAxis.max, (xAxis.max - xAxis.min) / 4).map((x) =>
      x.toFixed(2)
    ),
    xAxis.max.toFixed(2),
  ];
  const yAxisData = [
    ...range(yAxis.min, yAxis.max, (yAxis.max - yAxis.min) / 4).map((x) =>
      x.toFixed(2)
    ),
    yAxis.max.toFixed(2),
  ];

  const dt = xAxisData
    .map((h) => {
      return yAxisData.map((d) => {
        const newValues = answers
          .map((m) => {
            if (m.name === binName) {
              return { ...m, value: binValue };
            }
            if (m.name === yAxis.name) {
              return { ...m, value: d };
            }
            if (m.name === xAxis.name) {
              return { ...m, value: h };
            }
            return m;
          })
          .map((x) => ({
            id: `c-${x.qid}`,
            value: x.value,
          }));
        const newTotalValue = getFunctionDefaultValue(
          incomeQuestion.question,
          "c",
          newValues
        );
        // calculate diversified value
        let diversifiedValue = diversified;
        if (binName === "Diversified Income") {
          diversifiedValue = binValue;
        }
        if (yAxis.name === "Diversified Income") {
          diversifiedValue = parseFloat(d);
        }
        if (xAxis.name === "Diversified Income") {
          diversifiedValue = parseFloat(h);
        }
        // EOL calculate diversified value
        return [h, d, (newTotalValue + diversifiedValue).toFixed()];
      });
    })
    .flatMap((x) => x);

  const options = {
    tooltip: {
      position: "top",
      formatter: (params) => {
        const value = params.value[2];
        const x = params.value[0];
        const y = params.value[1];
        let text = `<span style="color: #000;">${value}</span><br>`;
        text += `<span>Income Target: ${
          target ? target?.toFixed() : 0
        }</span><br>`;
        text += `<span>${xAxis.name}: ${x}</span><br>`;
        text += `<span>${yAxis.name}: ${y}</span><br>`;
        return text;
      },
    },
    grid: {
      // height: "50%",
      top: "15%",
      left: "15%",
      right: "5%",
    },
    xAxis: {
      name: `${xAxis.name} (${xAxis.unitName})`,
      nameLocation: "middle",
      nameGap: 40,
      type: "category",
      data: xAxisData,
      splitArea: {
        show: true,
      },
      axisLabel: {
        formatter: (e) => thousandFormatter(e),
      },
    },
    yAxis: {
      name: `${yAxis.name} (${yAxis?.unitName})`,
      type: "category",
      data: yAxisData,
      splitArea: {
        show: true,
      },
      axisLabel: {
        formatter: (e) => thousandFormatter(e),
      },
    },
    visualMap: {
      min: min,
      max: max,
      calculable: true,
      orient: "horizontal",
      left: "center",
      show: false,
      bottom: "15%",
      color: ["#68BEFC", "#d3ecff"],
    },
    series: [
      {
        type: "heatmap",
        data: dt,
        /*
        markLine: {
          lineStyle: {
            type: "solid",
          },
          data: [
            { xAxis: xAxis.min, yAxis: 0 },
            { xAxis: xAxis.max, yAxis: 0 },
            { xAxis: 0, yAxis: yAxis.min },
            { xAxis: 0, yAxis: yAxis.max },
          ],
        },
        */
        label: {
          show: true,
          color: "#fff",
          padding: 5,
          formatter: (params) => {
            const value = params.value[2];
            const binRange = origin.find((x) => x.name === binName);
            if (value >= target && binRange) {
              const isOutRange =
                binRange.current > binRange.feasible
                  ? binValue > binRange.current || binValue < binRange.feasible
                  : binValue < binRange.current || binValue > binRange.feasible;
              if (isOutRange) {
                return `{out|${thousandFormatter(params.value[2])}}`;
              }
            }
            const xAxisRange = origin.find((x) => x.name === xAxis.name);
            const inX =
              xAxisRange?.current < xAxisRange?.feasible
                ? params.value[0] >= xAxisRange?.current &&
                  params.value[0] <= xAxisRange?.feasible
                : params.value[0] <= xAxisRange?.current &&
                  params.value[0] >= xAxisRange?.feasible;
            const yAxisRange = origin.find((x) => x.name === yAxis.name);
            const inY =
              yAxisRange?.current < yAxisRange?.feasible
                ? params.value[1] >= yAxisRange?.current &&
                  params.value[1] <= yAxisRange?.feasible
                : params.value[1] <= yAxisRange?.current &&
                  params.value[1] >= yAxisRange?.feasible;
            const formattedValue = thousandFormatter(value);
            if (value >= target && (!inX || !inY)) {
              return `{out|${formattedValue}}`;
            }
            return value >= target
              ? `{up|${formattedValue}}`
              : `{down|${formattedValue}}`;
          },
          rich: {
            up: {
              color: "#fff",
              backgroundColor: "#218400", // green
              padding: 5,
              fontWeight: 700,
            },
            out: {
              color: "#fff",
              backgroundColor: "#FEC508", // yellow
              padding: 5,
              fontWeight: 700,
            },
            down: {
              color: "#fff",
              backgroundColor: "#F50902", // red
              padding: 5,
              fontWeight: 700,
            },
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
  return options;
};

const heatmapTooltipText = (
  <>
    In each cell of the heatmap, we calculate total household income using the
    values indicated for the binning, X-axis, and Y-axis driver. The other 2
    drivers are at their current levels.
  </>
);

const legends = [
  {
    color: "#F50902",
    text: "Income target not reached",
  },
  {
    color: "#FEC508",
    text: "Income target reached outside feasible values",
  },
  {
    color: "#218400",
    text: "Income target reached within feasible values",
  },
];

const ChartBinningHeatmapSensitivityAnalysis = ({ segment, data, origin }) => {
  const [label, setLabel] = useState(null);
  const elBinningChart1 = useRef(null);
  const elBinningChart2 = useRef(null);
  const elBinningChart3 = useRef(null);
  const binningCarousel = useRef(null);
  const refs = [elBinningChart1, elBinningChart2, elBinningChart3];

  const binningData = useMemo(() => {
    if (!segment?.id) {
      return {};
    }
    // support adjusted custom target
    const adjustedTarget = data?.[`${segment.id}_adjusted-target`] || 0;

    const bins = Object.keys(data)
      .map((x) => {
        const [segmentId, name] = x.split("_");
        return { id: parseInt(segmentId), name, value: data[x] };
      })
      .filter((x) => x.id === segment.id && x.value);
    const answers = segment.answers.filter(
      (s) =>
        s.question?.parent === 1 && s.name === "current" && s.commodityFocus
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
    setLabel(label);

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
          s.question?.parent === null &&
          s.name === "current" &&
          s.commodityFocus
      ),
      min: segment.total_current_income || 0,
      max: segment.total_feasible_income || 0,
      diversified: segment.total_current_diversified_income || 0,
      diversified_feasible: segment.total_feasible_diversified_income || 0,
      target: adjustedTarget
        ? adjustedTarget
        : segment?.target
        ? segment.target
        : 0, // support adjusted target value
    };
  }, [data, segment, origin]);

  const rowTitle = binningData.binCharts?.length ? (
    <Space direction="vertical">
      <div className="section-info">
        Use these heat map visuals to identify the sweet spot (Green values,
        where the income target is met within feasible values). <br />
        <br />
        <b>Action</b>: Adjust and analyse impact of varying income driver
        combinations, values and readjusted income targets, on the feasibility
        of closing the gap
      </div>
      <div className="section-title">{label}</div>
      <Row gutter={[8, 16]} style={{ minHeight: 95 }}>
        <Col span={24}>
          <Space direction="vertical">
            {legends.map((l, li) => (
              <Space key={li}>
                <div
                  style={{
                    backgroundColor: l.color,
                    borderRadius: 100,
                    width: 25,
                    height: 10,
                  }}
                />
                <div>{l.text}</div>
              </Space>
            ))}
          </Space>
        </Col>
      </Row>
    </Space>
  ) : null;

  const renderHeatChart = () => {
    const charts = binningData.binCharts.map((b, key) => {
      const oddKey = (key + 1) % 2 > 0;
      const spanChart = oddKey ? 8 : 8;
      // const filename = `Income Levels for ${b.binName} : ${b.binValue.toFixed(
      //   2
      // )}`;
      const chartTitle = (
        <>
          Income Levels for {b.binName} : {b.binValue.toFixed(2)}{" "}
          <small>({b.unitName})</small>
        </>
      );
      const chart = (
        <VisualCardWrapper
          title={chartTitle}
          tooltipText={heatmapTooltipText}
          bordered
        >
          <Chart
            height={350}
            wrapper={false}
            type="BAR"
            override={getOptions({ ...binningData, ...b, origin: origin })}
          />
        </VisualCardWrapper>
      );
      const leftContent = oddKey ? chart : chart;
      const rightContent = oddKey ? rowTitle : rowTitle;
      return (
        <Card className="card-visual-wrapper no-padding" key={key}>
          <Row gutter={[24, 24]} ref={refs[key]} align="middle">
            <Col span={24 - spanChart}>{leftContent}</Col>
            <Col span={spanChart}>{rightContent}</Col>
          </Row>
        </Card>
      );
    });

    if (!charts.length) {
      return "";
    }

    return (
      <Row gutter={[24, 24]}>
        <Col span={24} className="carousel-container binning-carousel">
          <div className="carousel-arrows-wrapper">
            <div className="arrow-left">
              <Button
                className="button-arrow-carousel"
                type="link"
                icon={<LeftOutlined />}
                onClick={() => binningCarousel?.current?.prev()}
              />
            </div>
            <div className="arrow-right">
              <Button
                className="button-arrow-carousel"
                type="link"
                icon={<RightOutlined />}
                onClick={() => binningCarousel?.current?.next()}
              />
            </div>
          </div>
          <Carousel autoplay ref={binningCarousel}>
            {charts}
          </Carousel>
        </Col>
      </Row>
    );
  };

  return <div>{renderHeatChart()}</div>;
};

export default ChartBinningHeatmapSensitivityAnalysis;
