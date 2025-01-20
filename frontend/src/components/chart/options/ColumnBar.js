import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  AxisLabelFormatter,
  Title,
  axisTitle,
  NoData,
  Legend,
  thousandFormatter,
  LabelStyle,
  formatNumberToString,
} from "./common";
import { sortBy, isEmpty, groupBy, orderBy } from "lodash";

const customFormatter = {
  formatter: function (params) {
    if (!params?.data?.stack?.length) {
      return `<div>${params.name}: <b>${thousandFormatter(
        params.value
      )}</b><div>`;
    }
    // handle stack/commodities without breakdowndrivers
    const stackValues = params.data.stack.filter((x) => x.value);
    if (!stackValues?.length) {
      return `<div><b>${
        params.name
      }</b>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>${thousandFormatter(
        params.value
      )}</b><div>`;
    }
    let customTooltip = "<div>";
    customTooltip += `<b>${params.name}</b>`;
    customTooltip +=
      "<ul style='list-style-type: none; margin: 0; padding: 0;'>";
    orderBy(params.data.stack, "order").forEach((it) => {
      customTooltip += `<li key=${it.order}>
        <span>- ${it.name}:</span>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <span style="float: right;">
        <b>${thousandFormatter(it.value)}</b>
        </span>
      </li>`;
    });
    customTooltip += "</ul></div>";
    return customTooltip;
  },
};

const ColumnBar = ({
  data = [],
  chartTitle,
  extra = {},
  horizontal = false,
  grid = {},
  showLabel = true,
  series = [],
}) => {
  if ((isEmpty(data) || !data) && (isEmpty(series) || !series)) {
    return NoData;
  }

  // Custom Axis Title
  const { xAxisTitle, yAxisTitle } = axisTitle(extra);
  const xAxisLabel = extra?.xAxisLabel || {};

  data = sortBy(data, "order");

  const labels = data.map((x) => x.name);
  let transformSeries = [];

  if (data.length && !series.length) {
    const grouped = groupBy(
      data.flatMap((d) => d.data),
      "name"
    );
    transformSeries = Object.keys(grouped).map((key, ki) => {
      const values = grouped[key];
      return {
        name: key,
        title: key,
        data: values.map((v, vi) => ({
          ...v,
          value: v.value,
          itemStyle: { color: v.color || Color.color[vi] },
        })),
        type: "bar",
        barMaxWidth: 50,
        label: {
          ...LabelStyle.label,
          colorBy: "data",
          position: horizontal ? "insideLeft" : "top",
          show: showLabel,
          padding: 5,
          backgroundColor: "rgba(0,0,0,.3)",
          ...TextStyle,
          color: "#fff",
        },
        color: values?.[0]?.color || Color.color[ki],
      };
    });
  }

  const legends = transformSeries.map((s, si) => ({
    name: s.name,
    itemStyle: { color: s.color || Color.color[si] },
  }));

  const option = {
    ...Color,
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    legend: {
      ...Legend,
      data: legends,
      top: 15,
      left: "center",
    },
    grid: {
      top: grid?.top ? grid.top : horizontal ? 80 : 70,
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
      formatter: customFormatter.formatter,
      padding: 5,
      backgroundColor: "#f2f2f2",
      ...TextStyle,
    },
    [horizontal ? "xAxis" : "yAxis"]: {
      type: "value",
      name: yAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 75,
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
        formatter: AxisLabelFormatter?.formatter,
        ...xAxisLabel,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    series: transformSeries,
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
    ...TextStyle,
  };
  return option;
};

export default ColumnBar;
