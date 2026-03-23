import React, { useMemo, useState } from "react";
import { Row, Col, Typography, Space, Table, Card, Select, Tag } from "antd";
import { CaseVisualState, CurrentCaseState } from "../store";
import { calculateScenarioROI } from "../utils/roiCalculations";
import {
  thousandFormatter,
  Color,
} from "../../../components/chart/options/common";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";

const { Text } = Typography;

const ImpactOfInvestmentCharts = () => {
  const { scenarioModeling, dashboardData } = CaseVisualState.useState(
    (s) => s
  );
  const { currency } = CurrentCaseState.useState((s) => s);

  const [selectedScenarioKey, setSelectedScenarioKey] = useState("all");

  const investmentAnalysis = scenarioModeling.config.investment_analysis;

  const allScenariosRoiData = useMemo(() => {
    if (!investmentAnalysis?.is_enabled) {
      return [];
    }

    return (scenarioModeling.config.scenarioData || [])
      .map((scenario) => {
        const result = calculateScenarioROI(
          scenario,
          investmentAnalysis,
          dashboardData
        );
        return {
          key: scenario.key,
          name: scenario.name,
          ...result,
          originalScenario: scenario,
        };
      })
      .filter((d) => d && d.totalCost !== null);
  }, [scenarioModeling.config.scenarioData, investmentAnalysis, dashboardData]);

  const roiData = useMemo(() => {
    if (selectedScenarioKey === "all") {
      return allScenariosRoiData;
    }
    return allScenariosRoiData.filter((d) => d.key === selectedScenarioKey);
  }, [allScenariosRoiData, selectedScenarioKey]);

  const componentCostChartData = useMemo(() => {
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

  if (!investmentAnalysis?.is_enabled || allScenariosRoiData.length === 0) {
    return null;
  }

  const currencyLabel = currency || "USD";

  const scenarioOptions = [
    { label: "Compare All Scenarios", value: "all" },
    ...allScenariosRoiData.map((d) => ({
      label: d.name || "Unnamed Scenario",
      value: d.key,
    })),
  ];

  const selectedScenarioData =
    selectedScenarioKey !== "all"
      ? allScenariosRoiData.find((d) => d.key === selectedScenarioKey)
      : null;

  // Segment Breakdown Table Data
  const segmentBreakdownData = selectedScenarioData?.investmentPerSegment
    ? Object.keys(selectedScenarioData.investmentPerSegment || {}).flatMap(
        (segmentId) => {
          const segInv =
            selectedScenarioData.investmentPerSegment[segmentId] || {};
          const segment = dashboardData.find(
            (s) => String(s.id) === String(segmentId)
          );
          const segmentName = segment?.name || `Segment ${segmentId}`;
          const metrics =
            selectedScenarioData.segmentMetrics?.[segmentId] || {};

          if ((segInv.components || []).length > 0) {
            return (segInv.components || []).map((comp, idx) => ({
              key: `${segmentId}-${comp.name}-${idx}`,
              segmentId,
              segmentName,
              componentName: comp.name,
              unit:
                comp.unit === "total"
                  ? "Total Cost"
                  : comp.unit === "per_farmer"
                  ? "Per Farmer"
                  : "Per Land Unit",
              cost: comp.cost,
              multiplier:
                comp.unit === "per_farmer"
                  ? segment?.number_of_farmers || 0
                  : comp.unit === "per_land_unit"
                  ? (segment?.number_of_farmers || 0) *
                    (parseFloat(segment?.land_size) || 0)
                  : 1,
              totalContribution:
                (comp.cost || 0) *
                (comp.unit === "per_farmer"
                  ? segment?.number_of_farmers || 0
                  : comp.unit === "per_land_unit"
                  ? (segment?.number_of_farmers || 0) *
                    (parseFloat(segment?.land_size) || 0)
                  : 1),
              paybackPeriod: idx === 0 ? metrics.paybackPeriod : null,
              incomeIncrease:
                idx === 0 ? metrics.incomeImprovementPercentage : null,
              isFirstRow: idx === 0,
            }));
          }

          return [
            {
              key: `${segmentId}-total`,
              segmentId,
              segmentName,
              componentName: "Distributed Total",
              unit: "Total Cost",
              cost: segInv.investment_cost || 0,
              multiplier: 1,
              totalContribution: segInv.investment_cost || 0,
              paybackPeriod: metrics.paybackPeriod,
              incomeIncrease: metrics.incomeImprovementPercentage,
              isFirstRow: true,
            },
          ];
        }
      )
    : [];

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
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div className="section-title">Scenario Cost by component</div>
              <div className="section-description">
                The visual on the left shows scenario cost broken down by
                component. It allows you to compare investment focus across
                projects and identify the main cost drivers within each
                scenario.
              </div>
              <div style={{ marginTop: 8 }}>
                <Text
                  type="secondary"
                  strong
                  style={{ display: "block", marginBottom: 8 }}
                >
                  View data for:
                </Text>
                <Select
                  value={selectedScenarioKey}
                  onChange={setSelectedScenarioKey}
                  options={scenarioOptions}
                  style={{ width: "100%" }}
                  placeholder="Select a scenario"
                />
              </div>

              {selectedScenarioKey !== "all" &&
                segmentBreakdownData.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <Text strong style={{ display: "block", marginBottom: 12 }}>
                      Segment Breakdown for {selectedScenarioData?.name}
                    </Text>
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={segmentBreakdownData}
                      columns={[
                        {
                          title: "Segment",
                          dataIndex: "segmentName",
                          key: "segmentName",
                          onCell: (record) => ({
                            rowSpan: record.isFirstRow ? 32767 : 0, // Simplified rowSpan
                          }),
                        },
                        {
                          title: "Component",
                          dataIndex: "componentName",
                          key: "componentName",
                        },
                        {
                          title: "Applied Cost",
                          key: "calculated",
                          align: "right",
                          render: (_, record) => (
                            <Space direction="vertical" size={0} align="end">
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {record.unit === "Total Cost"
                                  ? ""
                                  : `${thousandFormatter(
                                      record.cost
                                    )} x ${thousandFormatter(
                                      record.multiplier
                                    )}`}
                              </Text>
                              <Text strong>
                                {currencyLabel}{" "}
                                {thousandFormatter(record.totalContribution, 2)}
                              </Text>
                            </Space>
                          ),
                        },
                        {
                          title: "Income Incr. (%)",
                          dataIndex: "incomeIncrease",
                          key: "incomeIncrease",
                          align: "center",
                          render: (val) =>
                            typeof val === "number" ? (
                              <Tag color="cyan">{val.toFixed(1)}%</Tag>
                            ) : null,
                        },
                        {
                          title: "Payback (Yrs)",
                          dataIndex: "paybackPeriod",
                          key: "paybackPeriod",
                          align: "center",
                          render: (val) =>
                            typeof val === "number" ? (
                              <Tag color="purple">{val.toFixed(1)}</Tag>
                            ) : val !== null && typeof val !== "undefined" ? (
                              <Tag color="default">∞</Tag>
                            ) : null,
                        },
                      ]}
                    />
                  </div>
                )}
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
      </Space>
    </Card>
  );
};

export default ImpactOfInvestmentCharts;
