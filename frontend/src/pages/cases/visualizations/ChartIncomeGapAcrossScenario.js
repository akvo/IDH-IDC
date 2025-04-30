import React, { useMemo, useState, useRef } from "react";
import { Card, Row, Col, Space, Select } from "antd";
import { VisualCardWrapper } from "../components";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState, CaseUIState } from "../store";
import { orderBy } from "lodash";
import Chart from "../../../components/chart";
import { getColumnStackBarOptions } from "../../../components/chart/lib";

// Change to STACK_BAR or GROUP_STACK_BAR to change chart type
const CHART_TYPE = "GROUP_STACK_BAR";
const MAX_SCENARIO_SEGMENT = 5;

const generateTargetChartData = (data) => {
  const target = [
    {
      name: "Income Target",
      type: "line",
      symbol: "diamond",
      symbolSize: 15,
      color: "#000",
      lineStyle: {
        width: 0,
      },
      data: data.map((d) => ({
        name: "Benchmark",
        value: d?.target ? Math.round(d.target) : 0,
      })),
    },
  ];
  return target;
};

const generateChartData = (data, current = false) => {
  return data.flatMap((d) => {
    const incomeTarget = d?.currentSegmentValue?.target || 0;

    const currentTotalIncome =
      d?.currentSegmentValue?.total_current_income || 0;
    const newTotalIncome =
      d?.updatedSegmentScenarioValue?.total_current_income || 0;

    // const currentAdditionalValue = currentTotalIncome
    //   ? currentTotalIncome - currentTotalIncome
    //   : 0;
    // const newAdditionalValue = newTotalIncome
    //   ? newTotalIncome - currentTotalIncome
    //   : 0;

    let currentGapValue = incomeTarget - currentTotalIncome;
    currentGapValue = currentGapValue < 0 ? 0 : currentGapValue;
    let newGapValue = incomeTarget - newTotalIncome;
    newGapValue = newGapValue < 0 ? 0 : newGapValue;

    return [
      {
        name: current ? d.segmentName : `Current ${d.segmentName}`,
        target: Math.round(incomeTarget),
        stack: [
          {
            name: "Household income",
            title: "Household income",
            value: Math.round(currentTotalIncome),
            total: Math.round(currentTotalIncome),
            color: "#1B625F",
            order: 1,
          },
          {
            name: "Gap",
            title: "Gap",
            value: Math.round(currentGapValue),
            total: Math.round(currentGapValue),
            color: "#F9CB21", // "#F9CB21": yellow | "#49D985": green
            order: 2,
          },
        ],
      },
      {
        name: current
          ? d.segmentName
          : `New ${d.scenarioName}-${d.segmentName}`,
        target: Math.round(incomeTarget),
        stack: [
          {
            name: "Household income",
            title: "Household income",
            value: Math.round(newTotalIncome),
            total: Math.round(newTotalIncome),
            color: "#1B625F",
            order: 1,
          },
          {
            name: "Gap",
            title: "Gap",
            value: Math.round(newGapValue),
            total: Math.round(newGapValue),
            color: "#F9CB21", // "#F9CB21": yellow | "#49D985": green
            order: 2,
          },
        ],
      },
    ];
  });
};

const seriesTmp = [
  {
    key: "total_current_income",
    name: "Current Household Income",
    type: "bar",
    stack: "current",
    color: "#9cc2c1",
  },
  {
    key: "scenario_total_income",
    name: "Household Income in new Scenario",
    type: "bar",
    stack: "feasible",
    color: "#1b726f",
  },
  {
    key: "current_income_gap",
    name: "Current Income Gap",
    type: "bar",
    stack: "current",
    color: "#ffeeb8",
  },
  {
    key: "scenario_income_gap",
    name: "Income Gap in new Scenario",
    type: "bar",
    stack: "feasible",
    color: "#fecb21",
  },
  {
    key: "target",
    name: "Income Target",
    type: "line",
    symbol: "diamond",
    symbolSize: 15,
    color: "#000",
  },
];

