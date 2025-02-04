import {
  Easing,
  Color,
  TextStyle,
  backgroundColor,
  Title,
  NoData,
} from "./common";
import { isEmpty } from "lodash";
import * as echarts from "echarts";

const worldGeoJson = window.topojson;

const ChoroplethMap = ({ data, chartTitle, extra = {} }) => {
  if (isEmpty(data) || !data) {
    return NoData;
  }

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
    tooltip: {
      trigger: "item",
      formatter: function ({ name, value, data }) {
        if (isNaN(value)) {
          return;
        }
        // Extract properties from the `data` object
        const caseCount = value || "NA";
        const totalFarmers = isNaN(data?.total_farmers)
          ? "NA"
          : data?.total_farmers;

        let content = `<div style="display: flex; flex-direction: column; gap: 8px; padding: 4px;">`;
        content += `<div style="font-weight: 900; font-size: 14px; color: #01625F; font-family: 'RocGrotesk', sans-serif;">${
          name || "NA"
        }</div>`;

        if (!isNaN(data?.total_farmers)) {
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
        content += `</div>`;
        return content;
      },
      padding: 5,
      backgroundColor: "#ffffff",
      ...TextStyle,
    },
    visualMap: {
      min: extra?.min || 0,
      max: extra?.max || 100,
      left: "right",
      top: "bottom",
      text: ["High", "Low"],
      calculable: true,
      inRange: {
        color: extra?.colors || [
          "#EAF2F2",
          "#D0E2E2",
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
