import { upperFirst, take } from "lodash";

export const thousandFormatter = (value, toFixed = null) => {
  if (value === null || isNaN(value)) {
    return 0;
  }
  if (toFixed !== null) {
    value = parseFloat(value)?.toFixed(toFixed);
  }
  const finalValue = value
    ? String(value).replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, "$1,")
    : 0;
  return finalValue;
};

export const formatNumberToString = (number) => {
  if (number < 1e3) {
    return thousandFormatter(number);
  } else if (number < 1e6) {
    return (number / 1e3).toFixed(1) + "K";
  } else if (number < 1e9) {
    return (number / 1e6).toFixed(1) + "M";
  }
  return (number / 1e9).toFixed(1) + "B";
};

export const popupFormatter = (params) => {
  var value = (params.value + "").split(".");
  value = thousandFormatter(value[0]);
  if (isNaN(params.value)) {
    return;
  }
  return params.name + ": " + value;
};

export const backgroundColor = {
  backgroundColor: "transparent",
};

export const Easing = {
  animation: true,
  animationThreshold: 2000,
  animationDuration: 1000,
  animationEasing: "cubicOut",
  animationDelay: 0,
  animationDurationUpdate: 300,
  animationEasingUpdate: "cubicOut",
  animationDelayUpdate: 0,
};

export const TextStyle = {
  color: "#000",
  fontSize: 12,
  fontWeight: "bold",
};

export const LabelStyle = {
  label: {
    show: true,
    position: "top",
    color: "#fff",
    padding: 5,
    backgroundColor: "rgba(0,0,0,.3)",
    formatter: (e) => formatNumberToString(e.value),
  },
};

export const AxisLabelFormatter = {
  formatter: function (value) {
    const maxCharsPerLine = 10; // Max characters per line
    const words = value.split(" "); // Split by spaces
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length > maxCharsPerLine) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });

    if (currentLine) {
      lines.push(currentLine.trim());
    } // Add last line

    return upperFirst(lines.join("\n")); // Join lines with new lines
  },
};

export const AxisShortLabelFormatter = {
  formatter: function (params) {
    const stringArr = String(params).split(" ");
    const newParamsName = take(stringArr, 5).join("\n");
    return upperFirst(newParamsName) + (stringArr.length > 5 ? ".." : "");
  },
};

export const AxisTruncateLabelFormatter = {
  formatter: function (params) {
    const maxLength = 10;
    const inputString = String(params);
    if (inputString.length > maxLength) {
      return inputString.substring(0, maxLength) + "...";
    }
    return inputString;
  },
};

export const Color = {
  color: [
    "#4475B4",
    "#73ADD1",
    "#AAD9E8",
    "#70CFAD",
    "#9ACF70",
    "#CDCF70",
    "#FEE08F",
    "#FDAE60",
    "#F36C42",
    "#D73027",
    "#A242B5",
    "#6042B5",
  ],
  option: [
    {
      keys: [
        "Yes",
        "Yes, all of them",
        "Functional toilet with privacy",
        "in own dwelling",
      ],
      color: "#64d985",
    },
    {
      keys: ["No", "Elsewhere"],
      color: "#e06971",
    },
    {
      keys: ["male"],
      color: "#5999e8",
    },
    {
      keys: ["female"],
      color: "#d45dba",
    },
    {
      keys: ["in own yard/plot", "yes, but not all of them"],
      color: "#ced88c",
    },
  ],
};

export const visualMap = {
  left: "right",
  top: "top",
  inRange: {
    color: ["#f4f7b5", "#1890ff"],
  },
  itemHeight: "520px",
  calculable: true,
};

export const Legend = {
  icon: "circle",
  top: "top",
  left: 15,
  align: "left",
  orient: "horizontal",
  itemGap: 10,
  textStyle: {
    fontWeight: "normal",
    fontFamily: "TabletGothic",
    fontSize: 12,
  },
  itemWidth: 15,
  itemHeight: 15,
  formatter: function (name) {
    return name;
  },
};

