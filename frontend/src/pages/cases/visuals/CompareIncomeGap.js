import React from "react";
import { Card, Col, Row, Space, Table } from "antd";

const CompareIncomeGap = () => {
  return (
    <Card className="card-visual-wrapper">
      <Row gutter={[20, 20]} align="middle">
        <Col span={8}>
          <Space direction="vertical">
            <div className="section-title">
              Compare the income gap per segment with the number of farmers each
              segment represents.
            </div>
            <div className="section-description">
              This table gives an overview of the number of farmers in each
              segment, and the income gap at current and feasible levels. Use it
              to determine focus segments.
            </div>
          </Space>
        </Col>
        <Col span={16}>
          <Table columns={[]} dataSource={[]} />
        </Col>
      </Row>
    </Card>
  );
};

export default CompareIncomeGap;
