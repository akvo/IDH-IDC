import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentCaseState, CaseVisualState, CaseUIState } from "../store";
import { Row, Col, Space, Card, Button, Tabs, message, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { ScenarioModelingForm } from "../components";
import { isEmpty, orderBy, isEqual } from "lodash";
import {
  ChartIncomeGapAcrossScenario,
  TableScenarioOutcomes,
} from "../visualizations";
import { api, removeUndefinedObjectValue } from "../../../lib";

/**
 * STEP 5
 */

const MAX_SCENARIO = 3;
const deleteButtonPosition = "tab-item";

const ClosingGap = ({ setbackfunction, setnextfunction, setsavefunction }) => {
  const navigate = useNavigate();
  const currentCase = CurrentCaseState.useState((s) => s);
  const { scenarioModeling, dashboardData, prevScenarioModeling } =
    CaseVisualState.useState((s) => s);
  const { enableEditCase } = CaseUIState.useState((s) => s.general);

  const [activeScenario, setActiveScenario] = useState(
    orderBy(scenarioModeling?.config?.scenarioData, "key")?.[0]?.key || null
  );
  const [deleting, setDeleting] = useState(false);

  const onDeleteScenario = useCallback(
    ({ currentScenarioData, scenarioDataState }) => {
      setDeleting(true);
      const remainScenarios = scenarioDataState.filter(
        (sd) => sd.key !== currentScenarioData.key
      );
      CaseVisualState.update((s) => ({
        ...s,
        scenarioModeling: {
          ...s.scenarioModeling,
          config: {
            ...s.scenarioModeling.config,
            scenarioData: remainScenarios,
          },
        },
      }));
      setActiveScenario(remainScenarios[0]?.key);
      setDeleting(false);
    },
    []
  );

  const [messageApi, contextHolder] = message.useMessage();

  const upateCaseButtonState = (value) => {
    CaseUIState.update((s) => ({
      ...s,
      caseButton: value,
    }));
  };

  const handleSaveVisualization = useCallback(
    ({ allowNavigate = false }) => {
      if (!enableEditCase) {
        console.info(allowNavigate);
        return;
      }

      upateCaseButtonState({ loading: true });
      const payloads = [scenarioModeling];
      // scenario modeling
      const isScenarioUpdated = !isEqual(
        removeUndefinedObjectValue(prevScenarioModeling?.config),
        removeUndefinedObjectValue(scenarioModeling?.config)
      );
      // save only when the payloads is provided
      if (!isEmpty(payloads?.[0]?.config) && payloads?.[0]?.case) {
        // Save
        api
          .sendCompressedData(
            `visualization?updated=${isScenarioUpdated}`,
            payloads
          )
          .then(() => {
            CaseVisualState.update((s) => ({
              ...s,
              prevScenarioModeling: {
                ...scenarioModeling,
              },
            }));
            messageApi.open({
              type: "success",
              content: "Scenario modeling value saved successfully.",
            });
          })
          .catch((e) => {
            console.error(e);
            const { status, data } = e.response;
            let errorText = "Failed to save scenario modeling value.";
            if (status === 403) {
              errorText = data.detail;
            }
            messageApi.open({
              type: "error",
              content: errorText,
            });
          })
          .finally(() => {
            upateCaseButtonState({ loading: false });
          });
      } else {
        upateCaseButtonState({ loading: false });
      }
    },
    [enableEditCase, messageApi, prevScenarioModeling, scenarioModeling]
  );

  const backFunction = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const nextFunction = useCallback(() => {
    handleSaveVisualization({ allowNavigate: true });
  }, [handleSaveVisualization]);

  const saveFunction = useCallback(() => {
    handleSaveVisualization({ allowNavigate: false });
  }, [handleSaveVisualization]);

  useEffect(() => {
    if (setbackfunction) {
      setbackfunction(backFunction);
    }
    if (setnextfunction) {
      setnextfunction(nextFunction);
    }
    if (setsavefunction) {
      setsavefunction(saveFunction);
    }
  }, [
    setbackfunction,
    setnextfunction,
    setsavefunction,
    backFunction,
    nextFunction,
    saveFunction,
  ]);

  // handle initial scenario data for all segments (run only once)
  // and when dashboard data updated
  useEffect(() => {
    CaseVisualState.update((s) => ({
      ...s,
      scenarioModeling: {
        ...s.scenarioModeling,
        case: currentCase.id,
        config: {
          ...s.scenarioModeling.config,
          scenarioData: orderBy(
            s.scenarioModeling.config.scenarioData.map((scenario) => {
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
              // add currentSegmentValue
              return {
                ...scenario,
                scenarioValues: scenario?.scenarioValues?.map((sv) => {
                  const findDashboardData = dashboardData.find(
                    (d) => d.id === sv.segmentId
                  );
                  return {
                    ...sv,
                    currentSegmentValue: findDashboardData || {},
                  };
                }),
              };
            }),
            "key"
          ),
        },
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData]);
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
            case: currentCase.id,
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

  const handleOnClickComplete = () => {
    handleSaveVisualization({ allowNavigate: false });
    api
      .put(`case/update-status/${currentCase.id}?status=1`)
      .then(() => {
        CurrentCaseState.update((s) => ({
          ...s,
          status: 1,
        }));
        messageApi.open({
          type: "success",
          content: `Case ${currentCase.name} mark as completed.`,
        });
      })
      .catch((e) => {
        console.error(e);
        // const { status, data } = e.response;
        const errorText = "Failed to mark this case as completed.";
        messageApi.open({
          type: "error",
          content: errorText,
        });
      })
      .finally(() => {});
  };

  const scenarioTabItems = useMemo(() => {
    const showDeleteButton = scenarioModeling?.config?.scenarioData?.length > 1;
    return orderBy(scenarioModeling?.config?.scenarioData, "key")?.map(
      (item) => ({
        label: (
          <Space>
            {item.name}
            {deleteButtonPosition === "tab-item" && showDeleteButton ? (
              <Popconfirm
                title="Delete"
                description="Are you sure want to delete current scenario?"
                okText="Yes"
                cancelText="No"
                onConfirm={() =>
                  onDeleteScenario({
                    currentScenarioData: item,
                    scenarioDataState: scenarioModeling?.config?.scenarioData,
                  })
                }
                okButtonProps={{
                  loading: deleting,
                  disabled: deleting,
                }}
              >
                <Button
                  icon={<DeleteOutlined style={{ marginLeft: 12 }} />}
                  size="small"
                  className="button-delete-scenario"
                  style={{ border: "none" }}
                />
              </Popconfirm>
            ) : (
              ""
            )}
          </Space>
        ),
        key: item.key,
        children: (
          <ScenarioModelingForm
            showDeleteButton={showDeleteButton}
            currentScenarioData={item}
            setActiveScenario={setActiveScenario}
            deleteButtonPosition={deleteButtonPosition}
          />
        ),
      })
    );
  }, [
    scenarioModeling?.config?.scenarioData,
    setActiveScenario,
    deleting,
    onDeleteScenario,
  ]);

  return (
    <Row id="closing-gap" gutter={[24, 24]}>
      {contextHolder}
      <Col span={24} className="header-wrapper">
        <Space direction="vertical">
          <div className="title">
            Modelling different intervention scenarios
          </div>
          <div className="description">
            This section enables you to create scenarios and test different
            strategies to close the income gap. By adjusting each income driver
            based on the tailored strategy, it allows you to visualise its
            impact on the income gap for each segment.
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
          activeKey={
            activeScenario ||
            orderBy(scenarioModeling?.config?.scenarioData, "key")?.[0]?.key
          }
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
        <ChartIncomeGapAcrossScenario activeScenario={activeScenario} />
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

      {/* Complete Button */}
      <Col span={24}>
        <Card className="complete-button-wrapper">
          <div className="text-wrapper">
            <div className="title">
              You’ve reached the final step of the Income Driver Calculator
            </div>
            <div className="description">
              Would you like to mark this case as complete? Doing so makes it
              easier for others to review and analyse the results at a later
              stage.
            </div>
          </div>
          <div className="button-wrapper">
            <Button
              className="button-complete"
              size="large"
              onClick={handleOnClickComplete}
            >
              Mark as complete
            </Button>
          </div>
        </Card>
      </Col>
      {/* EOL Complete Button */}
    </Row>
  );
};

export default ClosingGap;
