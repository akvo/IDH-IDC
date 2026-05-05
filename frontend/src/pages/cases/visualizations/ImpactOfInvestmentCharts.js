import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Typography,
  Space,
  Table,
  Card,
  Select,
  Tag,
  Empty,
} from "antd";
import { selectProps } from "../../../lib";
import { CaseVisualState, CurrentCaseState, CaseUIState } from "../store";
import { calculateScenarioROI, getLandArea } from "../utils/roiCalculations";
import {
  thousandFormatter,
  formatNumberToString,
} from "../../../components/chart/options/common";
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

const componentColors = {
  Training: "#1B625F", // IDH Dark Green
  "Capacity building": "#F9CB21", // IDH Yellow
  "Input provision": "#FDAE60", // Orange
  Financing: "#70CFAD", // Teal
  Other: "#9CC2C1", // Light Green
};

const extendedPalette = [
  "#2A7A77", // Lighter IDH Green
  "#FFD74D", // Brighter IDH Yellow
  "#8EE4C4", // Lighter IDH Teal
  "#FFBF80", // Lighter IDH Orange
  "#A7C8C7", // Lighter IDH Light Green
  "#0F4A47", // Darker IDH Green
  "#C7A21A", // Darker IDH Yellow
  "#56B996", // Darker IDH Teal
  "#D18E4D", // Darker IDH Orange
  "#7B9F9E", // Darker IDH Light Green
  "#3DA5A0", // Medium IDH Green
  "#EBC01E", // Medium IDH Yellow
];

const getComponentColor = (name, index) => {
  if (componentColors[name]) {
    return componentColors[name];
  }
  // Deterministic fallback for custom "Other" components
  return extendedPalette[index % extendedPalette.length];
};

