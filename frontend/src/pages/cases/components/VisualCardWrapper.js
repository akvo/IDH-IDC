import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, Space, Button } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { SegmentSelector, IncomeDriversDropdown } from "../components";
import { CaseVisualState } from "../store";

const VisualCardWrapper = ({
  children,
  title,
  bordered = false,
  showSegmentSelector = false,
  showIncomeDriversDropdown = false,
}) => {
  const dashboardData = CaseVisualState.useState((s) => s.dashboardData);

  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const selectedSegmentData = useMemo(() => {
    if (!selectedSegment || !dashboardData.length) {
      return null;
    }
    return dashboardData.find((d) => d.id === selectedSegment);
  }, [dashboardData, selectedSegment]);

  return (
    <Card
      className={`visual-card-wrapper ${bordered ? "bordered" : ""}`}
      title={
        <Row align="middle" gutter={[8, 8]}>
          <Col span={18}>
            <Space align="center">
              <div className="title">{title}</div>
              <div>
                <InfoCircleOutlined />
              </div>
            </Space>
          </Col>
          <Col span={6} align="end">
            <Button size="small" className="button-export">
              Export
            </Button>
          </Col>
        </Row>
      }
    >
      <Row gutter={[20, 20]}>
        {showSegmentSelector && (
          <Col span={24}>
            <SegmentSelector
              selectedSegment={selectedSegment}
              setSelectedSegment={setSelectedSegment}
            />
          </Col>
        )}
        {showIncomeDriversDropdown && (
          <Col span={24}>
            <IncomeDriversDropdown selectedSegmentData={selectedSegmentData} />
          </Col>
        )}
        <Col span={24}>{children}</Col>
      </Row>
    </Card>
  );
};

export default VisualCardWrapper;
