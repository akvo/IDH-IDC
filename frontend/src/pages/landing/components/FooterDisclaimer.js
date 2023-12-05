import React from "react";
import "./landingcomp.scss";
import { Row, Col, Space, Image, Divider } from "antd";
import LogoWhite from "../../../assets/images/logo-white.png";

const FooterDisclaimer = () => {
  return (
    <Row
      id="footer-disclaimer"
      data-testid="disclaimer-section-wrapper"
      justify="center"
    >
      <Col span={24}>
        <h2 data-testid="disclaimer-section-title">Disclaimer</h2>
        <p data-testid="disclaimer-section-description">
          The data published on this website is provided by IDH as a public
          service to promote transparency, accountability, and informed
          decision-making. However, all data is provided &quot;as is&quot;
          without any warranty, representation, or guarantee of any kind,
          including but not limited to its content, accuracy, timeliness,
          completeness, or fitness for a particular purpose.
          <br />
          <br />
          IDH does not make any implied warranties and shall not be liable for
          any errors, omissions, or inaccuracies in the data provided,
          regardless of the cause, nor for any decision made or action taken or
          not taken by anyone using or relying on such data.
          <br />
          <br />
          For our own analyses, insights and recommendations based on this data,
          please refer to our Insights Explorer.
        </p>
      </Col>
      <Col span={24} className="footer-wrapper">
        <Divider style={{ borderColor: "#fff", opacity: 0.25 }} />
        <Space align="center">
          <Image src={LogoWhite} preview={false} width={100} />
          <div className="copyright-text">
            Copyright 2023 © IDH. All rights reserved - Created by Akvo.
          </div>
        </Space>
      </Col>
    </Row>
  );
};

export default FooterDisclaimer;
