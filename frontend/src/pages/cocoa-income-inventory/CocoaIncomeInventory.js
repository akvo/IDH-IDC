import React from "react";
import "./cii.scss";
import { Link } from "react-router-dom";
import { Row, Col, Image } from "antd";
import { LandingIDHLogo } from "../../lib/icon";
import { ArrowRightOutlined } from "@ant-design/icons";
import IDHLogo from "../../assets/images/logo.png";
import WageningenLogo from "../../assets/images/cii/wageningen-univ.png";
import VoiceLogo from "../../assets/images/cii/voice.png";
import ValueOrgImg from "../../assets/images/cii/value-for-org-sharing-data.jpeg";
import IndicatorCarousel from "./IndicatorCarousel";
import { pchContent } from "./pch-content";
import { contributingContent } from "./contributing-content";
import { valueOrgContent } from "./value-org-content";
import { CheckIcon } from "../../lib/icon";
import { FooterDisclaimer } from "../landing/components";

const CocoaIncomeInventory = () => {
  return (
    <Row id="cii-page" className="cii-page-container">
      {/* Jumbotron */}
      <Col span={24} className="jumbotron-wrapper">
        <LandingIDHLogo
          style={{
            position: "absolute",
            bottom: -180,
            right: -165,
            transform: "rotate(260deg)",
          }}
          width={400}
          height={400}
        />
        <div className="jumbotron-gradient-wrapper">
          <div className="jumbotron-gradient-overlay"></div>
          <div className="jumbotron-text-wrapper">
            <h1>
              Welcome to the
              <br />
              cocoa income inventory
            </h1>
            <h3>
              Explore data on cocoa production, income from cocoa and other key
              indicators from different origins
            </h3>
            <Link to="/" className="button button-yellow">
              Explore dashboard{" "}
              <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
            </Link>
          </div>
        </div>
      </Col>
      {/* EOL Jumbotron */}

      {/* About */}
      <Col span={24} className="about-wrapper">
        <div className="logos-wrapper">
          {[IDHLogo, WageningenLogo, VoiceLogo].map((img, i) => (
            <div key={`logo-img-${i}`}>
              <Image src={img} preview={false} height={48} />
            </div>
          ))}
        </div>
        <div className="about-text-wrapper">
          <h2>About the Cocoa Income Inventory</h2>
          <div className="about-description-wrapper">
            <p>
              The Cocoa Income Inventory provides publicly accessible, validated
              data on cocoa farming household incomes in an aggregated and
              anonymized format. This comprehensive and harmonized dataset
              offers valuable insights into the impact of interventions,
              supporting informed decision-making and fostering learning across
              the cocoa sector.
            </p>
            <p>
              By sharing this evidence through a dedicated platform, the
              initiative enables policymakers and industry partners to evaluate
              the effectiveness of various living income strategies, driving
              sector-wide improvements and sustainable change.
            </p>
          </div>
        </div>
      </Col>
      {/* EOL About */}

      {/* Indicators section */}
      <Col span={24} className="indicators-wrapper">
        <h2>Example indicators to be explored</h2>
        <IndicatorCarousel />
      </Col>
      {/* EOL Indicators section */}

      {/* Public, consequences, harmonized, section */}
      <Col span={24} className="pch-wrapper">
        {pchContent.map((item, i) => (
          <div key={`pch-item-${i}`} className="pch-item">
            <Image src={item.icon} preview={false} height={30} />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </Col>
      {/* EOL Public, consequences, harmonized section */}

      {/* Contributing to a new sector section */}
      <Col span={24} className="contributing-wrapper">
        <h2>
          Contributing to a New Sector Standard for
          <br />
          PreCompetitive Data and Insights Sharing:
        </h2>
        <div className="contributing-content-wrapper">
          {contributingContent.map((item, i) => (
            <div key={`contributing-item-${i}`} className="contributing-item">
              <div>
                <CheckIcon width={20} height={20} />
              </div>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </Col>
      {/* EOL Contributing to a new sector section */}

      {/* Value for organisation sharing data section */}
      <Col span={24} className="value-org-wrapper">
        <h2>Value for Organizations Sharing Data</h2>
        <div className="value-org-content-wrapper">
          <div className="value-org-item-wrapper">
            {valueOrgContent.map((item, i) => (
              <div key={`value-org-item-${i}`} className="value-org-item">
                <Image src={item.icon} preview={false} style={{ width: 30 }} />
                <div className="item-text-wrapper">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Image
            src={ValueOrgImg}
            preview={false}
            width="50%"
            className="image-wrapper"
          />
        </div>
      </Col>
      {/* EOL Value for organisation sharing data section */}

      <FooterDisclaimer />
    </Row>
  );
};

export default CocoaIncomeInventory;
