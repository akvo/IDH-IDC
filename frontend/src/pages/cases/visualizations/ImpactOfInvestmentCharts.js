import React, { useMemo, useState } from "react";
import { Row, Col, Typography, Space, Table, Card, Select, Tag } from "antd";
import { CaseVisualState, CurrentCaseState } from "../store";
import { orderBy } from "lodash";
import { calculateScenarioROI, getLandArea } from "../utils/roiCalculations";
import {
  thousandFormatter,
  Color,
} from "../../../components/chart/options/common";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";

const { Text } = Typography;

// Constant to toggle table visibility
const SHOW_SEGMENT_BREAKDOWN_TABLE = false;

const ImpactOfInvestmentCharts = () => {
  const { scenarioModeling, dashboardData } = CaseVisualState.useState(
    (s) => s
  );
  const currentCase = CurrentCaseState.useState((s) => s);
  const { currency } = currentCase;

  const [selectedScenarioKey, setSelectedScenarioKey] = useState("all");
  const [selectedSegmentId, setSelectedSegmentId] = useState("all");

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
    const baseData =
      selectedScenarioKey === "all"
        ? allScenariosRoiData
        : allScenariosRoiData.filter((d) => d.key === selectedScenarioKey);

    if (selectedSegmentId === "all") {
      return baseData;
    }

    return baseData
      .map((d) => {
        const segMetrics = d.segmentMetrics?.[selectedSegmentId];
        const segBreakdown = d.segmentComponentBreakdowns?.[selectedSegmentId];
        if (!segMetrics) {
          return null;
        }

        return {
          ...d,
          roi: segMetrics.roi,
          totalCost: segMetrics.totalCost,
          totalIncomeImprovement: segMetrics.incomeImprovement,
          incomeImprovementPercentage: segMetrics.incomeImprovementPercentage,
          paybackPeriod: segMetrics.paybackPeriod,
          componentBreakdown: segBreakdown || {},
        };
      })
      .filter(Boolean);
  }, [allScenariosRoiData, selectedScenarioKey, selectedSegmentId]);

  const scenarioColors = [
    "#1B625F", // IDH Dark Green
    "#F9CB21", // IDH Yellow
    "#70CFAD", // Teal
    "#FDAE60", // Orange
    "#9CC2C1", // Light Green
    "#FFEEB8", // Light Yellow
    "#87D068", // Alt Green
  ];

  const componentCostChartData = useMemo(() => {
    const components = Array.from(
      new Set(roiData.flatMap((d) => Object.keys(d.componentBreakdown || {})))
    ).sort();

    return components.map((compName) => ({
      name: compName,
      data: roiData.map((d, idx) => ({
        name: d.name || `Scenario ${idx + 1}`,
        value: d.componentBreakdown?.[compName] || 0,
        color: scenarioColors[idx % scenarioColors.length],
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
          color: scenarioColors[index % scenarioColors.length],
        },
      ],
    }));
  }, [roiData]);

  const scenarioOptions = [
    { label: "Compare All Scenarios", value: "all" },
    ...allScenariosRoiData.map((d) => ({
      label: d.name || "Unnamed Scenario",
      value: d.key,
    })),
  ];

  const segmentOptions = useMemo(() => {
    const res = (currentCase.segments || []).map((s) => ({
      label: s.name || `Segment ${s.id}`,
      value: String(s.id),
    }));
    return [
      { label: "All Segments", value: "all" },
      ...orderBy(res, ["value"]),
    ];
  }, [currentCase.segments]);

  if (!investmentAnalysis?.is_enabled || allScenariosRoiData.length === 0) {
    return null;
  }

  const currencyLabel = currency || "USD";


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
          const segment = (dashboardData?.segments || []).find(
            (s) => String(s.id) === String(segmentId)
          );
          const segmentName = segment?.name || `Segment ${segmentId}`;
          const metrics =
            selectedScenarioData.segmentMetrics?.[segmentId] || {};
          const farmerCount = segment?.number_of_farmers || 0;
          const segmentLandArea = getLandArea(segment);

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
              farmers: farmerCount,
              landArea: segmentLandArea,
              unitType: comp.unit,
              multiplier:
                comp.unit === "per_farmer"
                  ? farmerCount
                  : comp.unit === "per_land_unit"
                  ? farmerCount * segmentLandArea
                  : 1,
              totalContribution:
                (comp.cost || 0) *
                (comp.unit === "per_farmer"
                  ? farmerCount
                  : comp.unit === "per_land_unit"
                  ? farmerCount * segmentLandArea
                  : 1),
              paybackPeriod: idx === 0 ? metrics.paybackPeriod : null,
              incomeIncrease:
                idx === 0 ? metrics.incomeImprovementPercentage : null,
              isFirstRow: idx === 0,
              rowCount: (segInv.components || []).length,
            }));
          }

          return [
            {
              key: `${segmentId}-total`,
              segmentId,
              segmentName,
              componentName: "Distributed Total",
              unit: "Total Cost",
              unitType: "total",
              cost: segInv.investment_cost || 0,
              farmers: segment?.number_of_farmers || 0,
              landArea: getLandArea(segment),
              multiplier: 1,
              totalContribution: segInv.investment_cost || 0,
              paybackPeriod: metrics.paybackPeriod,
              incomeIncrease: metrics.incomeImprovementPercentage,
              isFirstRow: true,
              rowCount: 1,
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
            </Space>
          </Col>
        </Row>

        {/* Row 2: Segment Breakdown Table (Full Width) */}
        {SHOW_SEGMENT_BREAKDOWN_TABLE &&
          selectedScenarioKey !== "all" &&
          segmentBreakdownData.length > 0 && (
            <Row>
              <Col span={24}>
                <div style={{ marginTop: 24, marginBottom: 48 }}>
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
                          rowSpan: record.isFirstRow ? record.rowCount : 0,
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
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {record.unitType === "per_farmer" ? (
                                <>
                                  {thousandFormatter(record.cost)} x{" "}
                                  {thousandFormatter(record.farmers)} farmers
                                </>
                              ) : record.unitType === "per_land_unit" ? (
                                <>
                                  {thousandFormatter(record.cost)} x{" "}
                                  {thousandFormatter(record.farmers)} farmers x{" "}
                                  {record.landArea}{" "}
                                  {currentCase?.area_size_unit || "acres"}
                                </>
                              ) : (
                                ""
                              )}
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
              </Col>
            </Row>
          )}

        {/* Row 3: ROI (Right) + Text (Left) */}
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
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  View data for:
                </Text>
                <Select
                  value={selectedSegmentId}
                  onChange={setSelectedSegmentId}
                  options={segmentOptions}
                  style={{ width: "100%", maxWidth: "300px" }}
                  placeholder="Select Segment"
                />
              </Space>
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
