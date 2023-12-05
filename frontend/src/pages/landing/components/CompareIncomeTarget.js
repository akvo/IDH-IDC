import React from "react";
import "./landingcomp.scss";
import { Row, Col, Card } from "antd";

const CompareIncomeTarget = () => (
  <Row
    id="compare-income-target"
    data-testid="compare-income-target-wrapper"
    justify="center"
  >
    <Col span={24} align="center">
      <p>Income Target</p>
      <h2>Compare to an income target</h2>
      <p>
        This tool allows you to compare the actual income with an income target.{" "}
        <br />
        Two ways are offered to set this target
      </p>
    </Col>
    <Col span={24}>
      <Row
        justify="space-evenly"
        align="center"
        className="compare-income-target-info-card-wrapper"
      >
        <Col span={8}>
          <Card className="compare-income-target-card info-first">
            <h3>Better Income Target</h3>
            <p>
              If you have a specific income goal in mind, you can set the target
              value yourself. Simply enter your desired income level in this
              option.
            </p>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="compare-income-target-card info-second">
            <h3>Set Your Own Target</h3>
            <p>
              If there is no living income benchmark available, or if you have a
              specific income target in mind, you can set the target value
              yourself. Simply enter your desired income level in this option.
            </p>
          </Card>
        </Col>
      </Row>
    </Col>
  </Row>
);

export default CompareIncomeTarget;
