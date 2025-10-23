import React, { useState, useMemo } from "react";
import { List, Card, Button, Space, Divider, Collapse } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import "./procurement-library.scss";
import {
  ArrowRight,
  BookInfoIcon,
  BookSearchIcon,
  HandshakeIcon,
  OvalIcon,
} from "../../lib/icon";
import { Link } from "react-router-dom";
import { SOURCING_STRATEGY_CYCLE_TABS } from "./config";
import FooterDisclaimer from "../income-driver-calculator/components/FooterDisclaimer";
import { useWindowDimensions } from "../../hooks";
import { OtherToolsAndResources } from "../../components/utils";
import SustainableProcurementImage from "../../assets/images/procurement-library/sustainable-procurement.png";
import SourcingStrategyCycleImage from "../../assets/images/procurement-library/sourcing-strategy-cycle.png";

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

const SourcingStrategyCycleTabs = ({
  sourcingStrategyCycleTab,
  setSourcingStrategyCycleTab,
}) => {
  return (
    <div className="sscc-tabs-wrapper">
      {SOURCING_STRATEGY_CYCLE_TABS.map((item) => (
        <div
          key={`sscc-tab-${item.key}`}
          className={`sscc-tab sscc-tab-${item.key} ${
            item.key === sourcingStrategyCycleTab ? "active" : ""
          }`}
          onClick={() => setSourcingStrategyCycleTab(item.key)}
        >
          <div>{item.step}</div>
          <div>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

const ProcurementLibrary = () => {
  const { isMobile } = useWindowDimensions();
  const [sourcingStrategyCycleTab, setSourcingStrategyCycleTab] = useState(
    SOURCING_STRATEGY_CYCLE_TABS[0]?.key || 1
  );

  const selectedSourcingStrategyCycleTabContent = useMemo(() => {
    const active = SOURCING_STRATEGY_CYCLE_TABS.find(
      (item) => item.key === sourcingStrategyCycleTab
    );
    return active?.content || null;
  }, [sourcingStrategyCycleTab]);

  return (
    <div
      id="procurement-library"
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
      <div className="pl-section-container pl-section-first-row sustainable-procurement-content">
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
              increasingly unpredictable and visible. But procurement strategies
              are only as robust as the business strategies behind them.
            </p>
          </div>
          {/* RIGHT */}
          <div className="sustainable-description-right">
            <p>
              If a company prioritises buying cheaply above all else - ignoring
              human rights and environmental impacts - it inevitably heightens
              value chain risk, from supply disruption and reputational damage
              to customer delisting.
            </p>
            <p>
              The good news is that procurement holds the key to mitigating
              these risks. Through their commercial relationships and influence
              with suppliers, teams can embed sustainable practices - such as
              supplier capacity building - that ripple positively up the value
              chain, creating shared value by shouldering risks together.
            </p>
            <p>
              Not every team is there yet. Embracing sustainability means moving
              beyond a transactional approach towards deeper, more strategic
              supplier partnerships. That mindset shift - towards maturity,
              collaboration and long-term thinking - is what helps unlock the
              real opportunities of sustainable procurement.
            </p>
          </div>
        </div>
        <div className="sustainable-procurement-image">
          <img
            src={SustainableProcurementImage}
            alt="sustainable-procurement-images"
          />
        </div>
        <Divider />
      </div>
      {/* EOL Why Sustainable Procurement? */}

      {/* Sourcing Strategy Cycle */}
      <div className="pl-section-container sourcing-strategy-cycle-content">
        {/* header */}
        <div className="sscc-header-wrapper">
          <div className="sscc-title-description">
            <h2>Sourcing Strategy Cycle</h2>
            <p>
              At IDH, we support teams at every stage of their sustainable
              procurement journey. We have developed an overview for procurement
              teams on how to think about integrating sustainable practices into
              each step of the four stages of a typical Sourcing Strategy Cycle
              approach - whether a strategy is being created or updated.
            </p>
            <p>
              Explore each stage of the Cycle and the outline opportunities for
              integrating more sustainable practices.
            </p>
          </div>
          <div className="sscc-title-button">
            <Link
              to="/procurement-library/intervention-library"
              className="button button-green-fill"
            >
              Explore Intervention Library{" "}
              <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
            </Link>
          </div>
        </div>
        {/* body */}
        <div className="sscc-body-wrapper">
          <div className="sscc-body-left">
            {/* tabs */}
            <SourcingStrategyCycleTabs
              sourcingStrategyCycleTab={sourcingStrategyCycleTab}
              setSourcingStrategyCycleTab={setSourcingStrategyCycleTab}
            />
            {/* eol tabs */}

            {/* tabs content */}
            {selectedSourcingStrategyCycleTabContent ? (
              <div className="sscc-tabs-content">
                <Space>
                  <img
                    src={selectedSourcingStrategyCycleTabContent.icon}
                    alt="lup-icon.svg"
                    className="icons"
                  />
                  <h3>{selectedSourcingStrategyCycleTabContent.title}</h3>
                </Space>
                <p>{selectedSourcingStrategyCycleTabContent.description}</p>

                <Collapse
                  accordion
                  ghost
                  defaultActiveKey={[1]}
                  expandIconPosition="end"
                  items={selectedSourcingStrategyCycleTabContent.collapseItems}
                />
              </div>
            ) : (
              ""
            )}
            {/* eol tabs content */}
          </div>
          <div className="sscc-body-right">
            <img src={SourcingStrategyCycleImage} className="sscc-image" />
          </div>
        </div>
      </div>
      {/* EOL Sourcing Strategy Cycle */}

      {/* Sustainable Procurement Principles */}
      <div className="pl-section-container sustainable-procurement-principles-content">
        <h2>Sustainable Procurement Principles</h2>
      </div>
      {/* EOL Sustainable Procurement Principles */}

      {/* Other tools */}
      <OtherToolsAndResources
        toolsOrderForLandingPage={["IDC", "IMG", "CII"]}
      />
      {/* EOL Other tools */}
      <FooterDisclaimer disclaimerText="procurement" />
    </div>
  );
};

export default ProcurementLibrary;
