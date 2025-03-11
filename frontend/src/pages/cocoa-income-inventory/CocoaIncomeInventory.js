import React from "react";
import "./cii.scss";
import { Link } from "react-router-dom";
import { Row, Col } from "antd";
import { LandingIDHLogo } from "../../lib/icon";
import { ArrowRightOutlined } from "@ant-design/icons";

const CocoaIncomeInventory = () => {
  return (
    <Row id="cii-page" gutter={[24, 24]}>
      {/* Jumbotron */}
      <Col span={24}>
        <div className="jumbotron-wrapper">
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
                Explore data on cocoa production, income from cocoa and other
                key indicators from different origins
              </h3>
              <Link to="/" className="button button-yellow">
                Explore dashboard{" "}
                <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
              </Link>
            </div>
          </div>
        </div>
      </Col>

      {/* About */}
      <Col span={24}>
        <div className="logos-wrapper"></div>
        <div className="about-content-wrapper"></div>
      </Col>
    </Row>
  );
};

export default CocoaIncomeInventory;
