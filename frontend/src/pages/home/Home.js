import "./home.scss";
import { Card, Row, Col, Image, Space, Popconfirm } from "antd";
import { Link } from "react-router-dom";
import {
  LandingInfoDriversIcon,
  HomeExploreToolkitIcon,
  LandingIDHLogo,
} from "../../lib/icon";
import LivingIncomeRoadmap from "../../assets/images/living-income-roadmap.png";
import CheckIcon from "../../assets/icons/check-icon.svg";
import SmartMix from "../../assets/images/smart-mix-of-strategies.png";
import { ArrowRightOutlined } from "@ant-design/icons";

import { toolResourceItems } from "./tools-resources-content";
import { orderBy } from "lodash";
import { FooterDisclaimer } from "../income-driver-calculator/components";

const PizzaDiagram = () => {
  const slices = [
    {
      key: 1,
      placement: "top",
      title: "Enabling environment",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 2,
      placement: "top",
      title: "Production and processing",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 3,
      placement: "right",
      title: "Procurement practices",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 4,
      placement: "bottom",
      title: "Consumer engagement & product innovation",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 5,
      placement: "bottom",
      title: "Tranceability & transparancy",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
    {
      key: 6,
      placement: "left",
      title: "Sector and landscape management",
      description:
        "The range of factors that together create the context in which different stakeholders operate, and which can facilitate production.",
    },
  ];
  return (
    <div className="pie-container">
      {/* Background Image */}
      <img src={SmartMix} alt="smart-mix-img" className="pie-image" />

      {/* Invisible Slices */}
      {slices.map(({ key, title, description, placement }) => (
        <Popconfirm
          key={key}
          placement={placement}
          color="#fff"
          title={() => <div className="pizza-tooltip-title">{title}</div>}
          description={() => (
            <div className="pizza-tooltip-description">{description}</div>
          )}
          trigger="hover"
          showCancel={false}
          okButtonProps={{
            style: {
              display: "none",
            },
          }}
          icon={null}
        >
          <div className={`slice slice-${key}`} />
        </Popconfirm>
      ))}
    </div>
  );
};

const Home = () => {
  return (
    <div className="home-container" id="home">
      {/* Jumbotron */}
      <Row id="jumbotron" justify="center" data-testid="jumbotron-wrapper">
        <Col span={24} className="jumbotron-gradient-wrapper">
          <div className="jumbotron-gradient-overlay"></div>
          <div className="jumbotron-text-wrapper">
            <h1 data-testid="jumbotron-title">
              Welcome to the
              <br />
              Living Income Roadmap Toolkit
            </h1>
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
        gutter={24}
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
          <Image src={LivingIncomeRoadmap} preview={false} width={800} />
        </Col>
      </Row>
      {/* EOL Roadmap */}

      {/* Toolkit towards better income */}
      <Row className="toolkit-wrapper">
        <Col span={24} className="toolkit-header-wrapper">
          <Row align="top" justify="space-between">
            <Col span={18}>
              <h2>Toolkit towards better income</h2>
              <p>
                Explore a set of tools and resources made available by IDH and
                our partners below.
              </p>
            </Col>
            <Col span={6} align="right">
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
          const leftPositition = even ? 2 : 1;
          const rightPosition = even ? 1 : 2;
          return (
            <Col
              span={24}
              className="tool-resource-items-wrapper"
              key={`tri-${idx}`}
            >
              <Row gutter={[24, 24]} align="middle" justify="space-between">
                <Col span={14} order={leftPositition}>
                  <Space style={{ width: "100%" }}>
                    <Image src={it.icon} width={32} preview={false} />
                    <h3>{it.title}</h3>
                  </Space>
                  <p>{it.description}</p>
                  {it.list.map((lit, lidx) => (
                    <Space key={`tri-list-${lidx}`} style={{ width: "100%" }}>
                      <Image src={CheckIcon} preview={false} width={24} />
                      <p>{lit}</p>
                    </Space>
                  ))}
                </Col>
                <Col span={10} order={rightPosition}>
                  <Image src={it.image} preview={false} />
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

      <FooterDisclaimer />
    </div>
  );
};

export default Home;
