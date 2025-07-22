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
import FooterDisclaimer from "../income-driver-calculator/components/FooterDisclaimer";
import { PROCUREMENT_KEY_FEATURES } from "./config";
import { useWindowDimensions } from "../../hooks";
import { OtherToolsAndResources } from "../../components/utils";

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
    title: "Learn more about the context and methodology",
    url: "/procurement-library/methodology",
    cta: "Explore",
    icon: <BookInfoIcon />,
  },
];

const ProcurementLibrary = () => {
  const { isMobile } = useWindowDimensions();

  return (
    <div
      className={`procurement-library-container ${
        isMobile ? "mobile-screen" : ""
      }`}
    >
      <div className="jumbotron">
        <div className="jumbotron-content">
          <div className="jumbotron-text">
            <h1>
              Welcome to the
              <br />
              Procurement Library
            </h1>
            <span className="caption">
              The procurement library guides stakeholders in integrating
              sustainability into their procurement strategies. By offering a
              comprehensive list of sustainable procurement practices, the
              library supports users make informed decisions aligned with their
              sustainability goals.
            </span>
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
                      <div>
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
      <div className="key-features-container">
        <div className="key-features-content">
          <h2>Key features include:</h2>
          <div className="key-features">
            {PROCUREMENT_KEY_FEATURES.map((feature) => (
              <div key={feature.id} className="key-feature">
                <div className="key-icon">
                  <span className="key-icon-front">{feature.icon}</span>
                  <span className="key-icon-back">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M23.9178 47.7421C14.4554 49.1221 4.56517 44.982 1.3887 34.5145C-2.2713 22.6708 1.25852 7.2523 12.5101 1.86978C26.3095 -4.46128 45.1116 6.02849 47.8231 22.15C49.735 36.7166 35.7756 46.5703 23.9215 47.7383"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </div>
                <h3>{feature.title}</h3>
                <span className="key-feature-description">
                  {feature.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <OtherToolsAndResources />

      <FooterDisclaimer disclaimerText="procurement" />
    </div>
  );
};

export default ProcurementLibrary;
