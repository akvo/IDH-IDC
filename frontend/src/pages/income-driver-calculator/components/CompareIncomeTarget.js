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
      {/* <p>Income Target</p> */}
      <h2>Choosing your Income Target</h2>
      <p>
        In the IDC, you can choose the Income Target to compare your actual
        household income.
        <br />
        So do not worry if a Living Income benchmark is not available for your
        specific case.
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
            <h3>Living Income Target</h3>
            <p>
              The IDC has the data base for all the publicly available and
              credible Living Income benchmarks. All you need to do is choose a
              country and adjust the family size to obtain a Living Income
              target.
            </p>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="compare-income-target-card info-second">
            <h3>Set Your Own Target</h3>
            <p>
              If there is no living income benchmark available, or if you have a
              specific income target in mind, you can set the target value
              yourself. Simply enter your desired income level target.
            </p>
          </Card>
        </Col>
      </Row>
    </Col>
  </Row>
);

export default CompareIncomeTarget;
