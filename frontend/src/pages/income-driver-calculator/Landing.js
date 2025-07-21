import React from "react";
import "./landing.scss";
import { Row, Col, Card, Image } from "antd";
import {
  LandingInfoHelpIcon,
  LandingInfoEstimateIcon,
  LandingInfoDriversIcon,
} from "../../lib/icon";
import {
  Jumbotron,
  GetStarted,
  FooterDisclaimer,
  FrameworkDrivers,
} from "./components";
import { OtherToolResourceList } from "../../components/utils";
import Benefit1 from "../../assets/icons/idc/benefit-1.svg";
import Benefit2 from "../../assets/icons/idc/benefit-2.svg";
import Benefit3 from "../../assets/icons/idc/benefit-3.svg";
import Benefit4 from "../../assets/icons/idc/benefit-4.svg";

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
          Calculate actual household income and estimate potential changes using
          available data on the five key income drivers.
        </p>
      </Card>
    </Col>
    <Col sm={24} md={8} align="top">
      <Card className="info-card-wrapper info-second">
        <div className="info-card-icon">
          <LandingInfoEstimateIcon />
        </div>
        <h3>Assess income gap</h3>
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
          Model scenarios and visualise the effectiveness of different
          interventions in closing the income gaps.
        </p>
      </Card>
    </Col>
  </Row>
);

const IDCBenefits = () => {
  const benefitItems = [
    {
      icon: Benefit1,
      label: "Simple and intuitive user steps",
    },
    {
      icon: Benefit2,
      label: "Customisable by farmer segment, crop and context",
    },
    {
      icon: Benefit3,
      label: "Model and compare interventions and their impact",
    },
    {
      icon: Benefit4,
      label: "Data visualisation to enhance communication and reporting",
    },
  ];

  return (
    <Row justify="center" className="benefit-wrapper">
      <Col span={24} className="benefit-text-wrapper">
        <h2>Benefits of using the Income Driver Calculator</h2>
      </Col>
      <Col span={24} align="center" className="benefit-content-wrapper">
        <Row gutter={[20, 20]} align="top" justify="space-evenly">
          {benefitItems.map((item, bidx) => (
            <Col key={`benefit-${bidx}`} span={6}>
              <Image src={item.icon} preview={false} />
              <h4>{item.label}</h4>
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  );
};

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
      <IDCBenefits />
      <GetStarted />
      <FrameworkDrivers />
      <OtherToolsAndResources />
      <FooterDisclaimer disclaimerText="idc" />
    </div>
  );
};

export default Landing;
