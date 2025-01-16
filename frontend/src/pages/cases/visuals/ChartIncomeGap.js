import React from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";

const ChartIncomeGap = () => {
  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper title="Income gap" bordered>
            Chart
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              What is the current income of the farmers and their income gap?
            </div>
            <div className="section-description">
              This graph helps you explore the composition of household income
              and identify the gap between current income and the income target.
              Use it to uncover variations across segments and consider where
              tailored strategies might be needed.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartIncomeGap;
