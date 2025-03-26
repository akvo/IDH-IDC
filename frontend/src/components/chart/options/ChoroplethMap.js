import { Easing, Color, TextStyle, backgroundColor, Title } from "./common";
import { isEmpty } from "lodash";
import * as echarts from "echarts";

const worldGeoJson = window.topojson;

const ChoroplethMap = ({ data, chartTitle, extra = {} }) => {
  echarts.registerMap(
    extra?.mapType || "world_map",
    extra?.geoJson || worldGeoJson
  );

  return {
    ...Color,
    title: {
      ...Title,
      show: !isEmpty(chartTitle),
      text: chartTitle?.title,
      subtext: chartTitle?.subTitle,
    },
    projection: {
      project: (point) => [
        (point[0] / 180) * Math.PI,
        -Math.log(Math.tan((Math.PI / 2 + (point[1] / 180) * Math.PI) / 2)),
      ],
      unproject: (point) => [
        (point[0] * 180) / Math.PI,
        ((2 * 180) / Math.PI) * Math.atan(Math.exp(point[1])) - 90,
      ],
    },
    tooltip: {
      trigger: "item",
      formatter: function ({ name, value, data }) {
        if (isNaN(value)) {
          return;
        }

        let content = `<div style="display: flex; flex-direction: column; gap: 8px; padding: 4px;">`;
        content += `<div style="font-weight: 900; font-size: 14px; color: #01625F; font-family: 'RocGrotesk', sans-serif;">${
          name || "NA"
        }</div>`;

        if (!isNaN(data?.total_farmers)) {
          // landing page
          const caseCount = value || "NA";
          const totalFarmers = isNaN(data?.total_farmers)
            ? "NA"
            : data?.total_farmers;

          content += `
            <table border="0" style="font-size: 12px;">
            <tr>
              <td>Number of cases</td>
              <td>:</td>
              <td>${caseCount}</td>
            </tr>
            <tr>
              <td>Number of farmers</td>
              <td>:</td>
              <td>${totalFarmers}</td>
            </tr>
          </table>`;
        }

        if (!isNaN(data?.count)) {
          // explore studies page
          const suffixText = value ? (value === 1 ? "study" : "studies") : "";
          content += `<div>${value} ${suffixText}</div>`;
        }

        if (!isNaN(data?.benchmark_count)) {
          // lib explorer page
          const suffixText = value
            ? value === 1
              ? "benchmark available"
              : "benchmarks available"
            : "";
          content += `<div>${value} ${suffixText}</div>`;
        }

        content += `</div>`;
        return content;
      },
      padding: 5,
      backgroundColor: "#ffffff",
      ...TextStyle,
    },
    visualMap: {
      show: true,
      type: "continuous",
      text: extra?.visualMapText?.length
        ? extra.visualMapText
        : ["High", "Low"],
      textGap: 20,
      min: extra?.min || 0,
      max: extra?.max
        ? extra?.max === extra?.min
          ? extra?.max + 5
          : extra?.max
        : 100,
      left: "right",
      top: "bottom",
      calculable: true,
      inRange: {
        color: extra?.colors || [
          // "#EAF2F2",
          // "#D0E2E2",
          "#B6D2D1",
          "#9CC2C1",
          "#82B2B1",
          "#69A2A0",
          "#4F9290",
          "#358280",
          "#1B726F",
          "#01625F",
        ],
      },
    },
    series: [
      {
        name: extra?.seriesName || "Data",
        type: "map",
        map: extra?.mapType || "world_map",
        zoom: 1.15,
        emphasis: {
          label: {
            show: false,
          },
        },
        data: data,
      },
    ],
    ...backgroundColor,
    ...Easing,
    ...extra,
    ...TextStyle,
  };
};

export default ChoroplethMap;
