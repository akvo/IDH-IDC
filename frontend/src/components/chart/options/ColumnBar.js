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
  Legend,
  thousandFormatter,
  LabelStyle,
} from "./common";
import { sortBy, isEmpty, groupBy, orderBy } from "lodash";

const customFormatter = {
  formatter: function (params) {
    if (!params?.data?.stack?.length) {
      return `<b>${params.name}</b>: ${thousandFormatter(params.value)}`;
    }
    let customTooltip = "<div>";
    customTooltip += `<p><b>${params.name}</b></p>`;
    customTooltip += "<ul'>";
    orderBy(params.data.stack, "order").forEach((it) => {
      customTooltip += `<li key=${it.order}>
        <b>${it.name}</b>: ${thousandFormatter(it.value)}
      </li>`;
    });
    customTooltip += "</ul></div>";
    return customTooltip;
  },
};

const ColumnBar = ({
  data,
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
  data = sortBy(data, "order");

  const labels = data.map((x) => x.name);

  const grouped = groupBy(
    data.flatMap((d) => d.data),
    "name"
  );
  const series = Object.keys(grouped).map((key, ki) => {
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
        show: true,
        padding: 5,
        backgroundColor: "rgba(0,0,0,.3)",
        ...TextStyle,
        color: "#fff",
      },
      color: values?.[0]?.color || Color.color[ki],
    };
  });
  const legends = series.map((s, si) => ({
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
    series: series,
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
    ...TextStyle,
  };
  return option;
};

export default ColumnBar;
