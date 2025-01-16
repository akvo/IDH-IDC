import React, { useMemo } from "react";
import { Card, Row, Col, Space } from "antd";
import { CaseUIState, CurrentCaseState } from "../store";
import { thousandFormatter } from "../../../components/chart/options/common";

const EnterIncomeDataVisual = () => {
  const { activeSegmentId } = CaseUIState.useState((s) => s.general);
  const currentCase = CurrentCaseState.useState((s) => s);

  const currentSegment = useMemo(
    () =>
      currentCase.segments.find((segment) => segment.id === activeSegmentId) ||
      null,
    [currentCase.segments, activeSegmentId]
  );

  if (!currentSegment) {
    return <div>Failed to load current segment data</div>;
  }

  return (
    <Row gutter={[20, 20]} className="income-data-visual-container">
      <Col span={24}>
        <Card className="income-target-wrapper">
          <Space direction="vertical">
            <div className="label">Living income benchmark for a household</div>
            <Space align="center">
              <div className="value">
                {thousandFormatter(currentSegment.target, 2)}
              </div>
              <div className="label"> / year</div>
            </Space>
          </Space>
        </Card>
      </Col>
      <Col span={24}>
        <Card>Household Income Bar Chart</Card>
      </Col>
      <Col span={24}>
        <Card>Household Income Table</Card>
      </Col>
    </Row>
  );
};

export default EnterIncomeDataVisual;
