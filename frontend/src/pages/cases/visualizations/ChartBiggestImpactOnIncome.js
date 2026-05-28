import React, { useState, useMemo, useRef } from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";
import { orderBy } from "lodash";
import Chart from "../../../components/chart";
import {
  AxisShortLabelFormatter,
  Legend,
  TextStyle,
  Easing,
} from "../../../components/chart/options/common";
import { getFunctionDefaultValue } from "../../../lib";
import { SegmentSelector } from "../components";
import { CaseVisualState } from "../store";

const legendColors = ["#F9BC05", "#82b2b2", "#03625f"];

const ChartBiggestImpactOnIncome = () => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showLabel, setShowLabel] = useState(null);
  const chartRef = useRef(null);

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
      (a) => a.name === "current" && !a.question?.parent && a.commodityFocus
    );
    const indicators =
      driverQuestion && driverQuestion?.question?.childrens
        ? driverQuestion.question.childrens
        : [];
    const currentValues = focusCommodityData.filter(
      (d) => d.name === "current"
    );
    const feasibleValues = focusCommodityData.filter(
      (d) => d.name === "feasible"
    );
    const currentValuesArray = currentValues.reduce((c, d) => {
      return [...c, { id: `current-${d.questionId}`, value: d.value || 0 }];
    }, []);
    const feasibleValuesArray = feasibleValues.reduce((c, d) => {
      return [...c, { id: `feasible-${d.questionId}`, value: d.value || 0 }];
    }, []);

    const totalCurrentIncome = currentSegmentData?.total_current_income || 0;
    const totalFeasibleIncome = currentSegmentData?.total_feasible_income || 0;
    const totalCurrentDiversifiedIncome =
      currentSegmentData?.total_current_diversified_income || 0;
    const totalFeasibleDiversifiedIncome =
      currentSegmentData?.total_feasible_diversified_income || 0;

    // const feasiblePerCurrentTotalIncome = totalCurrentIncome
    //   ? (totalFeasibleIncome / totalCurrentIncome) * 100
    //   : 0;

    // populate impact values for focus commodity
    let transformedData = indicators.map((ind) => {
      const currentValue = focusCommodityData.find(
        (fcd) => fcd.questionId === ind.id && fcd.name === "current"
      );
      const feasibleValue = focusCommodityData.find(
        (fcd) => fcd.questionId === ind.id && fcd.name === "feasible"
      );
      const currentValueTemp = currentValue?.value || 0;
      const feasibleValueTemp = feasibleValue?.value || 0;
      const possibleValue = currentValueTemp
        ? ((feasibleValueTemp - currentValueTemp) / currentValueTemp) * 100
        : 0;

      if (currentValue && feasibleValue) {
        // Income value
        const customValueId = `current-${feasibleValue.questionId}`;
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
            "current",
            replacedCurrentValues
          ) + totalCurrentDiversifiedIncome;

        const incomeValue = totalCurrentIncome
          ? ((newTotalValue - totalCurrentIncome) / totalCurrentIncome) * 100
          : 0;
        // EOL Income value

        // Additional value
        const additionalValueId = `feasible-${currentValue.questionId}`;
        const replacedFeasibleValues = [
          ...feasibleValuesArray.filter((c) => c.id !== additionalValueId),
          {
            id: additionalValueId,
            value: currentValue.value || 0,
          },
        ];
        const newAdditionalTotalValue =
          getFunctionDefaultValue(
            driverQuestion.question,
            "feasible",
            replacedFeasibleValues
          ) + totalFeasibleDiversifiedIncome;

        const additionalValue = totalCurrentIncome
          ? ((totalFeasibleIncome - newAdditionalTotalValue) /
              totalCurrentIncome) *
            100
          : 0;

        // const additionalValue =
        //   feasiblePerCurrentTotalIncome - incomeIncreaseFeasible;

        // EOL Income value
        return {
          id: ind.id,
          name: ind.text,
          income: incomeValue || 0,
          possible: possibleValue || 0,
          additional: additionalValue || 0,
        };
      }

      return {
        id: ind.id,
        name: ind.text,
        income: 0,
        possible: possibleValue,
        additional: 0,
      };
    });
    // add diversified value
    if (transformedData.length) {
      const totalCurrentFocusIncome =
        currentSegmentData?.total_current_focus_income || 0;
      const totalFeasibleFocusIncome =
        currentSegmentData?.total_feasible_focus_income || 0;

      const newDiversifiedValue =
        totalCurrentFocusIncome + totalFeasibleDiversifiedIncome;
      const newAdditionalDiversifiedValue =
        totalFeasibleFocusIncome + totalCurrentDiversifiedIncome;

      const additionalDiversifiedValue = totalCurrentIncome
        ? ((totalFeasibleIncome - newAdditionalDiversifiedValue) /
            totalCurrentIncome) *
          100
        : 0;

      // const additionalDiversifiedValue =
      //   feasiblePerCurrentTotalIncome - diversifiedIncreaseFeasible;

      transformedData.push({
        id: 9002,
        name: "Diversified Income",
        income: totalCurrentIncome
          ? ((newDiversifiedValue - totalCurrentIncome) / totalCurrentIncome) *
            100
          : 0,
        possible: totalCurrentDiversifiedIncome
          ? ((totalFeasibleDiversifiedIncome - totalCurrentDiversifiedIncome) /
              totalCurrentDiversifiedIncome) *
            100
          : 0,
        additional: additionalDiversifiedValue,
      });
    }
    // reorder
    transformedData = orderBy(transformedData, ["id"], ["asc"]);
    const finalData = ["possible", "income", "additional"].map((x, xi) => {
      let title = "";
      if (x === "possible") {
        title = "Change in income driver value (%)";
      }
      if (x === "income") {
        title = "Income change (%): change only this driver";
      }
      if (x === "additional") {
        title =
          "Income change (%): change this driver, other drivers are at feasible levels";
      }
      const data = transformedData.map((d) => ({
        name: d.name,
        value: d[x].toFixed(2),
        label: {
          position: d[x] < 0 ? "insideBottom" : "insideTop",
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
        formatter: (params) => {
          const name = params?.[0]?.name;
          let html = "<div>";
          html += `<h4>${name}</h4>`;
          html +=
            "<ul style='list-style-type: none; width: 300px; margin: 0; padding: 0;'>";
          params.forEach((p) => {
            html += `<li style='overflow-wrap: break-word; word-wrap: break-word; white-space: normal;'>${p.marker} ${p.seriesName}: <b>${p.value}</b></li>`;
          });
          html += "</ul>";
          html += "</div>";
          return html;
        },
        ...TextStyle,
      },
      legend: {
        ...Legend,
        data: finalData.map((x) => x.name),
        top: 5,
        left: "left",
      },
      grid: {
        show: true,
        containLabel: true,
        left: 75,
        right: 30,
        top: 100,
        bottom: 20,
        label: {
          color: "#222",
          ...TextStyle,
        },
      },
      yAxis: {
        type: "value",
        name: "Change (%)",
        nameTextStyle: { ...TextStyle },
        nameLocation: "middle",
        nameGap: 55,
        axisLabel: {
          ...TextStyle,
          color: "#9292ab",
        },
      },
      xAxis: {
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
            show: showLabel,
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
  }, [dashboardData, selectedSegment, showLabel]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Highest impact on income"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartRef}
            exportFilename="How does income change when an income driver changes to its
              feasible level?"
            tooltipText="The chart shows the percentage change in income when each driver is shifted from current to feasible levels. The impact on income is presented for two scenarios: adjusting the driver in isolation, and adjusting it while all other drivers are also set to feasible levels."
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
              How does income change when an income driver changes to its
              feasible level?
            </div>
            <div className="section-description">
              This chart shows the percentage change in household income when
              drivers are adjusted from their current levels to feasible levels.
              Firstly it shows the size of change between the current and
              feasible level (yellow), and then compares the effect of each
              driver under two conditions: impact on income with all other
              drivers at current levels (light teal) and impact on income with
              all other drivers at feasible levels (dark teal). This highlights
              both the standalone impact of each driver and how its contribution
              depends on interactions with other drivers. Higher percentage
              income changes indicate that adjusting a driver has a stronger
              positive effect on income, while lower or negative changes suggest
              a limited or adverse impact. Differences between the two
              conditions show how much a driver’s effect is influenced by the
              performance of other drivers.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartBiggestImpactOnIncome;
