import React, { useMemo, useState } from "react";
import Chart from "../../../components/chart";
import { range } from "lodash";
import { getFunctionDefaultValue } from "../../../lib";
import { Row, Col, Space, Card } from "antd";
import { thousandFormatter } from "../../../components/chart/options/common";
import { VisualCardWrapper } from "../components";

// Withhout bin value calculation from ChartBinningHeatmapSensitivityAnalysis

const SHOW_VISUAL_DESCRIPTION = false;

const getOptions = ({
  xAxis = { name: "", min: 0, max: 0 },
  yAxis = { name: "", min: 0, max: 0 },
  answers = [],
  incomeQuestion = {},
  min = 0,
  max = 0,
  diversified = 0,
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
        if (yAxis.name === "Diversified Income") {
          diversifiedValue = parseFloat(d);
        }
        if (xAxis.name === "Diversified Income") {
          diversifiedValue = parseFloat(h);
        }
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
    legend: {
      data: [
        {
          name: "Income target is not reached",
          itemStyle: { color: "#FF8F4E" },
        },
        {
          name: "Income target is reached, but at least one driver falls outside of feasible ranges",
          itemStyle: { color: "#FED754" },
        },
        {
          name: "Income target is reached",
          itemStyle: { color: "#5BDD91" },
        },
      ],
      bottom: 8,
      left: "center",
      orient: "horizontal",
      itemGap: 20,
      textStyle: {
        fontSize: 11,
      },
      itemWidth: 12,
      itemHeight: 12,
      icon: "circle",
    },
    grid: {
      top: "15%",
      left: SHOW_VISUAL_DESCRIPTION ? "15%" : "10%",
      right: "5%",
      bottom: "20%",
      containLabel: true,
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
      splitLine: {
        show: true,
        lineStyle: {
          color: "#ddd",
          width: 1,
        },
      },
      axisLabel: {
        formatter: (e) => thousandFormatter(e),
        fontSize: 11,
      },
    },
    yAxis: {
      name: `${yAxis.name} (${yAxis?.unitName})`,
      type: "category",
      data: yAxisData,
      splitArea: {
        show: true,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#ddd",
          width: 1,
        },
      },
      axisLabel: {
        formatter: (e) => thousandFormatter(e),
        fontSize: 11,
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
      color: ["#f2f2f2", "#f2f2f2"],
    },
    series: [
      {
        name: "Income target is not reached",
        type: "heatmap",
        data: dt.filter((item) => {
          const value = item[2];
          return value < target;
        }),
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          color: "#000",
          fontSize: 13,
          fontWeight: 600,
          formatter: (params) => `{down|${thousandFormatter(params.value[2])}}`,
          rich: {
            down: {
              backgroundColor: "#FF8F4E",
              padding: [8, 12],
              fontWeight: 700,
              borderRadius: 10,
              width: "100%",
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
      {
        name: "Income target is reached, but at least one driver falls outside of feasible ranges",
        type: "heatmap",
        data: dt.filter((item) => {
          const value = item[2];
          const xAxisRange = origin.find((x) => x.name === xAxis.name);
          const inX =
            xAxisRange?.current < xAxisRange?.feasible
              ? item[0] >= xAxisRange?.current &&
                item[0] <= xAxisRange?.feasible
              : item[0] <= xAxisRange?.current &&
                item[0] >= xAxisRange?.feasible;
          const yAxisRange = origin.find((x) => x.name === yAxis.name);
          const inY =
            yAxisRange?.current < yAxisRange?.feasible
              ? item[1] >= yAxisRange?.current &&
                item[1] <= yAxisRange?.feasible
              : item[1] <= yAxisRange?.current &&
                item[1] >= yAxisRange?.feasible;
          return value >= target && (!inX || !inY);
        }),
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          color: "#000",
          fontSize: 13,
          fontWeight: 600,
          formatter: (params) => `{out|${thousandFormatter(params.value[2])}}`,
          rich: {
            out: {
              backgroundColor: "#FED754",
              padding: [8, 12],
              fontWeight: 700,
              borderRadius: 10,
              width: "100%",
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
      {
        name: "Income target is reached",
        type: "heatmap",
        data: dt.filter((item) => {
          const value = item[2];
          const xAxisRange = origin.find((x) => x.name === xAxis.name);
          const inX =
            xAxisRange?.current < xAxisRange?.feasible
              ? item[0] >= xAxisRange?.current &&
                item[0] <= xAxisRange?.feasible
              : item[0] <= xAxisRange?.current &&
                item[0] >= xAxisRange?.feasible;
          const yAxisRange = origin.find((x) => x.name === yAxis.name);
          const inY =
            yAxisRange?.current < yAxisRange?.feasible
              ? item[1] >= yAxisRange?.current &&
                item[1] <= yAxisRange?.feasible
              : item[1] <= yAxisRange?.current &&
                item[1] >= yAxisRange?.feasible;
          return value >= target && inX && inY;
        }),
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          color: "#000",
          fontSize: 13,
          fontWeight: 600,
          formatter: (params) => `{up|${thousandFormatter(params.value[2])}}`,
          rich: {
            up: {
              backgroundColor: "#5BDD91",
              padding: [8, 12],
              fontWeight: 700,
              borderRadius: 10,
              width: "100%",
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
    values indicated for the X-axis and Y-axis driver. The other drivers are at
    their current levels.
  </>
);

const legends = [
  {
    color: "#FF8F4E",
    text: "Income target is not reached",
  },
  {
    color: "#FED754",
    text: "Income target is reached, but at least one driver falls outside of feasible ranges",
  },
  {
    color: "#5BDD91",
    text: "Income target is reached",
  },
];

const ChartTwoDriverHeatmap = ({ segment, data, origin }) => {
  const [label, setLabel] = useState(null);

  const heatmapData = useMemo(() => {
    if (!segment?.id) {
      return {};
    }

    const adjustedTarget = data?.[`${segment.id}_adjusted-target`] || 0;

    const dataItems = Object.keys(data)
      .map((x) => {
        const [segmentId, name] = x.split("_");
        return { id: parseInt(segmentId), name, value: data[x] };
      })
      .filter((x) => x.id === segment.id && x.value);

    const answers = segment.answers.filter(
      (s) =>
        s.question?.parent === 1 && s.name === "current" && s.commodityFocus
    );

    const xAxisName =
      dataItems.find((b) => b.name === "x-axis-driver")?.value || "";
    const yAxisName =
      dataItems.find((b) => b.name === "y-axis-driver")?.value || "";

    const label = `At what level of ${xAxisName} and ${yAxisName} do farmers reach the income target?`;
    setLabel(label);

    return {
      xAxis: {
        name: xAxisName,
        min: dataItems.find((b) => b.name === "x-axis-min-value")?.value || 0,
        max: dataItems.find((b) => b.name === "x-axis-max-value")?.value || 0,
        unitName: origin.find((or) => or.name === xAxisName)?.unitName,
      },
      yAxis: {
        name: yAxisName,
        min: dataItems.find((b) => b.name === "y-axis-min-value")?.value || 0,
        max: dataItems.find((b) => b.name === "y-axis-max-value")?.value || 0,
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
      target: adjustedTarget || segment?.target || 0,
    };
  }, [data, segment, origin]);

  if (!heatmapData.xAxis?.name || !heatmapData.yAxis?.name) {
    return null;
  }

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card className="card-visual-wrapper no-padding">
            <Row gutter={[24, 24]} align="middle">
              <Col span={SHOW_VISUAL_DESCRIPTION ? 16 : 24}>
                <VisualCardWrapper
                  title="Income Levels Heatmap"
                  tooltipText={heatmapTooltipText}
                  bordered
                >
                  <Chart
                    height={450}
                    wrapper={false}
                    type="BAR"
                    override={getOptions({ ...heatmapData, origin })}
                  />
                </VisualCardWrapper>
              </Col>
              {SHOW_VISUAL_DESCRIPTION && (
                <Col span={8}>
                  <Space direction="vertical">
                    <div className="section-info">
                      Use this heat map visual to identify the sweet spot (Green
                      values, where the income target is met within feasible
                      values).
                      <br />
                      <br />
                      <b>Action</b>: Adjust and analyse impact of varying income
                      driver combinations, values and readjusted income targets,
                      on the feasibility of closing the gap
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
                </Col>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChartTwoDriverHeatmap;
