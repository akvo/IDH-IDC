import React from "react";
import { List, Card, Button, Space, Divider } from "antd";
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
import SustainableProcurementImage from "../../assets/images/procurement-library/sustainable-procurement.png";

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
              The procurement library is a valuable resource designed for
              guiding stakeholders who are looking to incorporate sustainability
              into procurement strategies. By providing a comprehensive list of
              sustainable procurement practices, the library guides users to
              make informed decisions that align with their sustainability
              goals.
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
      {/* Why Sustainable Procurement? */}
      <div className="pl-section-container pl-section-first-row">
        <div className="sustainable-procurement-content">
          <h2>Why Sustainable Procurement?</h2>
          <div className="sustainable-description-wrapper">
            {/* LEFT */}
            <div className="sustainable-description-left">
              <p>
                As businesses face rising costs, tighter regulation and supply
                chain uncertainty - alongside customer demands for transparency
                and lower prices - the need for smarter, more sustainable
                purchasing decisions is stronger than ever.
              </p>
              <p>
                Procurement teams are uniquely placed to take a full value chain
                view of risk, and - working hand-in-hand with sustainability
                colleagues - are fundamental to driving sustainable growth and
                long-term value for people and planet.
              </p>
              <p>
                At its core, procurement exists to align with business strategy,
                manage costs, secure supply and navigate risks that are becoming
                increasingly unpredictable and visible. But procurement
                strategies are only as robust as the business strategies behind
                them.
              </p>
            </div>
            {/* RIGHT */}
            <div className="sustainable-description-right">
              <p>
                If a company prioritises buying cheaply above all else -
                ignoring human rights and environmental impacts - it inevitably
                heightens value chain risk, from supply disruption and
                reputational damage to customer delisting.
              </p>
              <p>
                The good news is that procurement holds the key to mitigating
                these risks. Through their commercial relationships and
                influence with suppliers, teams can embed sustainable practices
                - such as supplier capacity building - that ripple positively up
                the value chain, creating shared value by shouldering risks
                together.
              </p>
              <p>
                Not every team is there yet. Embracing sustainability means
                moving beyond a transactional approach towards deeper, more
                strategic supplier partnerships. That mindset shift - towards
                maturity, collaboration and long-term thinking - is what helps
                unlock the real opportunities of sustainable procurement.
              </p>
            </div>
          </div>
          <div className="sustainable-procurement-image">
            <img
              src={SustainableProcurementImage}
              alt="sustainable-procurement-images"
            />
          </div>
        </div>
        <Divider />
      </div>
      {/* EOL Why Sustainable Procurement? */}
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
      <OtherToolsAndResources
        toolsOrderForLandingPage={["IDC", "IMG", "CII"]}
      />
      <FooterDisclaimer disclaimerText="procurement" />
    </div>
  );
};

export default ProcurementLibrary;
