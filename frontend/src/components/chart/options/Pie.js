import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Title,
  NoData,
  thousandFormatter,
} from "./common";
import { sortBy, isEmpty, sumBy } from "lodash";

const Pie = ({ data, percentage, chartTitle, extra = {} }) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }

  // Custom Axis Title
  const total = sumBy(data, "value");
  data = sortBy(data, "order");
  if (percentage) {
    data = data.map((x) => ({ ...x, percentage: (x.value / total) * 100 }));
  }
  const option = {
    ...Color,
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    grid: {
      show: false,
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
    legend: {
      orient: "horizontal",
      left: "left",
      bottom: 0,
    },
    series: [
      {
        data: data.map((v, vi) => ({
          name: v.name,
          value: percentage ? v.percentage?.toFixed(2) : v.value,
          count: v.value,
          itemStyle: { color: v.color || Color.color[vi] },
        })),
        type: "pie",
        label: {
          colorBy: "data",
          position: "inside",
          show: true,
          padding: 5,
          backgroundColor: "rgba(0,0,0,.3)",
          ...TextStyle,
          color: "#fff",
          formatter: (s) => {
            if (percentage) {
              return `${s.value}%`;
            }
            return thousandFormatter(s.value);
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

export default Pie;
