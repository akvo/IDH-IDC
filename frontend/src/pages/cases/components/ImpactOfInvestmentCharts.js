import React, { useMemo } from "react";
import { Row, Col, Typography, Space, Table, Tag } from "antd";
import { CaseVisualState, CurrentCaseState } from "../store";
import { calculateScenarioROI } from "../utils/roiCalculations";
import { thousandFormatter } from "../../../components/chart/options/common";
import { RiseOutlined } from "@ant-design/icons";
import VisualCardWrapper from "./VisualCardWrapper";

const { Text } = Typography;

const ImpactOfInvestmentCharts = () => {
  const { scenarioModeling } = CaseVisualState.useState((s) => s);
  const { segments, currency } = CurrentCaseState.useState((s) => s);

  const investmentAnalysis = scenarioModeling.config.investment_analysis;

  const roiData = useMemo(() => {
    if (!investmentAnalysis?.is_enabled) {
      return [];
    }

    return scenarioModeling.config.scenarioData
      .map((scenario) => {
        const result = calculateScenarioROI(
          scenario,
          investmentAnalysis,
          segments
        );
        return {
          key: scenario.key,
          name: scenario.name,
          ...result,
        };
      })
      .filter((d) => d.roi !== null);
  }, [scenarioModeling.config.scenarioData, investmentAnalysis, segments]);

  if (!investmentAnalysis?.is_enabled || roiData.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <VisualCardWrapper
            titleId="impact-of-investment-summary"
            title="Impact of Investment Summary"
            description="Comparison of investment costs and generated net income improvements across all scenarios."
          >
            <Table
              dataSource={roiData}
              pagination={false}
              size="middle"
              columns={[
                {
                  title: "Scenario",
                  dataIndex: "name",
                  key: "name",
                  render: (text) => (
                    <Text strong>{text || "Unnamed Scenario"}</Text>
                  ),
                },
                {
                  title: "Investment Cost",
                  dataIndex: "totalCost",
                  key: "totalCost",
                  align: "right",
                  render: (val) => (
                    <Space>
                      <Text type="secondary">{currency || "USD"}</Text>
                      {thousandFormatter(val, 2)}
                    </Space>
                  ),
                },
                {
                  title: "Net Income Improvement",
                  dataIndex: "totalIncomeImprovement",
                  key: "totalIncomeImprovement",
                  align: "right",
                  render: (val) => (
                    <Space style={{ color: val >= 0 ? "#52c41a" : "#f5222d" }}>
                      <RiseOutlined />
                      {thousandFormatter(val, 2)}
                    </Space>
                  ),
                },
                {
                  title: "ROI",
                  dataIndex: "roi",
                  key: "roi",
                  align: "center",
                  render: (val) => (
                    <Tag
                      color={val >= 1 ? "green" : val > 0 ? "orange" : "red"}
                    >
                      {(val * 100).toFixed(1)}%
                    </Tag>
                  ),
                },
              ]}
            />
          </VisualCardWrapper>
        </Col>
      </Row>
    </div>
  );
};

export default ImpactOfInvestmentCharts;
