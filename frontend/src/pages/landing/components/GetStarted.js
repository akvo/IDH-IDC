import React from "react";
import { Row, Col, Space, Image } from "antd";
import "./landingcomp.scss";
import { Link } from "react-router-dom";
import LoginRightImage from "../../../assets/images/login-right-img.png";
import { UserState } from "../../../store";

const GetStarted = () => {
  const loggedIn = UserState.useState((s) => s.id);

  const items = [
    {
      title: "Set up your case",
      description:
        "To begin, create a new case and fill in the details of your case such as the name, country of interest, name of the primary commodity and measurement units you would like to use.",
    },
    {
      title: "Follow the prompt to input",
      description:
        "Then, follow the prompts to input the relevant data for each income driver, including breakdown levels where applicable.",
    },
    {
      title: "Dive deeper into understanding the income gap",
      description:
        "You will be able to delve deeper into the income gap and understand what drivers you can leverage to close the income gap for different farmer segments.",
    },
  ];

  return (
    <Row id="get-started">
      <Col span={12}>
        <h2>Using the Income Driver Calculator</h2>
        <Space
          direction="vertical"
          size={[24, 24]}
          className="get-started-info-wrapper"
        >
          {items.map((it, i) => (
            <div key={i}>
              <Space direction="vertical" size={[16, 16]}>
                <Space align="center">
                  <div className="number">{i + 1}</div>
                  <div className="title">{it.title}</div>
                </Space>
                <div className="description">{it.description}</div>
              </Space>
            </div>
          ))}
        </Space>
        <div className="button-wrapper">
          {loggedIn ? (
            <Link to="/old-cases" className="button button-green-fill">
              Go to my cases
            </Link>
          ) : (
            <Link to="/login" className="button button-green-fill">
              Sign in to calculator
            </Link>
          )}
        </div>
      </Col>
      <Col span={12} className="image-wrapper">
        <Image src={LoginRightImage} preview={false} />
      </Col>
    </Row>
  );
};

export default GetStarted;
