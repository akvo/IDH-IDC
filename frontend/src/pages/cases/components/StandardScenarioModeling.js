import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Tabs,
  Popconfirm,
  notification,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { ScenarioModelingForm } from "../components";
import { CaseVisualState, CurrentCaseState } from "../store";
import { isEmpty, orderBy, isEqual } from "lodash";
import {
  ChartIncomeGapAcrossScenario,
  TableScenarioOutcomes,
  ImpactOfInvestmentCharts,
} from "../visualizations";

const MAX_SCENARIO = 3;
const deleteButtonPosition = "tab-item";

const StandardScenarioModeling = () => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const scenarioModeling = CaseVisualState.useState((s) => s.scenarioModeling);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [activeScenario, setActiveScenario] = useState(
    orderBy(scenarioModeling?.config?.scenarioData, "key")?.[0]?.key || null
  );
  const [deleting, setDeleting] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const prevActiveScenarioRef = useRef(activeScenario);

  useEffect(() => {
    if (
      prevActiveScenarioRef.current !== activeScenario &&
      activeScenario !== null
    ) {
      const scenarioInv =
        scenarioModeling.config.investment_analysis?.scenarios?.[
          activeScenario
        ] || {};
      const costAllocationMode =
        scenarioInv.cost_allocation_mode ||
        (scenarioInv.is_roi_enabled ? "per_segment" : "no");

      if (costAllocationMode === "no") {
        const scenarioName =
          scenarioModeling.config.scenarioData.find(
            (s) => s.key === activeScenario
          )?.name || "Target Scenario";

        api.info({
          message: "ROI Modeling Disabled",
          description: `ROI modeling is currently disabled for "${scenarioName}". You can enable it in the ROI section below if needed.`,
          placement: "topRight",
          duration: 5,
        });
      }
      prevActiveScenarioRef.current = activeScenario;
    }
  }, [activeScenario, scenarioModeling, api]);

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

  // handle initial scenario data for all segments (run only once)
  // and when dashboard data updated
  useEffect(() => {
    if (isEmpty(dashboardData)) {
      return;
    }

    const nextScenarioData = orderBy(
      scenarioModeling.config.scenarioData.map((scenario) => {
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
    );

    if (!isEqual(scenarioModeling.config.scenarioData, nextScenarioData)) {
      CaseVisualState.update((s) => ({
        ...s,
        scenarioModeling: {
          ...s.scenarioModeling,
          case: currentCase.id,
          config: {
            ...s.scenarioModeling.config,
            scenarioData: nextScenarioData,
          },
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData]);

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
    <>
      {contextHolder}
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
        <div className="scenario-info-box">
          <div className="title">Building your scenarios</div>
          <p>
            A scenario represents a set of practical actions that change one or
            more income drivers. These can range from targeted interventions
            (e.g. access to inputs, training) to broader approaches (e.g. crop
            diversification or new sourcing models).
          </p>
          <p>
            Use the percentage changes explored earlier as a starting point, and
            translate them into realistic combinations of actions. Each scenario
            should reflect a coherent strategy you could implement, allowing you
            to compare which approaches are both impactful and feasible.
          </p>
        </div>
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
            <div className="label">Assess the impact of your investment</div>
          </Space>
        </Card>
      </Col>

      <Col span={24}>
        <div className="scenario-info-box">
          <p>
            This section allows you to assess the return on investment of each
            scenario in terms of its contribution to closing the income gap for
            farmers. It helps you compare the cost-efficiency of different
            interventions, understand the main cost components involved in
            implementation, and see how your resources translate into income
            improvements at farmer and segment level. The focus is on social
            returns rather than financial returns for the company.
          </p>
          <p>
            Use the first graph to understand the total cost of each scenario
            and which components are driving that cost. Consider this total cost
            in light of the second graph which tells you which scenario returns
            the highest social impact. You might find that a more affordable
            scenario returns higher social impact.
          </p>
        </div>
      </Col>

      <Col span={24}>
        <ImpactOfInvestmentCharts />
      </Col>
      {/* EOL Section 3 */}

      {/* Section 4 */}
      <Col span={24}>
        <Card className="card-section-wrapper">
          <Space className="step-wrapper" align="top">
            <div className="number">4.</div>
            <div className="label">
              Better understand scenario outcomes for your segments
            </div>
          </Space>
        </Card>
      </Col>

      <Col span={24}>
        <div className="scenario-info-box">
          <p>
            In the table below, you can compare specific outcomes per segment to
            understand in which scenario the farmers in that segment reach the
            income target, how this is established, and how it compares to the
            current scenario.
          </p>
        </div>
      </Col>

      <Col span={24}>
        <TableScenarioOutcomes />
      </Col>
    </>
  );
};

export default StandardScenarioModeling;
