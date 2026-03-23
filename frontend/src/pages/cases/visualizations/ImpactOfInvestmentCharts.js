import React, { useMemo, useState } from "react";
import { Row, Col, Typography, Space, Table, Card, Select, Tag } from "antd";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState } from "../store";
import { calculateScenarioROI, getLandArea } from "../utils/roiCalculations";
import { thousandFormatter } from "../../../components/chart/options/common";
import { orderBy } from "lodash";
import { VisualCardWrapper } from "../components";
import Chart from "../../../components/chart";

const { Text } = Typography;

const MAX_SCENARIO_SEGMENT = 5;

// Constant to toggle table visibility
const SHOW_SEGMENT_BREAKDOWN_TABLE = false;

const scenarioColors = [
  "#1B625F", // IDH Dark Green
  "#F9CB21", // IDH Yellow
  "#70CFAD", // Teal
  "#FDAE60", // Orange
  "#9CC2C1", // Light Green
  "#FFEEB8", // Light Yellow
  "#87D068", // Alt Green
];

const ImpactOfInvestmentCharts = () => {
  const { scenarioModeling, dashboardData } = CaseVisualState.useState(
    (s) => s
  );
  const currentCase = CurrentCaseState.useState((s) => s);
  const { currency } = currentCase;

  const [selectedCostScenarioSegments, setSelectedCostScenarioSegments] =
    useState([]);

  const [selectedRoiSegmentId, setSelectedRoiSegmentId] = useState("all");

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

  const costRoiData = useMemo(() => {
    if (selectedCostScenarioSegments.length === 0) {
      return allScenariosRoiData.map((sc) => ({
        ...sc,
        displayName: sc.name,
        selectedSegmentId: "all",
      }));
    }

    return selectedCostScenarioSegments
      .map((selection) => {
        const [scKey, segId] = selection.split(":::");
        const scenario = allScenariosRoiData.find(
          (d) => String(d.key) === String(scKey)
        );

        if (!scenario) {
          return null;
        }

        const findSegment = currentCase?.segments?.find(
          (s) => String(s.id) === String(segId)
        );
        const segmentName = findSegment?.name || "All Segments";

        // If segId is "all" or specific
        if (segId === "all") {
          return {
            ...scenario,
            displayName: `${scenario.name} - All Segments`,
            selectedSegmentId: "all",
          };
        }

        const segMetrics = scenario.segmentMetrics?.[segId];
        const segBreakdown = scenario.segmentComponentBreakdowns?.[segId];

        if (!segMetrics) {
          return {
            ...scenario,
            displayName: `${scenario.name} - ${segmentName}`,
            selectedSegmentId: segId,
            roi: 0,
            totalCost: 0,
            incomeImprovementPercentage: 0,
            paybackPeriod: 0,
            componentBreakdown: {},
          };
        }

        return {
          ...scenario,
          displayName: `${scenario.name} - ${segmentName}`,
          selectedSegmentId: segId,
          roi: segMetrics.roi,
          totalCost: segMetrics.totalCost,
          incomeImprovementPercentage: segMetrics.incomeImprovementPercentage,
          paybackPeriod: segMetrics.paybackPeriod,
          componentBreakdown: segBreakdown || {},
        };
      })
      .filter(Boolean);
  }, [
    allScenariosRoiData,
    selectedCostScenarioSegments,
    currentCase?.segments,
  ]);

  const componentCostChartData = useMemo(() => {
    const components = Array.from(
      new Set(
        costRoiData.flatMap((d) => Object.keys(d.componentBreakdown || {}))
      )
    ).sort();

    return components.map((compName) => ({
      name: compName,
      data: costRoiData.map((d, idx) => ({
        name: d.displayName || d.name || `Scenario ${idx + 1}`,
        value: d.componentBreakdown?.[compName] || 0,
        color: scenarioColors[idx % scenarioColors.length],
      })),
    }));
  }, [costRoiData]);

  const roiChartRoiData = useMemo(() => {
    if (selectedRoiSegmentId === "all") {
      return allScenariosRoiData.map((sc) => ({
        ...sc,
        displayName: sc.name,
      }));
    }

    return allScenariosRoiData
      .map((d) => {
        const segMetrics = d.segmentMetrics?.[selectedRoiSegmentId];
        const segBreakdown =
          d.segmentComponentBreakdowns?.[selectedRoiSegmentId];
        if (!segMetrics) {
          return null;
        }

        return {
          ...d,
          displayName: d.name,
          roi: segMetrics.roi,
          totalCost: segMetrics.totalCost,
          totalIncomeImprovement: segMetrics.incomeImprovement,
          incomeImprovementPercentage: segMetrics.incomeImprovementPercentage,
          paybackPeriod: segMetrics.paybackPeriod,
          componentBreakdown: segBreakdown || {},
        };
      })
      .filter(Boolean);
  }, [allScenariosRoiData, selectedRoiSegmentId]);

  const roiChartData = useMemo(() => {
    return roiChartRoiData.map((d, index) => ({
      name: d.displayName || d.name || `Scenario ${index + 1}`,
      order: index,
      data: [
        {
          name: "ROI (%)",
          value: parseFloat((d.roi * 100).toFixed(2)),
          color: scenarioColors[index % scenarioColors.length],
        },
      ],
    }));
  }, [roiChartRoiData]);

  const segmentOptions = useMemo(() => {
    const defaultOptions = [{ label: "All Segments", value: "all" }];
    const segments = (currentCase.segments || []).map((s) => ({
      label: s.name,
      value: s.id,
    }));
    return [...defaultOptions, ...segments];
  }, [currentCase.segments]);

  const scenarioSegmentOptions = useMemo(() => {
    let i = 1;
    const res = orderBy(
      scenarioModeling.config.scenarioData || [],
      "key"
    ).flatMap((sc) => {
      const allSegmentsOpt = {
        order: i++,
        label: `${sc.name} - All Segments`,
        value: `${sc.key}:::all`,
      };
      const segmentSelectOptions = (currentCase.segments || []).map((st) => {
        const opt = {
          order: i++,
          label: `${sc.name} - ${st.name}`,
          value: `${sc.key}:::${st.id}`,
        };
        return opt;
      });
      return [allSegmentsOpt, ...segmentSelectOptions];
    });
    return res;
  }, [scenarioModeling.config.scenarioData, currentCase.segments]);

  if (!investmentAnalysis?.is_enabled || allScenariosRoiData.length === 0) {
    return null;
  }

  const currencyLabel = currency || "USD";

  // Segment Breakdown Table Data
  // This table will show the breakdown for the FIRST selected scenario/segment in the multi-select
  const selectedScenarioForBreakdown = costRoiData[0];

  const segmentBreakdownData =
    selectedScenarioForBreakdown?.originalScenario?.investmentPerSegment &&
    selectedScenarioForBreakdown?.selectedSegmentId
      ? Object.keys(
          selectedScenarioForBreakdown.originalScenario.investmentPerSegment ||
            {}
        ).flatMap((segmentId) => {
          // Only show breakdown for the specifically selected segment, or all if "all" was selected
          if (
            selectedScenarioForBreakdown.selectedSegmentId !== "all" &&
            segmentId !== selectedScenarioForBreakdown.selectedSegmentId
          ) {
            return [];
          }

          const segInv =
            selectedScenarioForBreakdown.originalScenario.investmentPerSegment[
              segmentId
            ] || {};
          const segment = (dashboardData?.segments || []).find(
            (s) => String(s.id) === String(segmentId)
          );
          const segmentName = segment?.name || `Segment ${segmentId}`;
          const metrics =
            selectedScenarioForBreakdown.originalScenario.segmentMetrics?.[
              segmentId
            ] || {};
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
        })
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
                <Select
                  {...selectProps}
                  value={selectedCostScenarioSegments}
                  onChange={setSelectedCostScenarioSegments}
                  options={scenarioSegmentOptions.map((opt) => ({
                    ...opt,
                    disabled:
                      selectedCostScenarioSegments.length >=
                        MAX_SCENARIO_SEGMENT &&
                      !selectedCostScenarioSegments.includes(opt.value),
                  }))}
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Select Scenarios and Segments to compare"
                />
              </div>
            </Space>
          </Col>
        </Row>

        {/* Row 2: Segment Breakdown Table (Full Width) */}
        {SHOW_SEGMENT_BREAKDOWN_TABLE && costRoiData.length > 0 && (
          <Row>
            <Col span={24}>
              <VisualCardWrapper
                title={
                  <Space>
                    <span>Segment Cost Breakdown</span>
                    {costRoiData[0] && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        Showing: {costRoiData[0].displayName}
                      </Tag>
                    )}
                  </Space>
                }
                bordered
              >
                <div style={{ marginTop: 24, marginBottom: 48 }}>
                  <Text strong style={{ display: "block", marginBottom: 12 }}>
                    Segment Breakdown for {selectedScenarioForBreakdown?.name}
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
              </VisualCardWrapper>
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
                <Select
                  value={selectedRoiSegmentId}
                  onChange={setSelectedRoiSegmentId}
                  options={segmentOptions}
                  style={{ width: "100%" }}
                  placeholder="Select a segment"
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
