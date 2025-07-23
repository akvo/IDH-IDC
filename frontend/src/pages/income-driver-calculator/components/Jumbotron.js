import React, { useState } from "react";
import "./landingcomp.scss";
import { Row, Col, Space } from "antd";
import { Link } from "react-router-dom";
import { UserState } from "../../../store";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";
import { LandingIDHLogo } from "../../../lib/icon";
import { routePath } from "../../../components/route";
import { LoadingOutlined } from "@ant-design/icons";
import { useWindowDimensions, useSignOut } from "../../../hooks";

const Jumbotron = () => {
  const navigate = useNavigate();
  const loggedIn = UserState.useState((s) => s.id);
  const [loading, setLoading] = useState(false);
  const { isMobile } = useWindowDimensions();
  const signOut = useSignOut();

  return (
    <Row
      id="jumbotron"
      data-testid="jumbotron-wrapper"
      justify="center"
      className={isMobile ? "mobile-screen" : ""}
    >
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

      <Col span={24} className="jumbotron-gradient-wrapper">
        <div className="jumbotron-gradient-overlay"></div>
        <div className="jumbotron-text-wrapper">
          <h1 data-testid="jumbotron-title">
            Welcome to the
            <br />
            Income Driver Calculator
          </h1>
          <h3 data-testid="jumbotron-subtitle" className="jumbotron-subtitle">
            The Income Driver Calculator is an online tool that supports
            companies to assess the size of the (living) income gap for their
            farming partners and take data driven decisions on the most
            effective strategies, using aggregated data.
          </h3>
          {loggedIn ? (
            <Link
              onClick={() => {
                setLoading(true);
                signOut();
                setTimeout(() => {
                  setLoading(false);
                  navigate(routePath.idc.landing);
                }, 300);
              }}
              className="button button-yellow"
            >
              {loading ? (
                <Space>
                  <LoadingOutlined />
                  Sign out
                </Space>
              ) : (
                "Sign out"
              )}
            </Link>
          ) : (
            <Link
              to={routePath.idc.login}
              data-testid="button-learn-more"
              className="button button-yellow"
            >
              Log in to the calculator{" "}
              <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
            </Link>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default Jumbotron;
