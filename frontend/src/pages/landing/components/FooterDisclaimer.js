import React, { useState } from "react";
import "./landingcomp.scss";
import { Row, Col, Space, Image, Divider } from "antd";
import LogoWhite from "../../../assets/images/logo-white.png";
import { Link } from "react-router-dom";
import { DataSecurityProvisionModal } from "../../../components/utils";

const FooterDisclaimer = () => {
  const [dataSecurityProvisionVisible, setDataSecurityProvisionVisible] =
    useState(false);

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
        <br />
        <p>
          We are committed to safeguarding your information and maintaining the
          highest standards of data protection. Please review our{" "}
          <Link
            className="copyright-text"
            style={{ color: "#fff" }}
            onClick={() => setDataSecurityProvisionVisible(true)}
          >
            <u>Data Security Provision</u>
          </Link>{" "}
          for detailed information on how we collect, use, and protect your
          data.
        </p>
      </Col>
      <Col span={24} className="footer-wrapper">
        <Divider style={{ borderColor: "#fff", opacity: 0.25 }} />
        <Row align="middle">
          <Col span={24}>
            <Space align="center">
              <Image src={LogoWhite} preview={false} width={100} />
              <div className="copyright-text">
                Copyright 2023 © IDH. All rights reserved - Created by Akvo.
              </div>
            </Space>
          </Col>
        </Row>
      </Col>

      {/* Data Security Provision Modal */}
      <DataSecurityProvisionModal
        visible={dataSecurityProvisionVisible}
        setVisible={setDataSecurityProvisionVisible}
      />
    </Row>
  );
};

export default FooterDisclaimer;