export const Icons = {
  saveAsImage:
    "path:/M10,6.536c-2.263,0-4.099,1.836-4.099,4.098S7.737,14.732,10,14.732s4.099-1.836,4.099-4.098S12.263,6.536,10,6.536M10,13.871c-1.784,0-3.235-1.453-3.235-3.237S8.216,7.399,10,7.399c1.784,0,3.235,1.452,3.235,3.235S11.784,13.871,10,13.871M17.118,5.672l-3.237,0.014L12.52,3.697c-0.082-0.105-0.209-0.168-0.343-0.168H7.824c-0.134,0-0.261,0.062-0.343,0.168L6.12,5.686H2.882c-0.951,0-1.726,0.748-1.726,1.699v7.362c0,0.951,0.774,1.725,1.726,1.725h14.236c0.951,0,1.726-0.773,1.726-1.725V7.195C18.844,6.244,18.069,5.672,17.118,5.672 M17.98,14.746c0,0.477-0.386,0.861-0.862,0.861H2.882c-0.477,0-0.863-0.385-0.863-0.861V7.384c0-0.477,0.386-0.85,0.863-0.85l3.451,0.014c0.134,0,0.261-0.062,0.343-0.168l1.361-1.989h3.926l1.361,1.989c0.082,0.105,0.209,0.168,0.343,0.168l3.451-0.014c0.477,0,0.862,0.184,0.862,0.661V14.746z",
  download:
    "path://M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z",
  dataView:
    "path://M8.627,7.885C8.499,8.388,7.873,8.101,8.13,8.177L4.12,7.143c-0.218-0.057-0.351-0.28-0.293-0.498c0.057-0.218,0.279-0.351,0.497-0.294l4.011,1.037C8.552,7.444,8.685,7.667,8.627,7.885 M8.334,10.123L4.323,9.086C4.105,9.031,3.883,9.162,3.826,9.38C3.769,9.598,3.901,9.82,4.12,9.877l4.01,1.037c-0.262-0.062,0.373,0.192,0.497-0.294C8.685,10.401,8.552,10.18,8.334,10.123 M7.131,12.507L4.323,11.78c-0.218-0.057-0.44,0.076-0.497,0.295c-0.057,0.218,0.075,0.439,0.293,0.495l2.809,0.726c-0.265-0.062,0.37,0.193,0.495-0.293C7.48,12.784,7.35,12.562,7.131,12.507M18.159,3.677v10.701c0,0.186-0.126,0.348-0.306,0.393l-7.755,1.948c-0.07,0.016-0.134,0.016-0.204,0l-7.748-1.948c-0.179-0.045-0.306-0.207-0.306-0.393V3.677c0-0.267,0.249-0.461,0.509-0.396l7.646,1.921l7.654-1.921C17.91,3.216,18.159,3.41,18.159,3.677 M9.589,5.939L2.656,4.203v9.857l6.933,1.737V5.939z M17.344,4.203l-6.939,1.736v9.859l6.939-1.737V4.203z M16.168,6.645c-0.058-0.218-0.279-0.351-0.498-0.294l-4.011,1.037c-0.218,0.057-0.351,0.28-0.293,0.498c0.128,0.503,0.755,0.216,0.498,0.292l4.009-1.034C16.092,7.085,16.225,6.863,16.168,6.645 M16.168,9.38c-0.058-0.218-0.279-0.349-0.498-0.294l-4.011,1.036c-0.218,0.057-0.351,0.279-0.293,0.498c0.124,0.486,0.759,0.232,0.498,0.294l4.009-1.037C16.092,9.82,16.225,9.598,16.168,9.38 M14.963,12.385c-0.055-0.219-0.276-0.35-0.495-0.294l-2.809,0.726c-0.218,0.056-0.351,0.279-0.293,0.496c0.127,0.506,0.755,0.218,0.498,0.293l2.807-0.723C14.89,12.825,15.021,12.603,14.963,12.385",
  zoomIn:
    "path://M14.613,10c0,0.23-0.188,0.419-0.419,0.419H10.42v3.774c0,0.23-0.189,0.42-0.42,0.42s-0.419-0.189-0.419-0.42v-3.774H5.806c-0.23,0-0.419-0.189-0.419-0.419s0.189-0.419,0.419-0.419h3.775V5.806c0-0.23,0.189-0.419,0.419-0.419s0.42,0.189,0.42,0.419v3.775h3.774C14.425,9.581,14.613,9.77,14.613,10 M17.969,10c0,4.401-3.567,7.969-7.969,7.969c-4.402,0-7.969-3.567-7.969-7.969c0-4.402,3.567-7.969,7.969-7.969C14.401,2.031,17.969,5.598,17.969,10 M17.13,10c0-3.932-3.198-7.13-7.13-7.13S2.87,6.068,2.87,10c0,3.933,3.198,7.13,7.13,7.13S17.13,13.933,17.13,10",
  zoomOut:
    "path://M14.776,10c0,0.239-0.195,0.434-0.435,0.434H5.658c-0.239,0-0.434-0.195-0.434-0.434s0.195-0.434,0.434-0.434h8.684C14.581,9.566,14.776,9.762,14.776,10 M18.25,10c0,4.558-3.693,8.25-8.25,8.25c-4.557,0-8.25-3.691-8.25-8.25c0-4.557,3.693-8.25,8.25-8.25C14.557,1.75,18.25,5.443,18.25,10 M17.382,10c0-4.071-3.312-7.381-7.382-7.381C5.929,2.619,2.619,5.93,2.619,10c0,4.07,3.311,7.382,7.381,7.382C14.07,17.383,17.382,14.07,17.382,10",
  resetZoom:
    "path://M16.382,15.015h0.455h0.457V4.985h-0.457h-0.455V15.015z M16.837,4.985c1.008,0,1.824-0.816,1.824-1.822c0-1.008-0.816-1.824-1.824-1.824c-1.006,0-1.822,0.816-1.822,1.824C15.015,4.169,15.831,4.985,16.837,4.985z M16.837,2.25c0.504,0,0.913,0.409,0.913,0.913c0,0.502-0.409,0.911-0.913,0.911c-0.502,0-0.911-0.409-0.911-0.911C15.926,2.659,16.335,2.25,16.837,2.25z M15.015,3.618V3.163V2.706H4.986v0.457v0.455H15.015z M3.162,15.01c-1.007,0-1.823,0.816-1.823,1.822c0,1.008,0.816,1.824,1.823,1.824s1.824-0.816,1.824-1.824C4.986,15.831,4.169,15.015,3.162,15.015z M3.162,17.75c-0.503,0-0.911-0.409-0.911-0.913c0-0.502,0.408-0.911,0.911-0.911c0.504,0,0.912,0.409,0.912,0.911C4.074,17.341,3.666,17.75,3.162,17.75z M4.986,16.382v0.455v0.457h10.029v-0.457v-0.455H4.986zM16.837,15.015c-1.006,0-1.822,0.816-1.822,1.822c0,1.008,0.816,1.824,1.822,1.824c1.008,0,1.824-0.816,1.824-1.824C18.661,15.831,17.845,15.015,16.837,15.015z M16.837,17.75c-0.502,0-0.911-0.409-0.911-0.913c0-0.502,0.409-0.911,0.911-0.911c0.504,0,0.913,0.409,0.913,0.911C17.75,17.341,17.341,17.75,16.837,17.75z M3.618,4.985H3.162H2.707v10.029h0.456h0.456V4.985zM4.986,3.163c0-1.008-0.817-1.824-1.824-1.824S1.339,2.155,1.339,3.163c0,1.006,0.816,1.822,1.823,1.822S4.986,4.169,4.986,3.163zM3.162,4.074c-0.503,0-0.911-0.409-0.911-0.911c0-0.504,0.408-0.913,0.911-0.913c0.504,0,0.912,0.409,0.912,0.913C4.074,3.665,3.666,4.074,3.162,4.074z",
  reset:
    "path://M19.305,9.61c-0.235-0.235-0.615-0.235-0.85,0l-1.339,1.339c0.045-0.311,0.073-0.626,0.073-0.949,c0-3.812-3.09-6.901-6.901-6.901c-2.213,0-4.177,1.045-5.44,2.664l0.897,0.719c1.053-1.356,2.693-2.232,4.543-2.232,c3.176,0,5.751,2.574,5.751,5.751c0,0.342-0.037,0.675-0.095,1l-1.746-1.39c-0.234-0.235-0.614-0.235-0.849,0,c-0.235,0.235-0.235,0.615,0,0.85l2.823,2.25c0.122,0.121,0.282,0.177,0.441,0.172c0.159,0.005,0.32-0.051,0.44-0.172l2.25-2.25,C19.539,10.225,19.539,9.845,19.305,9.61z M10.288,15.752c-3.177,0-5.751-2.575-5.751-5.752c0-0.276,0.025-0.547,0.062-0.813,l1.203,1.203c0.235,0.234,0.615,0.234,0.85,0c0.234-0.235,0.234-0.615,0-0.85l-2.25-2.25C4.281,7.169,4.121,7.114,3.961,7.118,C3.802,7.114,3.642,7.169,3.52,7.291l-2.824,2.25c-0.234,0.235-0.234,0.615,0,0.85c0.235,0.234,0.615,0.234,0.85,0l1.957-1.559,C3.435,9.212,3.386,9.6,3.386,10c0,3.812,3.09,6.901,6.902,6.901c2.083,0,3.946-0.927,5.212-2.387l-0.898-0.719,C13.547,14.992,12.008,15.752,10.288,15.752z",
};

