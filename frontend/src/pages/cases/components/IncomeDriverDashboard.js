import React, { useEffect, useState } from "react";
import { Row, Col, Tabs, Button, Space, message, Spin } from "antd";
import {
  DashboardIncomeOverview,
  DashboardSensitivityAnalysis,
  DashboardScenarioModeling,
  removeUndefinedObjectValue,
} from "./";
import { api } from "../../../lib";
import { StepBackwardOutlined } from "@ant-design/icons";
import { isEmpty, isEqual } from "lodash";

const IncomeDriverDashboard = ({
  commodityList,
  currentCaseId,
  currentCase,
  dashboardData,
  questionGroups,
  setPage,
  enableEditCase,
}) => {
  const [activeKey, setActiveKey] = useState("income-overview");
  const [messageApi, contextHolder] = message.useMessage();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // sensitivity analysis data
  const [binningData, setBinningData] = useState({});
  const [currentBinningData, setCurrentBinningData] = useState({});

  // scenario modeling data
  const [percentage, setPercentage] = useState(true);
  const [scenarioData, setScenarioData] = useState([
    { key: 1, name: "Scenario 1", description: null, scenarioValues: [] },
  ]);
  const [currentScenarioData, setCurrentScenarioData] = useState([]);

  useEffect(() => {
    if (currentCaseId) {
      setLoading(true);
      api.get(`visualization/case/${currentCaseId}`).then((res) => {
        const { data } = res;
        // Sensitivity analysis
        const sensitivityAnalysisConfig = data
          .filter((v) => v.tab === "sensitivity_analysis")
          .reduce(
            (res, curr) => ({
              ...res,
              ...curr.config,
            }),
            {}
          );
        if (!isEmpty(sensitivityAnalysisConfig)) {
          setBinningData((prev) => ({
            ...prev,
            ...sensitivityAnalysisConfig,
          }));
          setCurrentBinningData((prev) => ({
            ...prev,
            ...sensitivityAnalysisConfig,
          }));
        }
        // Scenario modeling
        const scenarioModelingConfig =
          data.find((v) => v.tab === "scenario_modeling")?.config || {};
        if (!isEmpty(scenarioModelingConfig)) {
          setPercentage(scenarioModelingConfig.percentage);
          setScenarioData(scenarioModelingConfig.scenarioData);
          setCurrentScenarioData(scenarioModelingConfig.scenarioData);
        }
        setTimeout(() => {
          setLoading(false);
        }, 100);
      });
    }
  }, [currentCaseId]);

  const disableSaveButton =
    isEmpty(binningData) &&
    isEmpty(scenarioData.filter((x) => x.scenarioValues.length));

  const handleSaveVisualization = () => {
    if (disableSaveButton) {
      return;
    }
    setSaving(true);
    let payloads = [];
    // Sensitivity analysis
    payloads = [
      ...payloads,
      {
        case: currentCaseId,
        tab: "sensitivity_analysis",
        config: binningData,
      },
    ];
    // Scenario modeling
    payloads = [
      ...payloads,
      {
        case: currentCaseId,
        tab: "scenario_modeling",
        config: {
          percentage: percentage,
          scenarioData: scenarioData,
        },
      },
    ];

    // sensitivity analysis
    const isBinningDataUpdated = !isEqual(
      removeUndefinedObjectValue(currentBinningData),
      removeUndefinedObjectValue(binningData)
    );
    // scenario modeler
    const currentScenarioDataTmp = currentScenarioData.map((d) => {
      const scenarioValues = d.scenarioValues.map((v) => {
        const filterAllNewValues = v?.allNewValues
          ? removeUndefinedObjectValue(v.allNewValues)
          : {};
        return { ...v, allNewValues: filterAllNewValues };
      });
      return { ...d, scenarioValues: scenarioValues };
    });
    const scenarioDataTmp = scenarioData.map((d) => {
      const scenarioValues = d.scenarioValues.map((v) => {
        const filterAllNewValues = v?.allNewValues
          ? removeUndefinedObjectValue(v.allNewValues)
          : {};
        return { ...v, allNewValues: filterAllNewValues };
      });
      return { ...d, scenarioValues: scenarioValues };
    });
    const isScenarioDataUpdated = !isEqual(
      currentScenarioDataTmp,
      scenarioDataTmp
    );
    const isUpdated = isBinningDataUpdated || isScenarioDataUpdated;

    // Save
    api
      .post(`visualization?updated=${isUpdated}`, payloads)
      .then(() => {
        setCurrentBinningData(binningData);
        setCurrentScenarioData(scenarioData);
        messageApi.open({
          type: "success",
          content: "Visualization Dashboard saved successfully.",
        });
      })
      .catch((e) => {
        console.error(e);
        const { status, data } = e.response;
        let errorText = "Failed to save case profile.";
        if (status === 403) {
          errorText = data.detail;
        }
        messageApi.open({
          type: "error",
          content: errorText,
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} id="income-driver-dashboard">
      {contextHolder}
      <Col span={24}>
        <Tabs
          onChange={setActiveKey}
          activeKey={activeKey}
          items={[
            {
              key: "income-overview",
              label: "Income Overview",
              children: (
                <DashboardIncomeOverview
                  currentCaseId={currentCaseId}
                  currentCase={currentCase}
                  commodityList={commodityList}
                  dashboardData={dashboardData}
                />
              ),
            },
            {
              key: "sensitivity-analysis",
              label: "Sensitivity Analysis",
              children: (
                <DashboardSensitivityAnalysis
                  currentCaseId={currentCaseId}
                  commodityList={commodityList}
                  dashboardData={dashboardData}
                  binningData={binningData}
                  setBinningData={setBinningData}
                  enableEditCase={enableEditCase}
                />
              ),
            },
            {
              key: "scenario-modeling",
              label: "Scenario Modeling",
              children: (
                <DashboardScenarioModeling
                  currentCaseId={currentCaseId}
                  commodityList={commodityList}
                  dashboardData={dashboardData}
                  questionGroups={questionGroups}
                  percentage={percentage}
                  setPercentage={setPercentage}
                  scenarioData={scenarioData}
                  setScenarioData={setScenarioData}
                  enableEditCase={enableEditCase}
                />
              ),
            },
          ]}
        />
      </Col>
      {/* Button */}
      <Col span={24}>
        <Row>
          <Col span={12}>
            <Button
              className="button button-submit button-secondary"
              onClick={() => setPage("Income Driver Data Entry")}
            >
              <StepBackwardOutlined />
              Previous
            </Button>
          </Col>
          {activeKey !== "income-overview" && enableEditCase ? (
            <Col
              span={12}
              style={{
                justifyContent: "flex-end",
                display: "grid",
              }}
            >
              <Space size={[8, 16]} wrap>
                <Button
                  htmlType="submit"
                  className="button button-submit button-secondary"
                  loading={saving}
                  onClick={handleSaveVisualization}
                  disabled={disableSaveButton}
                >
                  Save
                </Button>
              </Space>
            </Col>
          ) : null}
        </Row>
      </Col>
    </Row>
  );
};

export default IncomeDriverDashboard;
