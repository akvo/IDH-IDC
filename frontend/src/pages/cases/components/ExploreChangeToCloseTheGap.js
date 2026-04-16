import React, { useState, useRef, useMemo } from "react";
import {
  Card,
  Collapse,
  Tooltip,
  Space,
  Button,
  Row,
  Col,
  Typography,
} from "antd";
import {
  InfoCircleOutlined,
  DownloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { toPng } from "html-to-image";
import {
  SegmentSelector,
  SingleDriverChange,
  TwoDriverHeatmap,
  AdjustIncomeTarget,
  ThreeDriverCalculator,
} from "../components";
import { CurrentCaseState, CaseVisualState } from "../store";

import "./ExploreChangeToCloseTheGap.scss";

const { Panel } = Collapse;
const { Title } = Typography;

const ExploreChangeToCloseTheGap = ({ disabled }) => {
  const currentCase = CurrentCaseState.useState((s) => s);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const heatmapRef = useRef(null);
  const exportRef = useRef(null);

  const activeSegmentName = useMemo(() => {
    return (
      currentCase?.segments?.find((s) => s.id === selectedSegment)?.name ||
      "All Segments"
    );
  }, [currentCase?.segments, selectedSegment]);

  const { sensitivityAnalysis } = CaseVisualState.useState((s) => s);

  const gapClosurePercentage = useMemo(() => {
    const val =
      sensitivityAnalysis?.config?.[
        `${selectedSegment}_closing-gap-percentage_adjusted-target`
      ];
    return val !== undefined ? val : 0;
  }, [sensitivityAnalysis?.config, selectedSegment]);

  const handleDownload = () => {
    if (!exportRef.current) {
      return;
    }

    setIsExporting(true);

    // Apply temporary padding for the export capture
    exportRef.current.style.padding = "20px";

    // Add a small delay to ensure charts are fully rendered before capture
    setTimeout(() => {
      toPng(exportRef.current, {
        filter: (node) => {
          const exclusionClasses = [
            "download-btn-header",
            "header-action-btn",
            "ant-btn",
            "ant-select",
            "info-tooltip",
          ];
          return !exclusionClasses.some(
            (classname) =>
              node.classList?.contains(classname) ||
              node.closest?.(`.${classname}`)
          );
        },
        cacheBust: false,
        backgroundColor: "#fff",
        style: {
          padding: 32,
          width: "100%",
        },
      })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = `Explore changes to close the gap - ${activeSegmentName}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error("Error while downloading content", err);
        })
        .finally(() => {
          // Reset padding and status
          if (exportRef.current) {
            exportRef.current.style.padding = "0px";
          }
          setTimeout(() => {
            setIsExporting(false);
          }, 100);
        });
    }, 500);
  };

  const handleClearHeatmap = (e) => {
    e.stopPropagation();
    if (heatmapRef.current) {
      heatmapRef.current.handleOnClear();
    }
  };

  return (
    <div className="explore-grouped-tools-container" ref={exportRef}>
      <Card className="card-content-wrapper explore-grouped-tools-card">
        {/* Unified Selection Block from Image */}
        <div className="unified-selection-block">
          <Row gutter={[48, 24]} align="bottom">
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Segment Selection */}
                <div className="segment-selection-area">
                  <div className="selection-label-small">
                    Select the segment for which you want to explore.
                  </div>
                  <SegmentSelector
                    selectedSegment={selectedSegment}
                    setSelectedSegment={setSelectedSegment}
                    disabled={disabled}
                  />
                </div>

                {/* Goal Selection Title and Instructions */}
                <div className="goal-selection-area">
                  <Title level={4} className="goal-selection-title">
                    Select the Goal:
                  </Title>
                  <p className="goal-instruction-text">
                    Closing the income gap may not be fully achievable within
                    your feasible levels. Choose the percentage of the gap you
                    would like to close and test different scenarios. The newly
                    chosen target will be applied to all the calculations within
                    the explore section.
                  </p>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <div className="right-adjustment-column">
                <AdjustIncomeTarget
                  selectedSegment={selectedSegment}
                  inlineView={true}
                  onlyClosingGap={true}
                  disabled={disabled}
                />
              </div>
            </Col>
          </Row>

          {/* Download Button (Positioned top-right of block if needed, or kept here) */}
          <Button
            className="download-btn-header"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            type="text"
            loading={isExporting}
          >
            Download
          </Button>
        </div>

        <Collapse
          defaultActiveKey={["1", "2", "3"]}
          expandIconPosition="start"
          expandIcon={({ isActive }) => (
            <RightOutlined
              rotate={isActive ? 90 : 0}
              style={{ fontSize: "14px", color: "#1B625F" }}
            />
          )}
          className="explore-tools-collapse"
          ghost
        >
          <Panel
            header={
              <Space align="center">
                <span>Single driver change</span>
                <Tooltip title="See how individual drivers impact the income gap.">
                  <InfoCircleOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
                </Tooltip>
              </Space>
            }
            key="1"
          >
            <div className="modelling-goal-reminder">
              Modelling for {gapClosurePercentage}% gap closure (as set above)
            </div>
            <SingleDriverChange
              selectedSegment={selectedSegment}
              hideCard={true}
            />
          </Panel>
          <Panel
            header={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Space align="center">
                  <span>Two driver heatmap</span>
                  <Tooltip title="Understand the combined impact of two drivers.">
                    <InfoCircleOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
                  </Tooltip>
                </Space>
                <Button
                  className="button-ghost header-action-btn"
                  onClick={handleClearHeatmap}
                  size="small"
                >
                  Clear
                </Button>
              </div>
            }
            key="2"
          >
            <div className="modelling-goal-reminder">
              Modelling for {gapClosurePercentage}% gap closure (as set above)
            </div>
            <TwoDriverHeatmap
              ref={heatmapRef}
              selectedSegment={selectedSegment}
              hideCard={true}
            />
          </Panel>
          <Panel
            header={
              <Space align="center">
                <span>Three driver calculator</span>
                <Tooltip title="Calculate outcomes across multiple driver scenarios.">
                  <InfoCircleOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
                </Tooltip>
              </Space>
            }
            key="3"
          >
            <div className="modelling-goal-reminder">
              Modelling for {gapClosurePercentage}% gap closure (as set above)
            </div>
            <ThreeDriverCalculator
              selectedSegment={selectedSegment}
              disabled={disabled}
              hideCard={true}
            />
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default ExploreChangeToCloseTheGap;
