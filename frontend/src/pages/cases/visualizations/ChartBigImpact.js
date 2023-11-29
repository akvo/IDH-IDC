import React, { useState, useEffect, useMemo } from "react";
import { Row, Col } from "antd";
import { SegmentSelector } from "./";
import { getFunctionDefaultValue } from "../components";
import { orderBy } from "lodash";
import Chart from "../../../components/chart";
import {
  AxisShortLabelFormatter,
  Legend,
  TextStyle,
  Easing,
} from "../../../components/chart/options/common";

const legendColors = ["#47D985", "#00625F"];

const ChartBigImpact = ({ dashboardData }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (dashboardData.length > 0) {
      setSelectedSegment(dashboardData[0].id);
    }
  }, [dashboardData]);

  const chartData = useMemo(() => {
    if (!dashboardData.length || !selectedSegment) {
      return [];
    }
    const currentSegmentData = dashboardData.find(
      (d) => d.id === selectedSegment
    );
    const focusCommodityData = currentSegmentData.answers.filter(
      (a) => a.commodityFocus
    );
    const driverQuestion = focusCommodityData.find(
      (a) => a.name === "current" && !a.parent
    );
    const indicators =
      driverQuestion && driverQuestion?.question?.childrens
        ? driverQuestion.question.childrens
        : [];
    const currentValues = focusCommodityData.filter(
      (d) => d.name === "current"
    );
    const currentValuesArray = currentValues.reduce((c, d) => {
      return [...c, { id: `custom-${d.questionId}`, value: d.value || 0 }];
    }, []);
    // populate impact values for focus commodity
    let transformedData = indicators.map((ind) => {
      const currentValue =
        focusCommodityData.find(
          (fcd) => fcd.questionId === ind.id && fcd.name === "current"
        )?.value || 0;
      const feasibleValue = focusCommodityData.find(
        (fcd) => fcd.questionId === ind.id && fcd.name === "feasible"
      );

      const feasibleValueTemp = feasibleValue?.value || 0;
      const possibleValue = (feasibleValueTemp / currentValue - 1) * 100;
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
            driverQuestion.question,
            "custom",
            replacedCurrentValues
          ) + currentSegmentData.total_current_diversified_income;
        const incomeValue =
          ((newTotalValue - currentSegmentData.total_current_income) /
            currentSegmentData.total_current_income) *
          100;
        return {
          name: ind.text,
          income: incomeValue || 0,
          possible: possibleValue || 0,
        };
      }
      return {
        name: ind.text,
        income: 0,
        possible: possibleValue,
      };
    });
    // add diversified value
    if (transformedData.length) {
      transformedData.push({
        name: "Diversified Income",
        income:
          (currentSegmentData.total_current_diversified_income /
            currentSegmentData.total_feasible_diversified_income) *
            100 || 0,
        possible:
          ((currentSegmentData.total_current_focus_income +
            currentSegmentData.total_feasible_diversified_income) /
            currentSegmentData.total_current_income) *
            100 || 0,
      });
    }
    // reorder
    // TODO :: Sort descending by income increase
    transformedData = orderBy(
      transformedData,
      ["possible", "income"],
      ["asc", "asc"]
    );
    const finalData = ["possible", "income"].map((x, xi) => {
      const title = x === "income" ? "% income increase" : "% change possible";
      const data = transformedData.map((d) => ({
        name: d.name,
        value: d[x].toFixed(2),
        label: {
          position: d[x] < 0 ? "insideLeft" : "insideRight",
        },
      }));
      return {
        name: title,
        data: data,
        color: legendColors[xi],
      };
    });
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        ...TextStyle,
      },
      legend: {
        ...Legend,
        data: finalData.map((x) => x.name),
        top: 15,
        left: "center",
      },
      grid: {
        show: true,
        containLabel: true,
        left: 55,
        right: 50,
        label: {
          color: "#222",
          ...TextStyle,
        },
      },
      xAxis: {
        type: "value",
        name: "Impact (%)",
        nameTextStyle: { ...TextStyle },
        nameLocation: "middle",
        nameGap: 50,
        axisLabel: {
          ...TextStyle,
          color: "#9292ab",
        },
      },
      yAxis: {
        type: "category",
        splitLine: { show: false },
        data: transformedData.map((d) => d.name),
        axisLabel: {
          width: 90,
          overflow: "break",
          interval: 0,
          ...TextStyle,
          color: "#4b4b4e",
          formatter: AxisShortLabelFormatter?.formatter,
        },
        axisTick: {
          alignWithLabel: true,
        },
      },
      series: finalData.map((d) => {
        return {
          ...d,
          type: "bar",
          label: {
            show: true,
            position: "left",
            verticalAlign: "middle",
            color: "#fff",
            padding: 2,
            backgroundColor: "rgba(0,0,0,.3)",
            formatter: function (params) {
              return params.value + "%";
            },
          },
        };
      }),
      ...Easing,
    };
  }, [dashboardData, selectedSegment]);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <SegmentSelector
            dashboardData={dashboardData}
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
        </Col>
        <Col span={24}>
          <Chart wrapper={false} type="BAR" override={chartData} />
        </Col>
      </Row>
    </div>
  );
};

export default ChartBigImpact;
