import React from "react";
import { Row, Col } from "antd";
import "./WhatIsNextInfoBox.scss";

const WhatIsNextInfoBox = ({ style = {} }) => {
  return (
    <div className="what-is-next-info-box" style={style}>
      <div className="title">What is next?</div>
      <Row gutter={[32, 16]}>
        <Col xs={24} md={12}>
          <p>
            The IDC helps you understand which income drivers have the greatest
            influence on farmer income and how changes in these drivers could
            contribute to closing the income gap. Earlier in the tool, you
            explored current and feasible values and examined how improvements
            in one driver can affect the others.
          </p>
        </Col>
        <Col xs={24} md={12}>
          <p>
            The features below allow you to bring these insights together. You
            can create different scenarios by combining income drivers and
            compare how each scenario performs. This helps you identify
            realistic and impactful pathways to improve farmer incomes.
          </p>
        </Col>
      </Row>
    </div>
  );
};

export default WhatIsNextInfoBox;
