import React, { useMemo, useState, useEffect, useRef } from "react";
import { Row, Col, Typography, Space, Table, Card, Select, Tag } from "antd";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState, CaseUIState } from "../store";
import { calculateScenarioROI, getLandArea } from "../utils/roiCalculations";
import {
  thousandFormatter,
  formatNumberToString,
} from "../../../components/chart/options/common";
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
  const {
    scenarioModeling,
    dashboardData,
    questionGroups,
    totalIncomeQuestions,
  } = CaseVisualState.useState((s) => s);

  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);
  const { currency } = currentCase;
  const currencyLabel = currency || "USD";

  const [selectedCostScenarioSegments, setSelectedCostScenarioSegments] =
    useState([]);

  const [selectedRoiScenarioSegments, setSelectedRoiScenarioSegments] =
    useState([]);

  const [showCostLabel, setShowCostLabel] = useState(false);
  const [showRoiLabel, setShowRoiLabel] = useState(false);
  const [showTableLabel, setShowTableLabel] = useState(false);

  const costCardRef = useRef(null);
  const tableCardRef = useRef(null);
  const roiCardRef = useRef(null);

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
          currentCase.segments || [], // All segments for headcount
          dashboardData,
          currentCase,
          questionGroups,
          totalIncomeQuestions
        );
        return {
          key: scenario.key,
          name: scenario.name,
          ...result,
          originalScenario: scenario,
        };
      })
      .filter((d) => d && typeof d.roi === "number");
  }, [
    scenarioModeling.config.scenarioData,
    investmentAnalysis,
    dashboardData,
    currentCase,
    questionGroups,
    totalIncomeQuestions,
  ]);

  useEffect(() => {
    if (activeSegmentId === "all" && currentCase?.segments?.length > 0) {
      const firstSegId = currentCase.segments[0].id;
      if (firstSegId) {
        CaseUIState.update((s) => {
          s.general.activeSegmentId = firstSegId;
        });
      }
      return;
    }

    if (activeSegmentId) {
      // For both selectors, ensure at least one scenario is showing this segment
      // We prioritize the first scenario for default view
      const activeScKey = scenarioModeling?.config?.scenarioData?.[0]?.key;
      if (activeScKey) {
        const val = `${activeScKey}:::${activeSegmentId}`;

        // Only auto-populate if we have "saved value" (non-zero cost) for this combination
        const scenario = allScenariosRoiData.find(
          (d) => String(d.key) === String(activeScKey)
        );
        const hasData =
          scenario?.segmentMetrics?.[activeSegmentId]?.totalCost > 0;

        if (hasData) {
          setSelectedCostScenarioSegments((prev) =>
            prev.length === 0 ? [val] : prev
          );
          setSelectedRoiScenarioSegments((prev) =>
            prev.length === 0 ? [val] : prev
          );
        }
      }
    }
  }, [
    activeSegmentId,
    scenarioModeling?.config?.scenarioData,
    allScenariosRoiData,
    currentCase?.segments,
  ]);

  const handleCostSelectorChange = (vals) => {
    setSelectedCostScenarioSegments(vals);
    if (vals.length > 0) {
      const lastVal = vals[vals.length - 1];
      const [, segId] = lastVal.split(":::");
      if (segId !== "all" && segId !== activeSegmentId) {
        CaseUIState.update((s) => {
          s.general.activeSegmentId = segId;
        });
      }
    }
  };

  const handleRoiSelectorChange = (vals) => {
    setSelectedRoiScenarioSegments(vals);
    if (vals.length > 0) {
      const lastVal = vals[vals.length - 1];
      const [, segId] = lastVal.split(":::");
      if (segId !== "all" && segId !== activeSegmentId) {
        CaseUIState.update((s) => {
          s.general.activeSegmentId = segId;
        });
      }
    }
  };

  const costRoiData = useMemo(() => {
    if (selectedCostScenarioSegments.length === 0) {
      return allScenariosRoiData.map((sc) => ({
        ...sc,
        displayName: sc.name,
        selectedSegmentId: "all",
        totalCost: sc.totalCost,
        componentBreakdown: sc.segmentComponentBreakdowns?.["all"] || {},
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

        const segMetrics =
          segId === "all" ? scenario : scenario.segmentMetrics?.[segId];
        const segBreakdown =
          segId === "all"
            ? scenario.segmentComponentBreakdowns?.["all"]
            : scenario.segmentComponentBreakdowns?.[segId];

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

  const componentCostWaterfallData = useMemo(() => {
    if (costRoiData.length === 0) {
      return {};
    }

    // Identify all unique component names across all selected scenarios
    const allCompNames = Array.from(
      new Set(
        costRoiData.flatMap((d) => Object.keys(d.componentBreakdown || {}))
      )
    ).sort();

    const labels = [...allCompNames, "Total Cost"];
    const series = [];

    costRoiData.forEach((d, scIdx) => {
      const breakdown = d.componentBreakdown || {};
      const placeholderData = [];
      const actualData = [];
      const totalData = [];

      let currentSum = 0;
      allCompNames.forEach((name) => {
        const val = breakdown[name] || 0;
        placeholderData.push(currentSum);
        actualData.push(val);
        totalData.push("-");
        currentSum += val;
      });

      // Final Total Bar
      placeholderData.push(0);
      actualData.push("-");
      totalData.push(d.totalCost || 0);

      const scColor = scenarioColors[scIdx % scenarioColors.length];

      series.push(
        {
          name: d.displayName,
          type: "bar",
          stack: `sc-${scIdx}`,
          itemStyle: { borderColor: "transparent", color: "transparent" },
          emphasis: {
            itemStyle: { borderColor: "transparent", color: "transparent" },
          },
          tooltip: { show: false },
          data: placeholderData,
          legendHoverLink: false,
          barWidth: 35,
          barGap: "30%",
        },
        {
          name: d.displayName,
          type: "bar",
          stack: `sc-${scIdx}`,
          label: {
            show: showCostLabel,
            position: "top",
            padding: [3, 5],
            backgroundColor: "rgba(0,0,0,0.3)",
            color: "#fff",
            borderRadius: 2,
            formatter: (v) => formatNumberToString(v.value),
          },
          itemStyle: { color: scColor },
          data: actualData,
          barWidth: 35,
          barGap: "30%",
        },
        {
          name: d.displayName,
          type: "bar",
          stack: `sc-${scIdx}`,
          label: {
            show: showCostLabel,
            position: "top",
            padding: [3, 5],
            backgroundColor: "rgba(0,0,0,0.3)",
            color: "#fff",
            borderRadius: 2,
            formatter: (v) => formatNumberToString(v.value),
          },
          itemStyle: {
            color: scColor,
            opacity: 0.8,
            borderType: "dashed",
            borderColor: "#333",
            borderWidth: 1,
          },
          data: totalData,
          barWidth: 35,
          barGap: "30%",
        }
      );
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          let res = `${params[0].name}`;
          // Filter out placeholders and empty values
          const visibleParams = params.filter(
            (p) => p.value !== "-" && p.color !== "transparent"
          );
          visibleParams.forEach((p) => {
            res += `<br/>${p.marker} ${
              p.seriesName
            }: ${currencyLabel} ${thousandFormatter(p.value, 2)}`;
          });
          return res;
        },
      },
      legend: {
        show: true,
        top: 0,
        icon: "circle",
        data: costRoiData.map((d, scIdx) => ({
          name: d.displayName,
          itemStyle: { color: scenarioColors[scIdx % scenarioColors.length] },
        })),
      },
      grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
      xAxis: {
        type: "category",
        splitLine: { show: false },
        data: labels,
        axisLabel: { interval: 0, rotate: 0 },
      },
      yAxis: {
        type: "value",
        name: currencyLabel,
        axisLabel: {
          formatter: (value) => formatNumberToString(value),
        },
      },
      series: series,
    };
  }, [costRoiData, currencyLabel, showCostLabel]);

  const roiChartRoiData = useMemo(() => {
    if (selectedRoiScenarioSegments.length === 0) {
      return allScenariosRoiData.map((sc) => ({
        ...sc,
        displayName: sc.name,
        selectedSegmentId: "all",
      }));
    }

    return selectedRoiScenarioSegments
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
            totalIncomeImprovement: 0,
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
          totalIncomeImprovement: segMetrics.incomeImprovement,
          incomeImprovementPercentage: segMetrics.incomeImprovementPercentage,
          paybackPeriod: segMetrics.paybackPeriod,
          componentBreakdown: segBreakdown || {},
        };
      })
      .filter(Boolean);
  }, [allScenariosRoiData, selectedRoiScenarioSegments, currentCase?.segments]);

  const roiChartData = useMemo(() => {
    return roiChartRoiData.map((d, index) => ({
      name: d.displayName || d.name || `Scenario ${index + 1}`,
      value: parseFloat((d.roi || 0).toFixed(4)),
      color: scenarioColors[index % scenarioColors.length],
      order: index,
    }));
  }, [roiChartRoiData]);

  const roiChartOptions = useMemo(() => {
    return {
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          return `${params.marker} ${params.name}: ${params.value}`;
        },
      },
      legend: {
        show: true,
        top: 0,
        icon: "circle",
        data: roiChartData.map((d) => d.name),
      },
      grid: {
        top: 60,
        bottom: 40,
        left: 60,
        right: 40,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: ["ROI"],
        axisLabel: { show: false }, // Hide X-axis label "ROI"
      },
      yAxis: {
        type: "value",
        name: "ROI (%)",
        axisLabel: {
          formatter: "{value}%",
        },
      },
      series: roiChartData.map((d) => ({
        name: d.name,
        type: "bar",
        barWidth: 45,
        emphasis: { focus: "series" },
        itemStyle: { color: d.color },
        data: [d.value],
        label: {
          show: showRoiLabel,
          position: "top",
          padding: [3, 5],
          backgroundColor: "rgba(0,0,0,0.3)",
          color: "#fff",
          borderRadius: 2,
          formatter: "{c}",
        },
      })),
    };
  }, [roiChartData, showRoiLabel]);

  const scenarioSegmentOptions = useMemo(() => {
    return orderBy(allScenariosRoiData, ["name"]).flatMap((scenario) => {
      return (currentCase?.segments || []).map((seg) => ({
        label: `${scenario.name} - ${seg.name}`,
        value: `${scenario.key}:::${seg.id}`,
      }));
    });
  }, [allScenariosRoiData, currentCase?.segments]);

  if (!investmentAnalysis?.is_enabled || allScenariosRoiData.length === 0) {
    return null;
  }

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
          const segment = (dashboardData || []).find(
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
              componentName: "Total Cost",
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
            <VisualCardWrapper
              title="Scenario Cost by component"
              bordered
              showLabel={showCostLabel}
              setShowLabel={setShowCostLabel}
              exportElementRef={costCardRef}
              exportFilename="Scenario Cost by component"
            >
              <Chart
                wrapper={false}
                type="BAR"
                override={componentCostWaterfallData}
                height={400}
                showLabel={showCostLabel}
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
                  mode="multiple"
                  value={selectedCostScenarioSegments}
                  onChange={handleCostSelectorChange}
                  options={scenarioSegmentOptions.map((opt) => ({
                    ...opt,
                    disabled:
                      selectedCostScenarioSegments.length >=
                        MAX_SCENARIO_SEGMENT &&
                      !selectedCostScenarioSegments.includes(opt.value),
                  }))}
                  maxTagCount="responsive"
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
                showLabel={showTableLabel}
                setShowLabel={setShowTableLabel}
                exportElementRef={tableCardRef}
                exportFilename="Segment Cost Breakdown"
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
                The graph on the right shows the social impact of your scenarios
                in relation to their cost. Impact is calculated as the increase
                in income (%) divided by the cost of the scenario. In simple
                terms, it shows by how much incomes improve for every unit of
                currency invested.
                <br />
                <br />
                It helps you assess the scale of impact, cost efficiency, and
                which segments benefit most from the interventions.
              </div>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Select
                  {...selectProps}
                  value={selectedRoiScenarioSegments}
                  onChange={handleRoiSelectorChange}
                  options={scenarioSegmentOptions.map((opt) => ({
                    ...opt,
                    disabled:
                      selectedRoiScenarioSegments.length >=
                        MAX_SCENARIO_SEGMENT &&
                      !selectedRoiScenarioSegments.includes(opt.value),
                  }))}
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Select Scenarios and Segments to compare"
                />
              </Space>
            </Space>
          </Col>
          <Col span={14}>
            <VisualCardWrapper
              title="Return on Investment (%)"
              bordered
              showLabel={showRoiLabel}
              setShowLabel={setShowRoiLabel}
              exportElementRef={roiCardRef}
              exportFilename="Return on Investment (%)"
            >
              <Chart
                wrapper={false}
                type="BAR"
                override={roiChartOptions}
                height={350}
                showLabel={showRoiLabel}
              />
            </VisualCardWrapper>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default ImpactOfInvestmentCharts;