const ImpactOfInvestmentCharts = () => {
  const scenarioModeling = CaseVisualState.useState((s) => s.scenarioModeling);
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

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

  const [costLegendVisible, setCostLegendVisible] = useState({});

  const handleLegendSelectChanged = (params) => {
    setCostLegendVisible(params.selected);
  };

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
          dashboardData
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
    currentCase.segments,
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

  const scenarioSegmentOptions = useMemo(() => {
    return allScenariosRoiData.flatMap((scenario) => {
      return (currentCase?.segments || []).map((seg) => ({
        label: `${scenario.name} - ${seg.name}`,
        value: `${scenario.key}:::${seg.id}`,
      }));
    });
  }, [allScenariosRoiData, currentCase?.segments]);

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
    const selections =
      selectedCostScenarioSegments.length > 0
        ? selectedCostScenarioSegments
        : scenarioSegmentOptions.map((opt) => opt.value);

    return selections
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
            ? scenario.componentBreakdown
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
    scenarioSegmentOptions,
  ]);

  const componentCostStackedBarData = useMemo(() => {
    if (costRoiData.length === 0) {
      return {};
    }

    // Identify all unique component names across all selected scenarios
    const allCompNamesSet = new Set();
    costRoiData.forEach((d) => {
      const componentNames = Object.keys(d.componentBreakdown || {});
      if (componentNames.length > 0) {
        componentNames.forEach((name) => allCompNamesSet.add(name));
      } else if (d.totalCost > 0) {
        // If no components but has total cost, add a virtual "Total Cost" component
        allCompNamesSet.add("Total Cost");
      }
    });

    const allCompNames = Array.from(allCompNamesSet).sort();

    const categories = costRoiData.map((d) => d.displayName);
    const series = [];

    // 1. Create a series for each component
    allCompNames.forEach((compName, idx) => {
      const data = costRoiData.map((d) => {
        const breakdown = d.componentBreakdown || {};
        // Use component value if it exists
        if (typeof breakdown[compName] !== "undefined") {
          return breakdown[compName];
        }
        // Fallback: If this is the "Total Cost" virtual component and no other components exist
        if (compName === "Total Cost" && Object.keys(breakdown).length === 0) {
          return d.totalCost || 0;
        }
        return 0;
      });
      const color =
        compName === "Total Cost"
          ? "#1B625F"
          : getComponentColor(compName, idx);

      series.push({
        name: compName,
        type: "bar",
        stack: "total",
        barWidth: 35,
        itemStyle: { color: color },
        label: {
          show: showCostLabel,
          position: "inside",
          formatter: (params) =>
            params.value > 0 ? formatNumberToString(params.value) : "",
          color: "#fff",
          fontSize: 10,
          backgroundColor: "rgba(0,0,0,0.3)",
          padding: [3, 6],
          borderRadius: 0,
        },
        data: data,
      });
    });

    // 2. Add a transparent series for the "Total" label at the end of the bar
    series.push({
      name: "Total",
      type: "bar",
      stack: "total",
      itemStyle: { color: "transparent" },
      label: {
        show: showCostLabel,
        position: "right",
        formatter: (params) => {
          const d = costRoiData[params.dataIndex];
          if (!d) {
            return "";
          }

          // Calculate filtered total based on visible legend items
          let filteredTotal = 0;
          Object.entries(d.componentBreakdown || {}).forEach(([name, val]) => {
            // ECharts legend selection: if name is not in object, it's visible.
            // If it is in object, visibility is determined by boolean value.
            const isVisible = costLegendVisible[name] !== false;
            if (isVisible) {
              filteredTotal += val;
            }
          });

          return filteredTotal > 0 ? formatNumberToString(filteredTotal) : "";
        },
        fontWeight: "bold",
        color: "#fff",
        fontSize: 12,
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: [4, 7],
        borderRadius: 0,
      },
      tooltip: { show: false },
      data: new Array(categories.length).fill(0),
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const dataIndex = params[0].dataIndex;
          const d = costRoiData[dataIndex];
          let res = `<div style="font-weight:bold;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px;">${d.displayName}</div>`;

          params.forEach((p) => {
            if (p.value > 0 && p.seriesName !== "Total") {
              res += `<div style="display:flex;justify-content:space-between;gap:24px;">
                <span>${p.marker} ${p.seriesName}</span>
                <span style="font-weight:bold;">${currencyLabel} ${thousandFormatter(
                p.value,
                2
              )}</span>
              </div>`;
            }
          });

          // Calculate filtered total for tooltip
          let filteredTotal = 0;
          Object.entries(d.componentBreakdown || {}).forEach(([name, val]) => {
            const isVisible = costLegendVisible[name] !== false;
            if (isVisible) {
              filteredTotal += val;
            }
          });

          res += `<div style="display:flex;justify-content:space-between;gap:24px;margin-top:8px;border-top:1px solid #eee;padding-top:4px;font-weight:bold;">
            <span>Total Cost</span>
            <span>${currencyLabel} ${thousandFormatter(filteredTotal, 2)}</span>
          </div>`;
          return res;
        },
      },
      legend: {
        show: true,
        top: 0,
        icon: "circle",
        data: allCompNames,
        selected: costLegendVisible,
      },
      grid: {
        left: "3%",
        right: "12%", // Extra space for total labels
        bottom: "10%",
        top: "15%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: currencyLabel,
        splitLine: { show: true, lineStyle: { type: "dashed" } },
        axisLabel: {
          formatter: (value) => formatNumberToString(value),
        },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLabel: {
          interval: 0,
          fontWeight: "bold",
          color: "#555",
        },
      },
      series: series,
    };
  }, [costRoiData, currencyLabel, showCostLabel, costLegendVisible]);

  const roiChartRoiData = useMemo(() => {
    const selections =
      selectedRoiScenarioSegments.length > 0
        ? selectedRoiScenarioSegments
        : scenarioSegmentOptions.map((opt) => opt.value);

    return selections
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
  }, [
    allScenariosRoiData,
    selectedRoiScenarioSegments,
    currentCase?.segments,
    scenarioSegmentOptions,
  ]);

  const roiChartOptions = useMemo(() => {
    // Identify all unique scenarios selected (maintain selection order)
    const uniqueScenarioKeys = Array.from(
      new Set(roiChartRoiData.map((d) => String(d.key)))
    );
    const scenarioNames = uniqueScenarioKeys.map((key) => {
      const found = roiChartRoiData.find((d) => String(d.key) === key);
      return found?.name || "Unknown Scenario";
    });

    const dynamicRoiBarWidth = Math.max(
      15,
      40 - (roiChartRoiData.length - 1) * 5
    );

    // Identify all unique segment IDs selected and sort them by case order
    const uniqueSegmentIds = Array.from(
      new Set(roiChartRoiData.map((d) => String(d.selectedSegmentId)))
    ).sort((a, b) => {
      if (a === "all") {
        return -1;
      }
      if (b === "all") {
        return 1;
      }
      const idxA = (currentCase?.segments || []).findIndex(
        (s) => String(s.id) === a
      );
      const idxB = (currentCase?.segments || []).findIndex(
        (s) => String(s.id) === b
      );
      return idxA - idxB;
    });

    // Build series data (one series per segment)
    const series = uniqueSegmentIds.map((segId) => {
      const globalSegIdx = (currentCase?.segments || []).findIndex(
        (s) => String(s.id) === segId
      );
      // Persistent color index: "all" gets 0, segments get global index + 1
      const colorIdx = segId === "all" ? 0 : globalSegIdx + 1;

      const findSegment = currentCase?.segments?.find(
        (s) => String(s.id) === segId
      );
      const segmentName =
        findSegment?.name || (segId === "all" ? "All Segments" : "Segment");

      const data = uniqueScenarioKeys.map((scKey) => {
        const found = roiChartRoiData.find(
          (d) =>
            String(d.key) === scKey && String(d.selectedSegmentId) === segId
        );
        return found ? parseFloat((found.roi || 0).toFixed(8)) : 0;
      });

      return {
        name: segmentName,
        type: "bar",
        barWidth: dynamicRoiBarWidth,
        emphasis: { focus: "series" },
        itemStyle: { color: scenarioColors[colorIdx % scenarioColors.length] },
        data: data,
        label: {
          show: showRoiLabel,
          position: "top",
          padding: [3, 5],
          backgroundColor: "rgba(0,0,0,0.3)",
          color: "#fff",
          borderRadius: 2,
          formatter: "{c}",
        },
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          let res = `${params[0].name}`;
          params.forEach((p) => {
            if (p.value > 0) {
              res += `<br/>${p.marker} ${p.seriesName}: ${p.value}`;
            }
          });
          return res;
        },
      },
      legend: {
        show: true,
        top: 0,
        icon: "circle",
        data: series.map((s) => s.name),
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
        data: scenarioNames,
      },
      yAxis: {
        type: "value",
        name: "ROI",
        axisLabel: {
          formatter: "{value}",
        },
      },
      series: series,
    };
  }, [roiChartRoiData, showRoiLabel, currentCase?.segments]);

  if (!investmentAnalysis?.is_enabled) {
    return (
      <Card className="card-visual-wrapper" style={{ border: "none" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical">
              <Typography.Text strong style={{ color: "#26605f" }}>
                Investment analysis is currently hidden.
              </Typography.Text>
              <Typography.Text type="secondary">
                To assess the return on investment of your scenarios, please
                select &quot;Yes&quot; for the question{" "}
                <b>
                  &quot;Do you have an estimate of the cost required to
                  implement the scenarios?&quot;
                </b>{" "}
                in the modeling section above.
              </Typography.Text>
            </Space>
          }
        />
      </Card>
    );
  }

  if (allScenariosRoiData.length === 0) {
    return (
      <Card className="card-visual-wrapper" style={{ border: "none" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical">
              <Typography.Text strong style={{ color: "#26605f" }}>
                No investment data found for the current scenarios.
              </Typography.Text>
              <Typography.Text type="secondary">
                Please add investment costs in Step 1 (Scenario Modeling) above
                to see the ROI analysis.
              </Typography.Text>
            </Space>
          }
        />
      </Card>
    );
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
                override={componentCostStackedBarData}
                height={400}
                showLabel={showCostLabel}
                callbacks={{
                  onEvents: {
                    legendselectchanged: handleLegendSelectChanged,
                  },
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
              title="Return on Investment"
              bordered
              showLabel={showRoiLabel}
              setShowLabel={setShowRoiLabel}
              exportElementRef={roiCardRef}
              exportFilename="Return on Investment"
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
