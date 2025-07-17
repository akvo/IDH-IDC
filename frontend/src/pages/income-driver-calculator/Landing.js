import React from "react";
import "./landing.scss";
import { Row, Col, Card, Image } from "antd";
import {
  LandingInfoHelpIcon,
  LandingInfoEstimateIcon,
  LandingInfoDriversIcon,
} from "../../lib/icon";
import LivingIncomeRoadmap from "../../assets/images/living-income-roadmap.png";
import {
  Jumbotron,
  GetStarted,
  ExploreStudies,
  FooterDisclaimer,
  FrameworkDrivers,
} from "./components";
import { OtherToolResourceList } from "../../components/utils";

const InformationCard = () => (
  <Row
    data-testid="info-card-wrapper"
    justify="space-evenly"
    align="center"
    className="info-card-row"
    gutter={24}
  >
    <Col sm={24} md={8} align="top">
      <Card className="info-card-wrapper info-first">
        <div className="info-card-icon">
          <LandingInfoHelpIcon />
        </div>
        <h3>Estimate farmer income</h3>
        <p>
          Calculate actual household income and estimate feasible changes
          through available data on the five key income drivers.
        </p>
      </Card>
    </Col>
    <Col sm={24} md={8} align="top">
      <Card className="info-card-wrapper info-second">
        <div className="info-card-icon">
          <LandingInfoEstimateIcon />
        </div>
        <h3>Assess the income gap</h3>
        <p>
          Compare household income to a Living Income benchmark and/or a custom
          target to assess income gap.
        </p>
      </Card>
    </Col>
    <Col sm={24} md={8} align="top">
      <Card className="info-card-wrapper info-third">
        <div className="info-card-icon">
          <LandingInfoDriversIcon />
        </div>
        <h3>Bridge the income gap</h3>
        <p>
          Model scenarios and visualize the effectiveness of different
          interventions in closing the income gaps.
        </p>
      </Card>
    </Col>
  </Row>
);

const IncomeDriverFramework = () => (
  <Row
    data-testid="income-driver-framework-wrapper"
    justify="center"
    className="income-driver-framework-wrapper"
  >
    <Col span={24} className="income-driver-framework-text-wrapper">
      <h2>Living Income Roadmap to Guide Action</h2>
      <p>
        IDH’s Living Income Roadmap helps companies and their supply chain
        stakeholders take ambitions and aligned actions in their journeys to
        close living income gaps for smallholder farming communities.
      </p>
    </Col>
    <Col span={24} align="center">
      <Image src={LivingIncomeRoadmap} preview={false} width={800} />
    </Col>
  </Row>
);

const OtherToolsAndResources = () => {
  return (
    <div className="other-tools-recources-container">
      <h2>Other tools & resources</h2>
      <OtherToolResourceList
        size={3}
        showMoreButton={true}
        isLandingPage={true}
      />
    </div>
  );
};

const Landing = ({ signOut }) => {
  return (
    <div className="landing-container" id="landing">
      <Jumbotron signOut={signOut} />
      <InformationCard />
      <IncomeDriverFramework />
      <FrameworkDrivers />
      <GetStarted />
      <ExploreStudies />
      <OtherToolsAndResources />
      <FooterDisclaimer />
    </div>
  );
};

export default Landing;
