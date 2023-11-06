import React, { useState, useEffect, useMemo } from "react";
import Chart from "../../../components/chart";
import { SegmentSelector } from "./";
import { getFunctionDefaultValue } from "../components";

const ChartMonetaryContribution = ({ dashboardData }) => {
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
        const newTotalValue = getFunctionDefaultValue(
          totalValueData.question,
          "custom",
          replacedCurrentValues
        );
        return newTotalValue - data.total_current_focus_income;
      }
      return 0;
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params) {
          var tar = params[1];
          return tar.name + "<br/>" + tar.seriesName + " : " + tar.value;
        },
      },
      xAxis: {
        type: "category",
        splitLine: { show: false },
        data: ["Current\nIncome", ...indicators, "Feasible"],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "Placeholder",
          type: "bar",
          stack: "Total",
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
          data: [
            0,
            ...indicators.map(() => data.total_current_focus_income),
            0,
          ],
        },
        {
          name: "Income",
          type: "bar",
          stack: "Total",
          label: {
            show: true,
            position: "inside",
          },
          data: [
            data.total_current_focus_income,
            ...additionalData,
            data.total_feasible_focus_income,
          ],
        },
      ],
    };
  }, [dashboardData, selectedSegment]);

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
