import "./home.scss";
import { Card, Row, Col, Image, Space } from "antd";
import { Link } from "react-router-dom";
import {
  LandingInfoDriversIcon,
  HomeExploreToolkitIcon,
  LandingIDHLogo,
} from "../../lib/icon";
import CheckIcon from "../../assets/icons/check-icon.svg";
import { ArrowRightOutlined } from "@ant-design/icons";

import { toolResourceItems } from "./tools-resources-content";
import { orderBy } from "lodash";
import { FooterDisclaimer } from "../income-driver-calculator/components";
import PizzaDiagram from "./PizzaDiagram";
import LivingIncomeSteps from "./LivingIncomeSteps";
import { useWindowDimensions } from "../../hooks";

const Home = () => {
  const { isMobile } = useWindowDimensions();

  return (
    <div
      className={`home-container ${isMobile ? "mobile-screen" : ""}`}
      id="home"
    >
      {/* Jumbotron */}
      <Row id="jumbotron" justify="center" data-testid="jumbotron-wrapper">
        <Col span={24} className="jumbotron-gradient-wrapper">
          <div className="jumbotron-gradient-overlay"></div>
          <div className="jumbotron-text-wrapper">
            <h1 data-testid="jumbotron-title">Welcome to the Toolkit</h1>
            <h3 data-testid="jumbotron-subtitle" className="jumbotron-subtitle">
              A growing set of practical, data-driven tools to help companies
              take smarter, more targeted action to help raise famer incomes in
              their supply chains towards a living income.
            </h3>
            <Link
              to="#"
              data-testid="button-learn-more"
              className="button button-yellow"
            >
              Watch the video
            </Link>
          </div>
        </Col>
      </Row>
      {/* EOL Jumbotron */}

      {/* Info card */}
      <Row
        data-testid="info-card-wrapper"
        justify="space-evenly"
        align="center"
        className="info-card-row"
        gutter={isMobile ? [0, 20] : [20, 20]}
      >
        <Col sm={24} md={12} align="top">
          <Card className="info-card-wrapper info-first">
            <div className="info-card-icon">
              <LandingInfoDriversIcon />
            </div>
            <h3>Living Income Roadmap</h3>
            <p>
              Range of steps, guiding questions and data-driven tools designed
              for companies to drive aligned action towards closing living
              income gaps for farming households.
            </p>
            <Link to="#">Explore</Link>
          </Card>
        </Col>
        <Col sm={24} md={12} align="top">
          <Card className="info-card-wrapper info-second">
            <div className="info-card-icon">
              <HomeExploreToolkitIcon />
            </div>
            <h3>Explore the toolkit</h3>
            <p>
              Data-driven tools to help companies take evidence driven action
              towards assessing and closing the living income gap in their
              supply chains
            </p>
            <Link to="#">Explore</Link>
          </Card>
        </Col>
      </Row>
      {/* EOL Info card */}

      {/* Roadmap */}
      <Row
        data-testid="income-driver-framework-wrapper"
        justify="center"
        className="income-driver-framework-wrapper"
      >
        <Col span={24} className="income-driver-framework-text-wrapper">
          <h2>Living Income Roadmap to Guide Action</h2>
          <p>
            IDH works to improve incomes for smallholder farmers across sectors
            and landscapes. Achieving this requires stakeholders to shift
            practices at multiple levels. As the initiator of the Living Income
            Roadmap, IDH drives collaborative action through a shared framework.
            The Roadmap outlines key steps, guiding questions and data-driven
            tools that are dynamic and meant to be used in parallel. It
            emphasises the importance of using comparable data, fostering
            multi-stakeholder partnerships and taking immediate coordinated
            action.
          </p>
        </Col>
        <Col span={24} align="center">
          <LivingIncomeSteps />
        </Col>
      </Row>
      {/* EOL Roadmap */}

      {/* Toolkit towards better income */}
      <Row className="toolkit-wrapper">
        <Col span={24} className="toolkit-header-wrapper">
          <Row align="top" justify="space-between" gutter={[20, 20]}>
            <Col span={{ xs: 24, sm: 24, md: 24, lg: 18 }}>
              <h2>Toolkit towards better income</h2>
              <p>
                Explore a set of tools and resources made available by IDH and
                our partners below.
              </p>
            </Col>
            <Col
              span={{ xs: 24, sm: 24, md: 24, lg: 6 }}
              align={isMobile ? "left" : "right"}
            >
              <Link to="#" className="button button-green-fill">
                Explore all Resources{" "}
                <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
              </Link>
            </Col>
          </Row>
        </Col>

        {/* the contents */}
        {orderBy(toolResourceItems, ["order"]).map((it, idx) => {
          const even = (idx + 1) % 2 === 0;
          const leftPositition = isMobile ? 2 : even ? 2 : 1;
          const rightPosition = isMobile ? 1 : even ? 1 : 2;
          return (
            <Col
              span={24}
              className="tool-resource-items-wrapper"
              key={`tri-${idx}`}
            >
              <Row
                gutter={isMobile ? [0, 20] : [48, 24]}
                align="middle"
                justify="space-between"
              >
                <Col
                  span={isMobile ? 24 : 14}
                  order={leftPositition}
                  className="tool-resource-item-content"
                >
                  <Space style={{ width: "100%" }} align="center" size="large">
                    <Image src={it.icon} width={48} preview={false} />
                    <div>
                      <h3>{it.title}</h3>
                      <p className="link-to-step-text">{it.linkToStepText}</p>
                    </div>
                  </Space>
                  <p>{it.description}</p>
                  <div className="tool-resource-list">
                    {it.list.map((lit, lidx) => (
                      <Space
                        key={`tri-list-${lidx}`}
                        style={{ width: "100%" }}
                        align="center"
                      >
                        <Image src={CheckIcon} preview={false} width={24} />
                        <p>{lit}</p>
                      </Space>
                    ))}
                  </div>
                  {it.button.type === "download" ? (
                    <a
                      href={it.button.href}
                      download
                      className="button button-green-fill"
                    >
                      {it.button.text}
                    </a>
                  ) : (
                    <Link
                      to={it.button.href}
                      className="button button-green-fill"
                    >
                      {it.button.text}
                    </Link>
                  )}
                </Col>
                <Col span={isMobile ? 24 : 10} order={rightPosition}>
                  <div
                    className="tool-resource-image"
                    style={{
                      backgroundImage: `url(${it.image})`,
                      backgroundSize: it?.backgroundSize || "cover",
                    }}
                  ></div>
                  {/* <Image src={it.image} preview={false} /> */}
                </Col>
              </Row>
              {idx === toolResourceItems.length - 1 && (
                <LandingIDHLogo
                  style={{
                    position: "absolute",
                    bottom: -165,
                    left: -265,
                    transform: "rotate(90deg)",
                  }}
                  width={400}
                  height={400}
                  color="#d5ebfd66"
                />
              )}
            </Col>
          );
        })}
      </Row>
      {/* EOL Toolkit towards better income */}

      {/* Smart-mix */}
      <div id="smart-mix">
        <div className="text-wrapper">
          <h2>Smart-mix of strategies</h2>
          <p style={{ width: "85%" }}>
            Strategies to improve income extend well beyond changes in the farm
            systems and household behaviour. They include service delivery for
            improved production and processing, brand and consumer engagement,
            and enhancing the enabling environment. The smart-mix of strategies
            covers six strategic areas companies can address within
            multi-stakeholder intervention. Each strategy aims to improve one or
            more income drivers or the conditions that that support them.
          </p>
        </div>
        <div className="pizza-wrapper">
          <PizzaDiagram />
        </div>
      </div>
      {/* EOL Smart-mix */}

      {/* Connect */}
      <Row className="connect-wrapper" align="middle">
        <Col span={24} className="connect-col" align="center">
          <Card>
            <div className="connect-content-wrapper">
              <h2>Do you want to connect?</h2>
              <p>
                Have a question or want to know more? Reach out to our Better
                Income team.
              </p>
              <br />
              <a
                href="mailto:livingincome@idhtrade.org"
                className="button button-green"
              >
                Get in touch
              </a>
            </div>

            <LandingIDHLogo
              style={{
                position: "absolute",
                bottom: -115,
                right: -115,
                transform: "rotate(260deg)",
              }}
              width={300}
              height={300}
              color="#FFFAEB"
            />
          </Card>
        </Col>
      </Row>
      {/* EOL Connect */}

      <FooterDisclaimer />
    </div>
  );
};

export default Home;
