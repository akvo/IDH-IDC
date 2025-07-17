import React from "react";
import "./welcome.scss";
import { Row, Col } from "antd";
import {
  Jumbotron,
  GetStarted,
  FrameworkDrivers,
  CompareIncomeTarget,
  ExploreStudies,
  FooterDisclaimer,
} from "../income-driver-calculator/components";

const FAQ = () => {
  const showItems = false;
  const items = [
    {
      title: "What is Driver Calculator?",
      description:
        "Please provide comprehensive answers to those questions. You will save lots of time and money by eliminating the necessity to give constant support. You also will keep your clients' time cause they will quickly find the answers to all their questions.",
    },
    {
      title: "How should I find out my cases?",
      description:
        "Please provide comprehensive answers to those questions. You will save lots of time and money.",
    },
    {
      title: "How to get started?",
      description:
        "Please provide comprehensive answers to those questions. You will save lots of time and money by eliminating the necessity to give constant support. You also will keep your clients' time cause they will quickly find the answers to all their questions.",
    },
  ];

  return (
    <div id="faq">
      <h2>Frequently asked questions</h2>
      <Row className="item-wrapper">
        <Col span={12} className="title">
          Coming soon
        </Col>
      </Row>

      {showItems
        ? items.map((it, i) => (
            <Row key={i} className="item-wrapper">
              <Col span={12} className="title">
                {it.title}
              </Col>
              <Col span={12} className="description">
                {it.description}
              </Col>
            </Row>
          ))
        : ""}
    </div>
  );
};

const Welcome = ({ signOut }) => {
  return (
    <div>
      <Jumbotron signOut={signOut} />
      <GetStarted />
      <FrameworkDrivers />
      <CompareIncomeTarget />
      <ExploreStudies signedIn={true} />
      <FAQ />
      <FooterDisclaimer />
    </div>
  );
};

export default Welcome;