const defaultColumns = ["name", "value"];

const getDataColumns = (option, category) => {
  const { series, xAxis, yAxis } = option;
  let columns = defaultColumns;
  let data = series?.[0]?.data;
  if (!data) {
    return "NO Data";
  }
  if (series?.[0]?.stack) {
    data = xAxis?.[0]?.data || yAxis?.[0]?.data;
    data = data?.map((x, xi) => {
      return series.reduce(
        (prev, current) => {
          return { ...prev, [current.name]: current.data[xi].value };
        },
        { [category]: x }
      );
    });
    columns = series.map((d) => d.name);
    columns = [category, ...columns];
  }
  return { columns: columns, data: data };
};

const getDataLineColumns = (series, data, category) => {
  let columns = series.map((s) => s.name);
  data = data?.map((x, xi) => {
    return series.reduce(
      (prev, current) => {
        return { ...prev, [current.name]: current.data[xi] };
      },
      { [category]: x }
    );
  });
  columns = [category, ...columns];
  return { columns: columns, data: data };
};

export const optionToContent = (
  { series, xAxis, option, category = "category", suffix = "" },
  chartType = "NORMAL"
) => {
  const { columns, data } =
    chartType === "LINE"
      ? getDataLineColumns(series, xAxis?.[0]?.data || [], category)
      : getDataColumns(option, category);

  let table = `<div class="ant-table ant-table-small ant-table-bordered ant-table-fixed-header ant-table-fixed-column">`;
  table += `<div class="ant-table-container">`;
  table += `<table style="table-layout: auto;">`;
  table += `<thead class="ant-table-thead"><tr>`;
  columns.map((s) => {
    table += `<th class="ant-table-cell">`;
    table += upperFirst(s);
    table += "</th>";
  });
  table += `</tr></thead>`;
  table += `<tbody class="ant-table-tbody">`;
  data.map((d) => {
    table += `<tr>`;
    columns.map((s) => {
      table += `<td class="ant-table-cell">`;
      table += s === "value" ? `${d[s]}${suffix}` : d[s];
      table += `</td">`;
    });
    table += `</tr>`;
  });
  table += `</tbody></table></div></div>`;
  return table;
};

