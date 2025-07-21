import React from "react";
import { Image, Row, Col, Steps } from "antd";
import "./landingcomp.scss";
import GetStartedImg from "../../../assets/images/get-started.png";
import { caseStepItems } from "../../../store/static";
import { Link } from "react-router-dom";
import { routePath } from "../../../components/route";
import { ArrowRightOutlined } from "@ant-design/icons";

const GetStarted = () => {
  return (
    <div id="get-started">
      <Row gutter={[20, 20]} align="top" justify="space-between">
        <Col span={16}>
          <h2>
            What is the current income of the farming households?
            <br />
            What is the income gap?
          </h2>
          <p>
            The Income Driver Calculator (IDC) provides a structured approach to
            assessing the income gap and identifying the most impactful income
            drivers for each farmer segment. The tool also analyses how
            diversified income sources affect household income and enables users
            to model various intervention scenarios to evaluate their
            effectiveness in closing the income gap.
          </p>
        </Col>
        <Col span={8} align="end" className="get-started-button-wrapper">
          <Row align="middle" gutter={[10, 10]}>
            <Col align="end">
              <Link to="#" className="button button-green">
                See the demo
              </Link>
            </Col>
            <Col align="end">
              <Link
                to={routePath.idc.login}
                className="button button-green-fill"
              >
                Log in to the calculator{" "}
                <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 900 }} />
              </Link>
            </Col>
          </Row>
        </Col>
      </Row>

      <div className="image-steps-container">
        <div className="image-wrapper">
          <Image src={GetStartedImg} preview={false} style={{ width: "95%" }} />
        </div>
        <div>
          <Steps
            direction="vertical"
            items={caseStepItems}
            className="case-step-wrapper"
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
