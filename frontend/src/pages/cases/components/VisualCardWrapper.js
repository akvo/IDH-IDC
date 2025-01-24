import React from "react";
import { Row, Col, Card, Space, Button, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const VisualCardWrapper = ({
  children,
  title,
  bordered = false,
  tooltipText = null,
  showLabel,
  setShowLabel,
}) => {
  return (
    <Card
      className={`visual-card-wrapper ${bordered ? "bordered" : ""}`}
      title={
        <Row align="middle" gutter={[8, 8]} wrap>
          <Col span={16}>
            <Space align="center">
              <div className="title">{title}</div>
              <Tooltip className="info-tooltip" title={tooltipText}>
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Col>
          <Col span={8} align="end">
            {setShowLabel ? (
              <Button
                size="small"
                className="button-export"
                onClick={() => setShowLabel((prev) => !prev)}
              >
                {showLabel ? "Hide" : "Show"} label
              </Button>
            ) : (
              ""
            )}
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
