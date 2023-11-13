import React, { useEffect, useState } from "react";
import { Row, Col, Tabs, Button, Space, message, Spin } from "antd";
import {
  DashboardIncomeOverview,
  DashboardSensitivityAnalysis,
  DashboardScenarioModeling,
} from "./";
import { api } from "../../../lib";
import { StepBackwardOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";

const IncomeDriverDashboard = ({
  commodityList,
  currentCaseId,
  dashboardData,
  questionGroups,
  setPage,
}) => {
  const [activeKey, setActiveKey] = useState("income-overview");
  const [messageApi, contextHolder] = message.useMessage();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // sensitivity analysis data
  const [binningData, setBinningData] = useState({});

  // scenario modeling data
  const [percentage, setPercentage] = useState(true);
  const [scenarioData, setScenarioData] = useState([
    { key: 1, name: "Scenario 1", description: "", scenarioValues: [] },
  ]);

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
        }
        // Scenario modeling
        const scenarioModelingConfig =
          data.find((v) => v.tab === "scenario_modeling")?.config || {};
        if (!isEmpty(scenarioModelingConfig)) {
          setPercentage(scenarioModelingConfig.percentage);
          setScenarioData(scenarioModelingConfig.scenarioData);
        }
        setTimeout(() => {
          setLoading(false);
        }, 100);
      });
    }
  }, [currentCaseId]);
  console.log("scenarioData", scenarioData);

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
    // Save
    api
      .post("visualization", payloads)
      .then(() => {
        messageApi.open({
          type: "success",
          content: "Visualization Dashboard saved successfully.",
        });
      })
      .catch((e) => {
        console.error(e);
        messageApi.open({
          type: "error",
          content: "Failed! Something went wrong.",
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
    <Row gutter={[16, 16]}>
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
          {activeKey !== "income-overview" ? (
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