const ChartIncomeGapAcrossScenario = ({ activeScenario }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling } = CaseVisualState.useState((s) => s);
  const scenarioData = scenarioModeling.config.scenarioData;
  const activeSegmentId = CaseUIState.useState(
    (s) => s.general.activeSegmentId
  );

  const [selectedScenarioSegmentChart, setSelectedScenarioSegmentChart] =
    useState([`${activeScenario}-${activeSegmentId}`]);

  const [showLabel, setShowLabel] = useState(false);
  const chartRef = useRef(null);

  const scenarioSegmentOptions = useMemo(() => {
    let i = 1;
    const res = orderBy(scenarioData, "key").flatMap((sc) => {
      const concat = currentCase.segments.map((st) => {
        const opt = {
          order: i,
          label: `${sc.name} - ${st.name}`,
          value: `${sc.key}-${st.id}`,
        };
        i += 1;
        return opt;
      });
      return concat;
    });
    return res;
  }, [scenarioData, currentCase.segments]);

  const scenarioValues = useMemo(() => {
    return scenarioData
      .flatMap((sd) => {
        return sd.scenarioValues.map((sv) => {
          const findSegment = currentCase?.segments?.find(
            (s) => s.id === sv.segmentId
          );
          return {
            scenarioKey: sd.key,
            scenarioSegmentKey: `${sd.key}-${sv.segmentId}`,
            scenarioName: sd.name,
            segmentName: findSegment?.name || "",
            ...sv,
            name: `${findSegment?.name || ""} - ${sd.name}`,
          };
        });
      })
      .filter((sv) => {
        if (selectedScenarioSegmentChart.length) {
          return selectedScenarioSegmentChart.includes(sv.scenarioSegmentKey);
        }
        return sv.scenarioKey === activeScenario;
      });
  }, [
    scenarioData,
    selectedScenarioSegmentChart,
    activeScenario,
    currentCase?.segments,
  ]);

  const chartData = useMemo(() => {
    if (CHART_TYPE === "STACK_BAR") {
      return generateChartData(scenarioValues);
    }

    // GROUP_STACK_BAR
    const res = seriesTmp.map((tmp) => {
      const data = scenarioValues.map((d) => {
        const { currentSegmentValue, updatedSegmentScenarioValue, name } = d;

        let value = 0;
        if (tmp.key === "total_current_income") {
          value = currentSegmentValue?.total_current_income || 0;
        }
        if (tmp.key === "current_income_gap") {
          const { target, total_current_income } = currentSegmentValue;
          const currentIncomeGap =
            target - total_current_income < 0
              ? 0
              : target - total_current_income;
          value = currentIncomeGap;
        }
        if (tmp.key === "scenario_total_income") {
          value = updatedSegmentScenarioValue?.total_current_income || 0;
        }
        if (tmp.key === "scenario_income_gap") {
          const { target, total_current_income } = updatedSegmentScenarioValue;
          const scenarioIncomeGap =
            target - total_current_income < 0
              ? 0
              : target - total_current_income;
          value = scenarioIncomeGap;
        }

        return {
          name: name,
          value: Math.round(value),
        };
      });
      return {
        ...tmp,
        data: data,
      };
    });
    return res;
  }, [scenarioValues]);

  const targetChartData = useMemo(() => {
    if (CHART_TYPE === "STACK_BAR") {
      return generateTargetChartData(chartData);
    }
    return [];
  }, [chartData]);

  const chartParams = useMemo(() => {
    if (CHART_TYPE === "STACK_BAR") {
      return {
        type: "BARSTACK",
        data: chartData,
        targetData: targetChartData,
        showLabel: showLabel,
        grid: { top: 60, right: 5, left: 35, bottom: 10 },
        extra: {
          axisTitle: { y: `Income ${currentCase?.currency || ""}` },
          legend: {
            top: 0,
            left: "top",
            orient: "horizontal",
          },
        },
      };
    }
    // GROUP_STACK_BAR
    return {
      type: "BAR",
      override: getColumnStackBarOptions({
        series: chartData,
        origin: scenarioValues,
        yAxis: { name: `Income (${currentCase.currency})` },
        showLabel: showLabel,
        grid: { top: 65, right: 5, left: 30, bottom: 10 },
        legend: {
          orient: "horizontal",
          left: "top",
          top: 0,
        },
      }),
    };
  }, [
    chartData,
    currentCase?.currency,
    scenarioValues,
    showLabel,
    targetChartData,
  ]);

  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="top">
        <Col span={16}>
          <VisualCardWrapper
            title="Income gap across scenario"
            bordered
            showLabel={showLabel}
            setShowLabel={setShowLabel}
            exportElementRef={chartRef}
            exportFilename="What are the results for the different segments across scenarios?"
          >
            <Chart
              wrapper={false}
              loading={!chartData.length}
              height={400}
              {...chartParams}
            />
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              What are the results for the different segments across scenarios?
            </div>
            <div className="section-description">
              The visual on the right allows you to select and compare specific
              combinations of scenarios and segments. You can explore how
              household income composition and income gaps vary across segments
              in the scenarios you create.
            </div>
            <div>
              <Select
                {...selectProps}
                options={scenarioSegmentOptions.map((so) => {
                  let disabled = false;
                  if (
                    selectedScenarioSegmentChart.length >= MAX_SCENARIO_SEGMENT
                  ) {
                    disabled = !selectedScenarioSegmentChart.includes(so.value);
                  }
                  return {
                    ...so,
                    disabled,
                  };
                })}
                placeholder="Select Scenario - Segment"
                mode="multiple"
                onChange={setSelectedScenarioSegmentChart}
                value={selectedScenarioSegmentChart}
              />
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeGapAcrossScenario;
