import React, { useState } from "react";
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
import {
  SegmentSelector,
  SingleDriverChange,
  TwoDriverHeatmap,
  AdjustIncomeTarget,
  ThreeDriverCalculator,
} from "../components";

import "./ExploreChangeToCloseTheGap.scss";

const { Panel } = Collapse;
const { Title } = Typography;

const ExploreChangeToCloseTheGap = ({ disabled }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);

  const handleDownload = () => {
    console.info("Download clicked - Placeholder for export functionality");
  };

  return (
    <div className="explore-grouped-tools-container">
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
            <SingleDriverChange
              selectedSegment={selectedSegment}
              hideCard={true}
            />
          </Panel>
          <Panel
            header={
              <Space align="center">
                <span>Two driver heatmap</span>
                <Tooltip title="Understand the combined impact of two drivers.">
                  <InfoCircleOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
                </Tooltip>
              </Space>
            }
            key="2"
          >
            <TwoDriverHeatmap
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
