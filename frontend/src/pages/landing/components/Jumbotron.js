import React from "react";
import "./landingcomp.scss";
import { Row, Col, Button } from "antd";
import { Link } from "react-router-dom";

const Jumbotron = ({ signOut = null }) => (
  <Row id="jumbotron" data-testid="jumbotron-wrapper" justify="center">
    <Col span={24}>
      <h1 data-testid="jumbotron-title">
        Welcome to the income driver calculator
      </h1>
      <h3 data-testid="jumbotron-subtitle">
        IDH is working to secure better income for smallholder farmers in
        several sectors and landscapes.
      </h3>
      {signOut ? (
        <Button
          onClick={() => signOut()}
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
          Sign in to calculator
        </Link>
      )}
    </Col>
  </Row>
);

export default Jumbotron;
