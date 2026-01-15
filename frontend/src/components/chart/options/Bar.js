import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  AxisLabelFormatter,
  AxisShortLabelFormatter,
  Title,
  axisTitle,
  NoData,
  thousandFormatter,
  formatNumberToString,
} from "./common";
import { sortBy, isEmpty, sumBy } from "lodash";

const Bar = ({
  data,
  percentage,
  chartTitle,
  extra = {},
  horizontal = false,
  grid = {},
}) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }

  // Custom Axis Title
  const { xAxisTitle, yAxisTitle } = axisTitle(extra);
  const total = sumBy(data, "value");
  data = sortBy(data, "order");
  if (percentage) {
    data = data.map((x) => ({ ...x, percentage: (x.value / total) * 100 }));
  }
  const labels = data.map((x) => x.name);
  const option = {
    ...Color,
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    grid: {
      top: grid?.top ? grid.top : horizontal ? 80 : 58,
      bottom: grid?.bottom ? grid.bottom : horizontal ? 80 : 58,
      left: grid?.left ? grid.left : horizontal ? 100 : 100,
      right: grid?.right ? grid.right : horizontal ? 58 : 58,
      show: true,
      label: {
        color: "#222",
        ...TextStyle,
      },
    },
    tooltip: {
      show: true,
      trigger: "item",
      formatter: '<div class="no-border">{b}</div>',
      padding: 5,
      backgroundColor: "#f2f2f2",
      ...TextStyle,
    },
    [horizontal ? "xAxis" : "yAxis"]: {
      type: "value",
      name: yAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 55,
      axisLabel: {
        ...TextStyle,
        color: "#9292ab",
        formatter: function (value) {
          return formatNumberToString(value);
        },
      },
    },
    [horizontal ? "yAxis" : "xAxis"]: {
      type: "category",
      data: labels,
      name: xAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        width: horizontal ? 90 : "auto",
        overflow: horizontal ? "break" : "none",
        interval: 0,
        ...TextStyle,
        color: "#4b4b4e",
        formatter: horizontal
          ? AxisShortLabelFormatter?.formatter
          : AxisLabelFormatter?.formatter,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    series: [
      {
        data: data.map((v, vi) => ({
          name: v.name,
          value: percentage ? v.percentage?.toFixed(2) : v.value,
          count: v.value,
          itemStyle: { color: v.color || Color.color[vi] },
        })),
        type: "bar",
        barMaxWidth: 50,
        label: {
          colorBy: "data",
          position: horizontal ? "insideLeft" : "top",
          show: true,
          padding: 5,
          backgroundColor: "rgba(0,0,0,.3)",
          ...TextStyle,
          color: "#fff",
          formatter: (s) => {
            if (percentage) {
              return `${s.value}%`;
            }
            return thousandFormatter(s.value, 2);
          },
        },
      },
    ],
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
    ...TextStyle,
  };
  return option;
};

export default Bar;
