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
import { CheckIcon } from "../../lib/icon";
import { FooterDisclaimer } from "../income-driver-calculator/components";
import { CIIContent } from "./static";
import ContactCardEmailIcon from "../../assets/icons/contact-card-email.png";
import { useWindowDimensions } from "../../hooks";

const CocoaIncomeInventory = () => {
  const { isMobile } = useWindowDimensions();

  return (
    <Row
      id="cii-page"
      className={`cii-page-container ${isMobile ? "mobile-screen" : ""}`}
    >
      {/* Jumbotron */}
      <Col span={24} className="jumbotron-wrapper">
        <LandingIDHLogo
          style={{
            position: "absolute",
            bottom: -180,
            right: -165,
            transform: "rotate(260deg)",
            opacity: 0.5,
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
              Cocoa Income Inventory
            </h1>
            <h3>
              Explore data on cocoa production, income from cocoa and other key
              indicators from different origins
            </h3>
            <Link
              to="/cocoa-income-inventory/dashboard"
              className="button button-yellow"
            >
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
              The Cocoa Income Inventory (CII) provides publicly accessible,
              validated data on cocoa farming household incomes in an aggregated
              and anonymised format. This comprehensive and harmonised dataset
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

      {/* Public, consequences, harmonised, section */}
      <Col span={24} className="pch-wrapper">
        {CIIContent.pchContent.map((item, i) => (
          <div key={`pch-item-${i}`} className="pch-item">
            <Image src={item.icon} preview={false} height={30} />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </Col>
      {/* EOL Public, consequences, harmonised section */}

      {/* Contributing to a new sector section */}
      <Col span={24} className="contributing-wrapper">
        <h2>
          Contributing to a New Sector Standard for
          <br />
          PreCompetitive Data and Insights Sharing:
        </h2>
        <div className="contributing-content-wrapper">
          {CIIContent.contributingContent.map((item, i) => (
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
        <h2>Value for Organisations Sharing Data</h2>
        <div className="value-org-content-wrapper">
          <div className="value-org-item-wrapper">
            {CIIContent.valueOrgContent.map((item, i) => (
              <div key={`value-org-item-${i}`} className="value-org-item">
                <Image src={item.icon} preview={false} style={{ width: 30 }} />
                <div className="item-text-wrapper">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="image-wrapper">
            <Image src={ValueOrgImg} preview={false} width="100%" />
          </div>
        </div>
      </Col>
      {/* EOL Value for organisation sharing data section */}

      {/* Contribute to inventory section */}
      <Col span={24} className="contribute-to-wrapper">
        <h2>Contribute to the inventory</h2>
        <p>
          Organisations wishing to contribute their datasets should contact:
        </p>
        <div className="contact-card-wrapper">
          {CIIContent.contactCardContent.map((item, i) => (
            <div key={`contact-card-item-${i}`} className="contact-card-item">
              <Image src={ContactCardEmailIcon} preview={false} width={30} />
              <div className="name">{item.name}</div>
              <div className={`org ${!item.organisation ? "hidden" : ""}`}>
                {item.organisation ? item.organisation : "&nbsp;"}
              </div>
              <div className="email">
                <a href={`mailto:${item.email}`}>{item.email}</a>
              </div>
            </div>
          ))}
        </div>
        <div className="ack-wrapper">
          <p>
            Citation: IDH, VOICE Network, WUR, 2025. Cocoa Income Inventory -
            Release February 2025. Authors: Yuca Waarts (WUR), Antonie Fountain
            (Voice Network), Pavithra Ram (IDH), Valerie Janssen (WUR), Olivia
            Azhari (WUR), 2025.
          </p>
          <p>
            We gratefully acknowledge the valuable data contributions from Barry
            Callebaut, Cargill, ECOM, Fairtrade International, IDH, KIT, Mars
            and Rainforest Alliance.
            <br />
            The following organisations were instrumental in designing the
            questions collected in the Cocoa Income Inventory: KIT, Südwind,
            Agri-Logic, Sustainable Food Lab, with additional input from members
            of the Alliance of Living Income in Cocoa (ALICO) (members of ALICO
            include WCF, LICOP, GIZ, Voice Network, IDH, GISCO, SWISSCO, DISCO
            and Beyond Chocolate). Going forward, we hope that more
            organisations will contribute their data to make the Cocoa Income
            Inventory even more robust and representative.
          </p>
          <p>
            Funded by the IDH{" "}
            <a
              href="https://www.idhsustainabletrade.com/roadmap-on-living-income/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Living Income Roadmap
            </a>
            . In-kind contributions by WUR, VOICE.
          </p>
        </div>
      </Col>
      {/* EOL Contribute to inventory section */}

      <FooterDisclaimer disclaimerText="cii" showPageFooter={true} />
    </Row>
  );
};

export default CocoaIncomeInventory;
