import React, { useState, useEffect, useMemo } from "react";
import Chart from "../../../components/chart";
import {
  LabelStyle,
  thousandFormatter,
} from "../../../components/chart/options/common";
import { SegmentSelector } from "./";
import { getFunctionDefaultValue } from "../components";
import {
  TextStyle,
  AxisLabelFormatter,
  Legend,
} from "../../../components/chart/options/common";
import { sum } from "lodash";

const ChartMonetaryContribution = ({
  dashboardData,
  currentCase,
  showLabel = false,
}) => {
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (dashboardData.length > 0) {
      setSelectedSegment(dashboardData[0].id);
    }
  }, [dashboardData]);

  const chartData = useMemo(() => {
    const data = dashboardData.find((d) => d.id === selectedSegment);
    if (!data) {
      return {};
    }
    const dataSeries = data.answers.filter(
      (d) => d.question.parent === 1 && d.commodityFocus
    );

    const indicators = dataSeries
      .filter((d) => d.name === "current")
      .map((d) => d.question.text);

    const totalValueData = data.answers.find(
      (dd) => dd.name === "current" && !dd.parent
    );

    const currentValues = dataSeries.filter((d) => d.name === "current");
    const currentValuesArray = currentValues.reduce((c, d) => {
      return [...c, { id: `custom-${d.questionId}`, value: d.value || 0 }];
    }, []);

    const additionalData = indicators.map((d) => {
      const feasibleValue = dataSeries.find(
        (dd) => dd.name === "feasible" && dd.question.text === d
      );
      if (feasibleValue) {
        const customValueId = `custom-${feasibleValue.questionId}`;
        const replacedCurrentValues = [
          ...currentValuesArray.filter((c) => c.id !== customValueId),
          {
            id: customValueId,
            value: feasibleValue.value || 0,
          },
        ];
        const newTotalValue =
          getFunctionDefaultValue(
            totalValueData.question,
            "custom",
            replacedCurrentValues
          ) + data.total_current_diversified_income;
        const resValue = newTotalValue - data.total_current_income;
        // CoP - multiplied by 1
        // if (d.toLowerCase().includes("cost")) {
        //   return resValue * -1;
        // }
        return resValue;
      }
      return 0;
    });

    const diversifiedIncome =
      data.total_current_focus_income +
      data.total_feasible_diversified_income -
      data.total_current_income;

    // populate the waterfall value for placeholder bar
    const placeholderAdditionalData = additionalData.map((d, di) => {
      if (di === 0) {
        return data.total_current_income;
      }
      const prevSum = di > 0 ? sum(additionalData.slice(0, di)) : 0;
      // handle cost of production value
      if (d < 0) {
        return d + prevSum + data.total_current_income;
      }
      // EOL handle cost of production value
      return prevSum + data.total_current_income;
    });

    const diversifiedPlaceholder =
      diversifiedIncome +
      placeholderAdditionalData[placeholderAdditionalData.length - 1];
    // EOL populate the waterfall value for placeholder bar

    const feasibleValue =
      data.total_current_income + sum(additionalData) + diversifiedIncome;

    return {
      legend: {
        ...Legend,
        data: ["Positive", "Negative"],
        top: 10,
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        ...TextStyle,
        formatter: function (params) {
          const positive = params[1];
          const negative = params[2];
          let name = "";
          let seriesName = "";
          let value = 0;
          if (positive.value !== "-") {
            name = positive.name;
            seriesName = positive.seriesName;
            value = positive.value;
          } else {
            name = negative.name;
            seriesName = negative.seriesName;
            value = negative.value * -1;
          }
          value = thousandFormatter(value);
          return (
            name + "<br/>" + seriesName + " : " + parseFloat(value)?.toFixed(2)
          );
        },
      },
      grid: {
        show: true,
        containLabel: true,
        left: 80,
        right: 50,
        label: {
          color: "#222",
          ...TextStyle,
        },
      },
      xAxis: {
        type: "category",
        splitLine: { show: false },
        data: [
          "Current\nIncome",
          ...indicators,
          "Diversified Income",
          "Feasible",
        ],
        axisLabel: {
          width: 100,
          overflow: "break",
          interval: 0,
          ...TextStyle,
          color: "#4b4b4e",
          formatter: AxisLabelFormatter?.formatter,
        },
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: "value",
        name: `Income (${currentCase.currency})`,
        nameTextStyle: { ...TextStyle },
        nameLocation: "middle",
        nameGap: 75,
        axisLabel: {
          ...TextStyle,
          color: "#9292ab",
        },
      },
      series: [
        {
          name: "Placeholder",
          type: "bar",
          stack: "Total",
          silent: true,
          itemStyle: {
            borderColor: "transparent",
            color: "transparent",
          },
          emphasis: {
            itemStyle: {
              borderColor: "transparent",
              color: "transparent",
            },
          },
          data: [0, ...placeholderAdditionalData, diversifiedPlaceholder, 0],
        },
        {
          name: "Positive",
          type: "bar",
          stack: "Total",
          itemStyle: {
            color: "#03625f",
          },
          label: {
            ...LabelStyle.label,
            show: showLabel,
          },
          data: [
            data?.total_current_income < 0
              ? "-"
              : data?.total_current_income?.toFixed(2),
            ...additionalData.map((d) => (d < 0 ? "-" : d?.toFixed(2))),
            diversifiedIncome < 0 ? "-" : diversifiedIncome?.toFixed(2), // diversified value
            feasibleValue < 0 ? "-" : feasibleValue?.toFixed(2),
          ],
        },
        {
          name: "Negative",
          type: "bar",
          stack: "Total",
          itemStyle: {
            color: "#D34F44",
          },
          label: {
            ...LabelStyle.label,
            show: showLabel,
            formatter: (param) => {
              const value = parseFloat(param.value) * -1;
              return thousandFormatter(value?.toFixed(2));
            },
          },
          data: [
            data?.total_current_income >= 0
              ? "-"
              : data.total_current_income?.toFixed(2),
            ...additionalData.map((d) => (d >= 0 ? "-" : (d * -1)?.toFixed(2))),
            diversifiedIncome >= 0 ? "-" : diversifiedIncome?.toFixed(2), // diversified value
            feasibleValue >= 0 ? "-" : feasibleValue?.toFixed(2),
          ],
        },
      ],
    };
  }, [dashboardData, selectedSegment, currentCase.currency, showLabel]);

  return (
    <div>
      <SegmentSelector
        dashboardData={dashboardData}
        selectedSegment={selectedSegment}
        setSelectedSegment={setSelectedSegment}
      />
      <Chart wrapper={false} type="BAR" override={chartData} />
    </div>
  );
};

export default ChartMonetaryContribution;
