import React, { useMemo } from "react";
import { Card, Row, Col } from "antd";
import { renderPercentageTag } from "../../../lib";

const EnterIncomeDataForm = ({ driverIndex, driver }) => {
  const cardTitle = useMemo(() => {
    if (driverIndex === 0) {
      return `${driver.groupName} (${driver.questionGroups[0].commodity_name})`;
    }
    return driver.groupName;
  }, [driver.groupName, driver.questionGroups, driverIndex]);

  return (
    <Card
      title={
        <Row align="middle" gutter={[8, 8]}>
          <Col span={14}>{cardTitle}</Col>
          <Col span={4}>123.00</Col>
          <Col span={4}>457.00</Col>
          <Col span={2} className="percentage-tag-wrapper">
            {renderPercentageTag("default", 0)}
          </Col>
        </Row>
      }
    >
      {/* TODO:: render questions} */}
      EnterIncomeDataForm Driver Questions
    </Card>
  );
};

export default EnterIncomeDataForm;
