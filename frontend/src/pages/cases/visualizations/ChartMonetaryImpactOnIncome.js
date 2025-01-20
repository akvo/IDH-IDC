import React from "react";
import { Card, Col, Row, Space } from "antd";
import { VisualCardWrapper } from "../components";

const ChartMonetaryImpactOnIncome = () => {
  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={16}>
          <VisualCardWrapper
            title="Monetary impact of each driver to income"
            bordered
          >
            Chart
          </VisualCardWrapper>
        </Col>
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              What is the monetary impact of each income driver as we move
              income drivers from their current to feasible levels?
            </div>
            <div className="section-description">
              This waterfall chart visually illustrates how adjustments in
              income drivers influence the transition from the current income
              level to a feasible income level. Each element represents how
              income changes resulting from changing an income driver from its
              current to its feasible level, keeping the other income drivers at
              their current levels. Insights: The graph serves to clarify which
              income drivers have the most significant impact on increasing
              household income levels. The values do not add up to the feasible
              income level because some income drivers are interconnected and in
              this graph we only assess the change in income caused by changing
              one income driver to its feasible levels, while the others remain
              at their current levels.
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ChartMonetaryImpactOnIncome;
