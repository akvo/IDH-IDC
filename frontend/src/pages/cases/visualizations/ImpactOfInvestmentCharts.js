import React, { useMemo } from "react";
import { Row, Col, Typography, Space, Table, Tag } from "antd";
import { CaseVisualState, CurrentCaseState } from "../store";
import { calculateScenarioROI } from "../utils/roiCalculations";
import {
  thousandFormatter,
  Color,
} from "../../../components/chart/options/common";
import { RiseOutlined } from "@ant-design/icons";
import VisualCardWrapper from "../components/VisualCardWrapper";
import Chart from "../../../components/chart";

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
      .filter((d) => d.totalCost !== null);
  }, [scenarioModeling.config.scenarioData, investmentAnalysis, segments]);

  const roiChartData = useMemo(() => {
    return roiData.map((d, index) => ({
      name: d.name || `Scenario ${index + 1}`,
      order: index,
      data: [
        {
          name: "ROI (%)",
          value: parseFloat((d.roi * 100).toFixed(2)),
          color: d.roi >= 1 ? "#52c41a" : d.roi > 0 ? "#faad14" : "#ff4d4f",
        },
      ],
    }));
  }, [roiData]);

  const comparisonChartData = useMemo(() => {
    return roiData.map((d, index) => ({
      name: d.name || `Scenario ${index + 1}`,
      order: index,
      data: [
        {
          name: "Total Investment Cost",
          value: d.totalCost,
          color: "#9292ab",
        },
        {
          name: "Total Net Income Improvement",
          value: d.totalIncomeImprovement,
          color: Color.color[0],
        },
      ],
    }));
  }, [roiData]);

  if (!investmentAnalysis?.is_enabled || roiData.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <Row gutter={[24, 24]}>
        {/* Visualizations */}
        <Col span={12}>
          <Chart
            type="COLUMN-BAR"
            title="Return on Investment (%)"
            data={roiChartData}
            percentage={true}
            height={400}
            extra={{
              yAxisTitle: "ROI (%)",
            }}
          />
        </Col>
        <Col span={12}>
          <Chart
            type="COLUMN-BAR"
            title={`Investment vs. Income Improvement (${currency || "USD"})`}
            data={comparisonChartData}
            height={400}
            extra={{
              yAxisTitle: currency || "USD",
            }}
          />
        </Col>

        {/* Summary Table */}
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
              rowKey="key"
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
