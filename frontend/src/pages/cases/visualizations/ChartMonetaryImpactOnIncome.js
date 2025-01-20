import React, { useState, useMemo } from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";
import {
  TextStyle,
  AxisLabelFormatter,
  Legend,
  LabelStyle,
  thousandFormatter,
  formatNumberToString,
} from "../../../components/chart/options/common";
import { sum } from "lodash";
import Chart from "../../../components/chart";
import { getFunctionDefaultValue } from "../../../lib";
import { SegmentSelector } from "../components";
import { CaseVisualState, CurrentCaseState } from "../store";

const ChartMonetaryImpactOnIncome = ({ showLabel = false }) => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const currentCase = CurrentCaseState.useState((s) => s);

  const [selectedSegment, setSelectedSegment] = useState(null);

  const chartData = useMemo(() => {
    const data = dashboardData.find((d) => d.id === selectedSegment);
    if (!data) {
      return {};
    }
    const dataSeries = data.answers.filter(
      (d) => d.question?.parent === 1 && d.commodityFocus
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
        // CoP -> multiplied by -1
        // if (d.toLowerCase().includes("cost") && resValue < 0) {
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

    const series = [
      {
        name: "Placeholder",
        type: "bar",
        stack: "Total",
        silent: true,
        itemStyle: {
          borderColor: "transparent",
          color: "transparent",
          borderWidth: 2,
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
          borderWidth: 2,
          borderColor: "#03625f",
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
          borderWidth: 2,
          borderColor: "#D34F44",
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
    ];

    const legendData = series
      .map((s) => {
        if (s.name === "Placeholder") {
          return false;
        }
        if (s.data?.every((x) => x === "-")) {
          return false;
        }
        return s.name;
      })
      .filter((x) => x);

    return {
      legend: {
        ...Legend,
        data: legendData,
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
          let name = "No Data";
          let seriesName = "NA";
          let value = 0;
          if (positive && positive.value !== "-") {
            name = positive.name;
            seriesName = positive.seriesName;
            value = positive.value;
          }
          if (negative && negative.value !== "-") {
            name = negative.name;
            seriesName = negative.seriesName;
            value = negative.value;
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
        left: 65,
        right: 30,
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
          formatter: function (value) {
            return formatNumberToString(value);
          },
        },
      },
      series: series,
    };
  }, [dashboardData, selectedSegment, currentCase.currency, showLabel]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Monetary impact of each driver to income"
            bordered
          >
            <Row gutter={[20, 20]}>
              <Col span={24}>
                <SegmentSelector
                  selectedSegment={selectedSegment}
                  setSelectedSegment={setSelectedSegment}
                />
              </Col>
              <Col span={24}>
                <Chart wrapper={false} type="BAR" override={chartData} />
              </Col>
            </Row>
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              What is the monetary impact of each income driver as we move
              income drivers from their current to feasible levels?
            </div>
            <div className="section-description">
              This waterfall chart visually illustrates how adjustments in
              income drivers influence the transition from the current income
              level to a feasible income level. Each element represents how
              income changes resulting from changing an income driver from its
              current to its feasible level, keeping the other income drivers at
              their current levels. Insights: The graph serves to clarify which
              income drivers have the most significant impact on increasing
              household income levels. The values do not add up to the feasible
              income level because some income drivers are interconnected and in
              this graph we only assess the change in income caused by changing
              one income driver to its feasible levels, while the others remain
              at their current levels.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartMonetaryImpactOnIncome;
