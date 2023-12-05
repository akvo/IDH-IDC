import React from "react";
import { Row, Col } from "antd";
import "./landingcomp.scss";

const ExploreStudies = () => {
  return (
    <Row
      id="explore-studies"
      data-testid="explore-studies-wrapper"
      justify="center"
    >
      <Col span={24} align="center">
        <h2 data-testid="explore-studies-title">
          Explore Studies for Insights
        </h2>
        <p data-testid="explore-studies-subtitle">
          To make the data entry process more informed and efficient, we
          recommend visiting the &quot;Explore Studies&quot; section. Here, you
          can see data available from other cases and income measurement
          studies. You can access valuable insights into feasible levels of
          income drivers for your selected country and sector. This can serve as
          a helpful reference point when entering your data.
        </p>
        <div data-testid="map" className="map-container"></div>
      </Col>
    </Row>
  );
};

export default ExploreStudies;
