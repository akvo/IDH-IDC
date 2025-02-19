import React, { useState, useMemo } from "react";
import { Row, Col, Card, Button, Modal, Select, Space } from "antd";
import { selectProps } from "../../lib";
import { TableScenarioOutcomes } from "../../pages/cases/visualizations";
import { CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";

const incomeTargetIcon = {
  reached: (
    <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 18 }} />
  ),
  not_reached: (
    <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 18 }} />
  ),
};

const ViewSummaryModal = ({
  setShowSummaryModal,
  showSummaryModal = false,
  selectedCaseData = {},
}) => {
  const [selectedSegment, setSelectedSegment] = useState(null);

  const segmentOptions = useMemo(() => {
    if (!selectedCaseData.has_scenario_data) {
      return [];
    }
    return selectedCaseData.scenario_outcome_data_source?.map((d) => ({
      value: d.segmentId,
      label: d.segmentName,
    }));
  }, [
    selectedCaseData.has_scenario_data,
    selectedCaseData.scenario_outcome_data_source,
  ]);

  const summaryScenarioOutcomeDataSource = useMemo(() => {
    if (!selectedSegment) {
      return [];
    }
    const res =
      selectedCaseData.scenario_outcome_data_source?.find(
        (d) => d.segmentId === selectedSegment
      )?.scenarioOutcome || [];
    return res.map((r) => {
      if (r.id === "income_driver") {
        // render value
        Object.entries(r).map(([key, value]) => {
          if (key !== "title") {
            const splitted = value.split("|");
            const values = (
              <Space direction="vertical">
                {splitted.map((x, xi) => {
                  const [text, percent] = x.split("#");
                  return (
                    <Space key={`${xi}-${x}`}>
                      <div>{text}</div>
                      <div>{percent}</div>
                    </Space>
                  );
                })}
              </Space>
            );
            r = {
              ...r,
              [key]: values,
            };
          }
        });
      }
      if (r.id === "income_target_reached") {
        Object.entries(r).map(([key, value]) => {
          if (key !== "title") {
            let icon = "";
            if (value === "reached") {
              icon = incomeTargetIcon.reached;
            } else {
              icon = incomeTargetIcon.not_reached;
            }
            r = {
              ...r,
              [key]: icon,
            };
          }
        });
      }
      return r;
    });
  }, [selectedSegment, selectedCaseData.scenario_outcome_data_source]);

  return (
    <Modal
      title="View summary"
      open={showSummaryModal}
      onCancel={setShowSummaryModal}
      width="65%"
      className="view-summary-modal-wrapper"
      maskClosable={false}
      footer={false}
    >
      <Row gutter={[20, 20]} align="middle">
        <Col span={24}>
          <Card className="scenario-outcome-form-wrapper">
            <Row gutter={[12, 12]} align="top">
              <Col span={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <label>Segment</label>
                  <Select
                    {...selectProps}
                    placeholder="Select segment"
                    options={segmentOptions}
                    onChange={(val) => setSelectedSegment(val)}
                  />
                </Space>
              </Col>
              <Col span={12} align="end">
                <Button className="button-download">
                  Download scenario outcomes
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={24}>
          <TableScenarioOutcomes
            summaryScenarioOutcomeDataSource={summaryScenarioOutcomeDataSource}
            isSummary={true}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default ViewSummaryModal;
