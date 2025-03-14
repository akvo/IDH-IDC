import React from "react";
import { List, Card, Button, Space } from "antd";
import "./procurement-library.scss";
import {
  ArrowRight,
  BookInfoIcon,
  BookSearchIcon,
  HandshakeIcon,
  OvalIcon,
} from "../../lib/icon";
import { Link } from "react-router-dom";
import FooterDisclaimer from "../landing/components/FooterDisclaimer";
// import CaseStudies from "./components/CaseStudies";

const ProcurementLibrary = () => {
  const cards = [
    {
      title: "Find good Procurement Practices",
      url: "/procurement-library/assessment",
      cta: "Do the assessment",
      icon: <HandshakeIcon />,
    },
    {
      title: "Explore the Intervention Library",
      url: "/procurement-library/intervention-library",
      cta: "Explore",
      icon: <BookSearchIcon />,
    },
    {
      title: "Learn more about our methodology",
      url: "/procurement-library/methodology",
      cta: "Explore",
      icon: <BookInfoIcon />,
    },
  ];
  return (
    <div className="procurement-library-container">
      <div className="jumbotron">
        <div className="jumbotron-content">
          <div className="jumbotron-text">
            <h1>
              What is the
              <br />
              Procurement Library?
            </h1>
            <p>
              The procurement library is a tool designed to help businesses
              across the entire supply chain identify the most impactful and
              relevant interventions for their goals. You can provide additional
              information about your business for personalized procurement
              advice, browse all practices in the intervention library, or
              explore our methodology.
            </p>
          </div>

          <div className="jumbotron-cards">
            <List
              grid={{
                gutter: 24,
                xs: 1,
                sm: 1,
                md: 1,
                lg: 3,
                xl: 3,
                xxl: 3,
              }}
              dataSource={cards}
              renderItem={(item, ix) => (
                <List.Item>
                  <Card>
                    <div className="card-content">
                      <div className="card-icon">
                        <span className={`icon-front front-${ix}`}>
                          {item.icon}
                        </span>
                        <span className="icon-back">
                          <OvalIcon />
                        </span>
                      </div>
                      <div className="card-title">
                        <h3>{item.title}</h3>
                      </div>
                      <div className="card-cta">
                        <Link to={item.url}>
                          <Button type="primary">
                            <Space align="center" justify="center">
                              <span>{item.cta}</span>
                              <ArrowRight />
                            </Space>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
      <div className="case-studies-container">{/* <CaseStudies /> */}</div>
      <FooterDisclaimer />
    </div>
  );
};

export default ProcurementLibrary;
