import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState, CaseVisualState } from "../store";
import { Row, Col, Space, Card, Button, Tabs } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ScenarioModelingForm } from "../components";
import { isEmpty, orderBy } from "lodash";
import {
  ChartIncomeGapAcrossScenario,
  TableScenarioOutcomes,
} from "../visualizations";

/**
 * STEP 5
 */

const MAX_SCENARIO = 3;

const ClosingGap = ({ setbackfunction, setnextfunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling, dashboardData } = CaseVisualState.useState(
    (s) => s
  );

  const [activeScenario, setActiveScenario] = useState(
    scenarioModeling?.config?.scenarioData?.[0]?.key || null
  );

  const backFunction = useCallback(() => {
    navigate(`/case/${currentCase.id}/${stepPath.step4.label}`);
  }, [navigate, currentCase.id]);

  const nextFunction = useCallback(() => {
    console.info("Finish");
  }, []);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
  }, [setbackfunction, setnextfunction, backFunction, nextFunction]);

  // handle initial scenario data for all segments (run only once)
  useEffect(() => {
    CaseVisualState.update((s) => ({
      ...s,
      scenarioModeling: {
        ...s.scenarioModeling,
        config: {
          ...s.scenarioModeling.config,
          scenarioData: s.scenarioModeling.config.scenarioData.map(
            (scenario) => {
              if (isEmpty(scenario?.scenarioValues)) {
                return {
                  ...scenario,
                  scenarioValues: dashboardData.map((d) => {
                    return {
                      name: d.name,
                      segmentId: d.id,
                      selectedDrivers: [],
                      allNewValues: {},
                      currentSegmentValue: d,
                      updatedSegmentScenarioValue: d,
                      updatedSegment: {},
                    };
                  }),
                };
              }
              return scenario;
            }
          ),
        },
      },
    }));
  });
  // EOL handle initial scenario data for all segments

  const handleAddScenario = () => {
    if (scenarioModeling?.config?.scenarioData?.length < MAX_SCENARIO) {
      CaseVisualState.update((s) => {
        const prevScenarioData = orderBy(
          s.scenarioModeling.config.scenarioData,
          "key",
          "desc"
        );
        const lastScenarioKey = prevScenarioData[0]?.key || 1;
        return {
          ...s,
          scenarioModeling: {
            ...s.scenarioModeling,
            config: {
              ...s.scenarioModeling.config,
              scenarioData: [
                ...s.scenarioModeling.config.scenarioData,
                {
                  key: lastScenarioKey + 1,
                  name: `Scenario ${lastScenarioKey + 1}`,
                  description: null,
                  percentage: true,
                  scenarioValues: dashboardData.map((d) => {
                    return {
                      name: d.name,
                      segmentId: d.id,
                      selectedDrivers: [],
                      allNewValues: {},
                      currentSegmentValue: d,
                      updatedSegmentScenarioValue: d,
                      updatedSegment: {},
                    };
                  }),
                },
              ],
            },
          },
        };
      });
    }
  };

  const scenarioTabItems = useMemo(() => {
    return scenarioModeling?.config?.scenarioData?.map((item) => ({
      label: item.name,
      key: item.key,
      children: <ScenarioModelingForm currentScenarioData={item} />,
    }));
  }, [scenarioModeling?.config?.scenarioData]);

  return (
    <Row id="closing-gap" gutter={[24, 24]}>
      <Col span={24} className="header-wrapper">
        <Space direction="vertical">
          <div className="title">Explanatory text</div>
          <div className="description">
            This page enables you to explore various scenarios by adjusting your
            income drivers in different ways across your segments. This allows
            you to understand the potential paths towards improving farmer
            household income
          </div>
        </Space>
      </Col>
      {/* Section 1 */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          <Row align="middle" gutter={[20, 20]}>
            <Col span={18}>
              <Space className="step-wrapper" align="center">
                <div className="number">1.</div>
                <div className="label">Fill in values for your scenarios</div>
              </Space>
            </Col>
            <Col span={6} align="end">
              <Button
                icon={<PlusOutlined />}
                className="button-add-scenario"
                onClick={handleAddScenario}
                disabled={
                  scenarioModeling?.config?.scenarioData?.length ===
                  MAX_SCENARIO
                }
              >
                Add scenario
              </Button>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Tabs
          className="step-segment-tabs-container scenario-segment-tabs-container"
          type="card"
          tabBarGutter={5}
          items={scenarioTabItems}
          activeKey={activeScenario}
          onChange={(val) => {
            setActiveScenario(val);
          }}
        />
      </Col>
      {/* EOL Section 1 */}

      {/* Section 2 */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          <Space className="step-wrapper" align="center">
            <div className="number">2.</div>
            <div className="label">Compare your scenarios</div>
          </Space>
        </Card>
      </Col>

      <Col span={24}>
        <ChartIncomeGapAcrossScenario />
      </Col>
      {/* EOL Section 2 */}

      {/* Section 3 */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          <Space className="step-wrapper" align="top">
            <div className="number">3.</div>
            <div className="label">
              Better understand scenario outcomes for your segments
              <div className="description">
                In the table below, you can compare specific outcomes per
                segment to understand in which scenario the farmers in that
                segment reach the income target, how this is established, and
                how it compares to the current scenario.
              </div>
            </div>
          </Space>
        </Card>
      </Col>

      <Col span={24}>
        <TableScenarioOutcomes />
      </Col>
      {/* EOL Section 3 */}
    </Row>
  );
};

export default ClosingGap;