export const DataView = {
  show: true,
  icon: Icons.dataView,
  readOnly: true,
  buttonColor: "#009fe2",
  textAreaBorderColor: "#fff",
};

export const Title = {
  show: false,
  text: "",
  subtext: "",
  textAlign: "center",
  left: "50%",
  textStyle: {
    ...TextStyle,
    fontSize: 14,
    lineHeight: 20,
    width: 950,
    overflow: "break",
    lineOverflow: "truncate",
    fontWeight: "normal",
    rich: {
      question: {
        fontSize: 14,
        fontWeight: "bold",
        fontStyle: "italic",
        color: "#0967AC",
      },
      option: {
        fontSize: 14,
        fontWeight: "bold",
        fontStyle: "italic",
        color: "#7BCCC4",
      },
    },
  },
};

export const axisTitle = (extra) => {
  // Custom Axis Title
  const { x, y } = extra?.axisTitle || { x: "", y: "" };
  const xAxisTitle = Array.isArray(x)
    ? x
        ?.filter((it) => it)
        .map((it) => upperFirst(it))
        .join(" - ")
    : x;
  const yAxisTitle = upperFirst(y);
  return { xAxisTitle, yAxisTitle };
};

export const NoData = {
  title: {
    subtext: "No Data",
    left: "center",
    top: "20px",
    ...TextStyle,
  },
  grid: {
    show: true,
    containLabel: true,
    label: {
      color: "#222",
      ...TextStyle,
    },
  },
  xAxis: [
    {
      type: "category",
    },
  ],
  yAxis: [
    {
      type: "value",
    },
  ],
  series: [],
};

export const incomeTargetChartOption = {
  name: "Income Target",
  type: "line",
  symbol: "diamond",
  symbolSize: 15,
  color: "#00625F",
  lineStyle: {
    width: 0,
  },
  data: [],
};
