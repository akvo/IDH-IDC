import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stepPath, CurrentCaseState, CaseVisualState } from "../store";
import { Row, Col, Space, Card, Button, Tabs } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ScenarioModelingForm } from "../components";
import { isEmpty } from "lodash";

/**
 * STEP 5
 */
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
              <Button icon={<PlusOutlined />} className="button-add-scenario">
                Add scenario
              </Button>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col span={24}>
        <Tabs
          className="step-segment-tabs-container"
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
    </Row>
  );
};

export default ClosingGap;
