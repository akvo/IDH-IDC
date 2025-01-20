import React from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";

const ChartBiggestImpactOnIncome = () => {
  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper title="Biggest impact on income" bordered>
            Chart
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              How does income change when an income driver changes to its
              feasible level?
            </div>
            <div className="section-description">
              This graph reveals how each income driver contributes to household
              income. Yellow reflects how much the driver itself changes from
              current to feasible, light green shows the impact on income when
              only this driver is adjusted, green shows the effect when all
              drivers are set to feasible levels, and . Use this to spot the
              most impactful drivers, keeping in mind that their influence
              depends on other drivers.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartBiggestImpactOnIncome;
