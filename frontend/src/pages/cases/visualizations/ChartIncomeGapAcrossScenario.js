import React, { useMemo, useState, useRef } from "react";
import { Card, Row, Col, Space, Select } from "antd";
import { VisualCardWrapper } from "../components";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState, CaseUIState } from "../store";
import { orderBy } from "lodash";
import Chart from "../../../components/chart";

const MAX_SCENARIO_SEGMENT = 6;

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
        name: current ? d.name : `Current ${d.name}`,
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
        name: current ? d.name : `New ${d.scenarioName}-${d.name}`,
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

  const chartData = useMemo(() => {
    const scenarioValues = scenarioData
      .flatMap((sd) => {
        return sd.scenarioValues.map((sv) => ({
          scenarioKey: sd.key,
          scenarioSegmentKey: `${sd.key}-${sv.segmentId}`,
          scenarioName: sd.name,
          ...sv,
        }));
      })
      .filter((sv) => {
        if (selectedScenarioSegmentChart.length) {
          return selectedScenarioSegmentChart.includes(sv.scenarioSegmentKey);
        }
        return sv.scenarioKey === activeScenario;
      });
    return generateChartData(scenarioValues);
  }, [scenarioData, selectedScenarioSegmentChart, activeScenario]);

  const targetChartData = useMemo(
    () => generateTargetChartData(chartData),
    [chartData]
  );

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
              type="BARSTACK"
              data={chartData}
              targetData={targetChartData}
              loading={!chartData.length}
              extra={{
                axisTitle: { y: `Income ${currentCase?.currency || ""}` },
                legend: {
                  top: 0,
                  left: "top",
                  orient: "horizontal",
                },
              }}
              grid={{ top: 60, right: 5, left: 35, bottom: 10 }}
              showLabel={showLabel}
              height={385}
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
