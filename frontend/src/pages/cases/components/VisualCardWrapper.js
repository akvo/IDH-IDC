import React from "react";
import { Row, Col, Card, Space, Button } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const VisualCardWrapper = ({ children, title }) => {
  return (
    <Card
      className="visual-card-wrapper"
      title={
        <Row align="middle" gutter={[8, 8]}>
          <Col span={19}>
            <Space align="center">
              <div className="title">{title}</div>
              <div>
                <InfoCircleOutlined />
              </div>
            </Space>
          </Col>
          <Col span={5} align="end">
            <Button size="small" className="button-export">
              Export
            </Button>
          </Col>
        </Row>
      }
    >
      {children}
    </Card>
  );
};

export default VisualCardWrapper;
