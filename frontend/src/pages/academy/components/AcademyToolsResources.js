import React from "react";
import { Row, Col, Card, Button, Tag } from "antd";
import { Link, useNavigate } from "react-router-dom";
import ArrowRight from "../../../assets/icons/academy/arrow-right.svg";
import IncomeMeasurementImg from "../../../assets/images/home/income-measurement-img.png";
import CIIImg from "../../../assets/images/home/cii-img.png";
import PLImg from "../../../assets/images/home/procurement-lib-img.png";

const toolsData = [
  {
    id: "income-measurement",
    title: "Income Measurement Guidance Tool",
    description:
      "Supports companies in streamlining their approach to measuring actual household income across multiple commodities and regions, while taking into account available resources and sources of required data (both primary and secondary)",
    image: IncomeMeasurementImg,
    badge: "Tool",
    actionLabel: "Download",
    actionType: "external",
    actionHref: "https://idh.org/resources/income-measurement-guidance",
  },
  {
    id: "cocoa-inventory",
    title: "Cocoa income inventory",
    description:
      "The tool enables exploration of data on cocoa production, cocoa-related income, and other key indicators from different origins through an interactive dashboard",
    image: CIIImg,
    badge: "Tool",
    actionLabel: "Explore the tool",
    actionType: "internal",
    actionHref: "/cocoa-income-inventory",
  },
  {
    id: "procurement-library",
    title: "Procurement library",
    description:
      "The tool supports businesses in identifying best practices aligned with their goals, accessing tailored procurement advice, and exploring a curated library of interventions.",
    image: PLImg,
    badge: "Tool",
    actionLabel: "Explore the tool",
    actionType: "internal",
    actionHref: "/procurement-library",
  },
];

const AcademyToolsResources = () => {
  const navigate = useNavigate();

  return (
    <section
      className="academy-tools-section"
      aria-labelledby="tools-resources-heading"
    >
      <div className="section-container">
        <div className="tools-header-row">
          <div className="tools-header-text">
            <h2 id="tools-resources-heading" className="section-title">
              Tools and resources
            </h2>
            <p className="section-subtitle">
              Find other tools and resources of IDH and its partners below
            </p>
          </div>
          <div className="tools-header-action">
            <Button
              type="primary"
              className="explore-all-btn"
              onClick={() => navigate("/tools-and-resources")}
              aria-label="Explore all Resources"
            >
              <span>Explore all Resources</span>
              <img src={ArrowRight} alt="" className="btn-arrow-icon" />
            </Button>
          </div>
        </div>

        <Row gutter={[24, 24]} className="tools-cards-row">
          {toolsData.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.id}>
              <Card
                className="tool-card-custom"
                cover={
                  <div className="tool-cover-wrapper">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="tool-cover-img"
                    />
                  </div>
                }
              >
                <div className="tool-card-body">
                  <Tag className="tool-badge">{item.badge}</Tag>
                  <h3 className="tool-title">{item.title}</h3>
                  <p className="tool-description">{item.description}</p>
                </div>

                <div className="tool-card-footer">
                  {item.actionType === "external" ? (
                    <a
                      href={item.actionHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tool-action-link"
                    >
                      {item.actionLabel}
                    </a>
                  ) : (
                    <Link to={item.actionHref} className="tool-action-link">
                      {item.actionLabel}
                    </Link>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default AcademyToolsResources;
