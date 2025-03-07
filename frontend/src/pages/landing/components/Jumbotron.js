import React from "react";
import "./landingcomp.scss";
import { Row, Col, Button } from "antd";
import { Link } from "react-router-dom";
import { UserState } from "../../../store";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";
import { LandingIDHLogo } from "../../../lib/icon";

const Jumbotron = ({ signOut = null }) => {
  const navigate = useNavigate();
  const loggedIn = UserState.useState((s) => s.id);

  return (
    <Row id="jumbotron" data-testid="jumbotron-wrapper" justify="center">
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

      <Col span={24} className="jumbotron-col">
        <h1 data-testid="jumbotron-title">
          Welcome to the Income Driver Calculator (IDC)
        </h1>
        <h3 data-testid="jumbotron-subtitle">
          IDH works towards better incomes for smallholder farmers across
          different sectors and landscapes.
        </h3>
        {loggedIn ? (
          <Button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="button button-yellow"
            type="secondary"
            size="small"
          >
            Sign out
          </Button>
        ) : (
          <Link
            to="/login"
            data-testid="button-learn-more"
            className="button button-yellow"
          >
            Log in to calculator{" "}
            <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
          </Link>
        )}
      </Col>
    </Row>
  );
};

export default Jumbotron;
