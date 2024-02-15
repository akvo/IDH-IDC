import React from "react";
import { Row, Col } from "antd";
import "./landingcomp.scss";

const ExploreStudies = ({ signedIn = false }) => {
  return (
    <Row
      id="explore-studies"
      data-testid="explore-studies-wrapper"
      justify="center"
    >
      <Col span={24} align="center">
        <h2 data-testid="explore-studies-title">
          {signedIn
            ? "Explore Studies for Insights"
            : "‘Smart-mix’ of strategies to close income gaps"}
        </h2>
        {signedIn ? (
          <p data-testid="explore-studies-subtitle" style={{ width: "85%" }}>
            To make the data entry process more informed and efficient, we
            recommend visiting the &quot;Explore Studies&quot; section. Here,
            you can see data available from other cases and income measurement
            studies. You can access valuable insights into feasible levels of
            income drivers for your selected country and sector. This can serve
            as a helpful reference point when entering your data.
          </p>
        ) : (
          <p data-testid="explore-studies-subtitle" style={{ width: "85%" }}>
            To deliver results at farm level with multiple income drivers, IDH
            believes that stakeholders need to change their own behavior (e.g.
            business practices), at various levels i.e. at national, landscape,
            and sector levels. This means strategies that can improve income
            drivers go far beyond addressing changes in the farm system and
            household behaviour.
            <br />
            <br />
            Each of these strategies should influence an improvement in one or
            multiple income drivers, or the underlying conditions that enable an
            improvement in income drivers. As you iterate feasible values and
            the impact it has on income, the more you might have to explore to
            identify appropriate strategies.
          </p>
        )}
        <div
          data-testid="map"
          className={`map-container ${signedIn ? "signed-in" : "public"}`}
        ></div>
      </Col>
    </Row>
  );
};

export default ExploreStudies;
