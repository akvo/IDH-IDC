import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Title,
  NoData,
  formatNumberToString,
} from "./common";
import { sortBy, isEmpty, sumBy } from "lodash";

const Pie = ({ data, percentage, chartTitle, extra = {} }) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }

  // Custom Axis Title
  const total = sumBy(data, "value");
  data = sortBy(data, "order");
  const currency = data?.[0]?.currency;

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
        radius: ["0%", "60%"],
        center: ["50%", "50%"],
        label: {
          show: true,
          position: "outside",
          color: "#333",
          padding: [4, 8],
          borderRadius: 4,
          ...TextStyle,
          border: "solid",
          borderWidth: 2,
          borderColor: "inherit",
          backgroundColor: "#fff",
          formatter: (s) => {
            if (percentage) {
              return `${s.value}%`;
            }
            let value = formatNumberToString(s.value);
            if (currency) {
              value = `${value} (${currency})`;
            }
            return value;
          },
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          smooth: false,
          lineStyle: {
            width: 2,
          },
        },
        labelLayout: {
          hideOverlap: false,
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
