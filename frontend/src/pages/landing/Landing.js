import React from "react";
import "./landing.scss";
import { Row, Col, Card, Image } from "antd";
import { Link } from "react-router-dom";
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

const InformationCard = () => (
  <Row
    data-testid="info-card-wrapper"
    justify="space-evenly"
    align="center"
    className="info-card-row"
  >
    <Col sm={24} md={7} align="top">
      <Card className="info-card-wrapper info-first">
        <div className="info-card-icon">
          <LandingInfoHelpIcon />
        </div>
        <h3>Estimate Farmer Income</h3>
        <p>
          Calculates actual household income and feasible changes in income by
          using input data on the 5 key drivers of household income.
        </p>
      </Card>
    </Col>
    <Col sm={24} md={7} align="top">
      <Card className="info-card-wrapper info-second">
        <div className="info-card-icon">
          <LandingInfoEstimateIcon />
        </div>
        <h3>Assess income gap</h3>
        <p>
          Compares household income to a Living Income benchmark and/or a custom
          target to assess income gap.
        </p>
      </Card>
    </Col>
    <Col sm={24} md={7} align="top">
      <Card className="info-card-wrapper info-third">
        <div className="info-card-icon">
          <LandingInfoDriversIcon />
        </div>
        <h3>Bridge the income gap</h3>
        <p>
          Modelling scenarios to understand the effectiveness of different
          income drivers in closing gaps.
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
    <Col span={14}>
      <Image src={LivingIncomeRoadmap} preview={false} width="100%" />
    </Col>
    <Col span={10} className="income-driver-framework-text-wrapper">
      <h2 data-testid="income-driver-framework-left-text">
        IDH Living Income Roadmap and Toolkit
      </h2>
      <p data-testid="income-driver-framework-right-text">
        IDH is the convener of the Living Income Roadmap. It helps companies,
        along with other stakeholders, take ambitious, aligned actions in their
        journeys to close living income gaps for small-holder farming
        communities. The roadmap provides a logical framework with useful
        resources to help guide a company’s journey to close living income gaps
        in their supply chain. This framework includes 5 essential steps,
        ‘smart-mix’ of strategies and a data-driven toolkit. These approaches
        highlight the need to use comparable data, engaging in multistakeholder
        partnerships to take effective action.
        <br />
        <br />
        The ‘Income Driver Framework’ is at the heart of IDH’s data-driven
        approach on data and tools. IDH’s tools and approaches and tools have
        been found to be equally useful and effective in interventions without a
        Living Income commitment yet.
      </p>
      <br />
      <Link
        data-testid="button-learn-more-2"
        className="button button-secondary"
        to="https://www.idhsustainabletrade.com/roadmap-on-living-income/"
        target="_blank"
        rel="norefferer"
      >
        Learn More
      </Link>
    </Col>
  </Row>
);

const Landing = ({ signOut }) => {
  return (
    <div className="landing-container" id="landing">
      <Jumbotron signOut={signOut} />
      <InformationCard />
      <IncomeDriverFramework />
      <FrameworkDrivers />
      <GetStarted />
      <ExploreStudies />
      <FooterDisclaimer />
    </div>
  );
};

export default Landing;
