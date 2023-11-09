import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  AxisLabelFormatter,
  AxisShortLabelFormatter,
  Legend,
  Title,
  axisTitle,
  NoData,
  LabelStyle,
} from "./common";
import { uniq, flatten, uniqBy, isEmpty, upperFirst, sumBy } from "lodash";

const tableFormatter = (e, percentage) => {
  let table = `<table border="0" style="width:100%;font-size:13px;"><thead>`;
  table += `<tr><th style="font-size: 15px;color:#000;padding-bottom:8px;" colspan=${
    e?.length || 1
  }>${e[0]?.axisValueLabel || "-"}</th></tr></thead><tbody>`;
  e.map((eI) => {
    table += "<tr>";
    table += '<td style="width: 18px;">' + eI.marker + "</td>";
    table += '<td><span style="font-weight:600;">';
    table += upperFirst(eI.seriesName);
    table += "</span></td>";
    table += '<td style="width: 80px; text-align: right; font-weight: 500;">';
    if (percentage) {
      table += eI.value + "%";
      table += eI.data?.original ? ` (${eI.data.original})` : "";
    } else {
      table += eI.value;
    }
    table += "</td>";
    table += "</tr>";
  });
  table += "</tbody></table>";
  return (
    '<div style="display:flex;align-items:center;justify-content:center">' +
    table +
    "</div>"
  );
};

const BarStack = ({
  data,
  percentage = false,
  chartTitle,
  extra = {},
  horizontal = false,
  highlighted = null,
  targetData = [], // to show income target symbol
}) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }
  // Custom Axis Title
  const { xAxisTitle, yAxisTitle } = axisTitle(extra);

  const stacked = uniqBy(flatten(data.map((d) => d.stack)), "title") || [];

  const xAxis = uniq(data.map((x) => x.title || x.name));
  let series = stacked.map((s, si) => {
    const temp = data.map((d) => {
      const vals = d.stack?.filter((c) => c.title === s.title);
      const stackSum = sumBy(d.stack, "value");
      let resValue = vals?.length ? vals[0].value : 0;
      if (percentage) {
        resValue =
          vals?.length && stackSum !== 0
            ? +((sumBy(vals, "value") / stackSum) * 100 || 0)
                ?.toFixed(2)
                .toString()
                ?.match(/^-?\d+(?:\.\d{0,1})?/)[0] || 0
            : 0;
      }
      return {
        name: s.title || s.name,
        value: resValue,
        percentage: resValue,
        itemStyle: {
          color: vals[0]?.color || s.color,
          opacity: highlighted ? (d.name === highlighted ? 1 : 0.4) : 1,
        },
        original: sumBy(vals, "value"),
        cbParam: d.name,
      };
    });
    return {
      name: s.title || s.name,
      type: "bar",
      stack: "count",
      label: {
        colorBy: "data",
        position:
          si % 2 === 0
            ? horizontal
              ? "insideRight"
              : "left"
            : horizontal
            ? "insideRight"
            : "right",
        show: false,
        padding: 5,
        formatter: (e) => e?.data?.value + "%" || "-",
        backgroundColor: "rgba(0,0,0,.3)",
        ...TextStyle,
        color: "#fff",
      },
      barWidth: 32,
      emphasis: {
        focus: "series",
      },
      color: s.color,
      data: temp,
    };
  });
  let legends = series.map((s, si) => ({
    name: s.name,
    itemStyle: { color: s.color || Color.color[si] },
  }));
  let additionalLegends = [];
  if (targetData.length) {
    additionalLegends = targetData.map((t, ti) => ({
      name: t.name,
      itemStyle: { color: t.color || Color.color[ti] },
    }));
  }
  // override label position
  series = series.map((d) => {
    return {
      ...d,
      label: {
        ...LabelStyle.label,
        position: "right",
      },
    };
  });
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
      data: [...additionalLegends, ...legends],
      top: 20,
      left: "center",
    },
    grid: {
      top: 95,
      bottom: 28,
      left: 30,
      right: 50,
      show: true,
      containLabel: true,
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
      formatter: (e) => tableFormatter(e, percentage),
      ...TextStyle,
    },
    [horizontal ? "xAxis" : "yAxis"]: {
      type: "value",
      name: yAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        formatter: (e) => (percentage ? `${e}%` : e),
        ...TextStyle,
        color: "#9292ab",
      },
    },
    [horizontal ? "yAxis" : "xAxis"]: {
      data: xAxis,
      type: "category",
      name: xAxisTitle || "",
      nameTextStyle: { ...TextStyle },
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        width: 100,
        interval: 0,
        overflow: "break",
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
    series: [...series, ...targetData],
    ...Color,
    ...backgroundColor,
    ...Easing,
    ...extra,
  };
  return option;
};

export default BarStack;
