import React, { useMemo } from "react";
import { Row, Col, Typography, Space, Table, Tag, Card } from "antd";
import { CaseVisualState, CurrentCaseState } from "../store";
import { calculateScenarioROI } from "../utils/roiCalculations";
import {
  thousandFormatter,
  Color,
} from "../../../components/chart/options/common";
import { RiseOutlined } from "@ant-design/icons";
import { VisualCardWrapper } from "../components";
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

    return (scenarioModeling.config.scenarioData || [])
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
      .filter((d) => d && d.totalCost !== null);
  }, [scenarioModeling.config.scenarioData, investmentAnalysis, segments]);

  const componentCostChartData = useMemo(() => {
    // Grouped column chart: X-axis = Component Name, Series = Scenarios
    const components = Array.from(
      new Set(roiData.flatMap((d) => Object.keys(d.componentBreakdown || {})))
    ).sort();

    return components.map((compName) => ({
      name: compName,
      data: roiData.map((d, idx) => ({
        name: d.name || `Scenario ${idx + 1}`,
        value: d.componentBreakdown?.[compName] || 0,
        color: Color.color[idx % Color.color.length],
      })),
    }));
  }, [roiData]);

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

  if (!investmentAnalysis?.is_enabled || roiData.length === 0) {
    return null;
  }

  const currencyLabel = currency || "USD";

  return (
    <Card className="card-visual-wrapper" style={{ border: "none" }}>
      <Space direction="vertical" size={48} style={{ width: "100%" }}>
        {/* Row 1: Scenario Cost by component (Left) + Text (Right) */}
        <Row gutter={[48, 24]} align="top">
          <Col span={14}>
            <VisualCardWrapper title="Scenario Cost by component" bordered>
              <Chart
                wrapper={false}
                type="COLUMN-BAR"
                data={componentCostChartData}
                height={400}
                extra={{
                  yAxisTitle: currencyLabel,
                  legend: { position: "bottom" },
                }}
              />
            </VisualCardWrapper>
          </Col>
          <Col span={10}>
            <Space direction="vertical" size={16}>
              <div className="section-title">Scenario Cost by component</div>
              <div className="section-description">
                The visual on the left shows scenario cost broken down by
                component. It allows you to compare investment focus across
                projects and identify the main cost drivers within each
                scenario.
              </div>
            </Space>
          </Col>
        </Row>

        {/* Row 2: ROI (Right) + Text (Left) */}
        <Row gutter={[48, 24]} align="top">
          <Col span={10}>
            <Space direction="vertical" size={16}>
              <div className="section-title">Return on Investment</div>
              <div className="section-description">
                The graphs on the right show the return on investment of your
                scenarios. They allow you to compare the scale of impact,
                cost-efficiency, and identify which segments benefit most
                proportionally from the interventions.
              </div>
            </Space>
          </Col>
          <Col span={14}>
            <VisualCardWrapper title="Return on Investment (%)" bordered>
              <Chart
                wrapper={false}
                type="COLUMN-BAR"
                data={roiChartData}
                percentage={true}
                height={350}
                extra={{
                  yAxisTitle: "ROI (%)",
                  legend: { hide: true },
                }}
              />
            </VisualCardWrapper>
          </Col>
        </Row>

        {/* Summary Table */}
        <VisualCardWrapper
          titleId="impact-of-investment-summary"
          title="Impact of Investment Summary"
          description="Detailed comparison of investment costs and generated net income improvements across all scenarios."
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
                    <Text type="secondary">{currencyLabel}</Text>
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
                  <Tag color={val >= 1 ? "green" : val > 0 ? "orange" : "red"}>
                    {(val * 100).toFixed(1)}%
                  </Tag>
                ),
              },
            ]}
          />
        </VisualCardWrapper>
      </Space>
    </Card>
  );
};

export default ImpactOfInvestmentCharts;
