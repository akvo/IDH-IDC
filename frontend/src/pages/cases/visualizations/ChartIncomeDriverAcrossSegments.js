import React from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";

const ChartIncomeDriverAcrossSegments = () => {
  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper title="Income drivers across segments" bordered>
            Chart
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">Explore your income drivers</div>
            <div className="section-description">
              This graph lets you explore and compare income drivers across
              segments, showing their current values and the gaps to feasible
              levels. It helps you spot differences and identify where progress
              is possible.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeDriverAcrossSegments;
