import React from "react";
import LogoWhite from "../../assets/images/logo-white.png";
import AkvoLogoWhite from "../../assets/images/akvo-logo-white.png";
import { Row, Col, Space, Image } from "antd";

const page = {
  default: "Income Driver Calculator",
  cii: "Cocoa Income Inventory",
  procurement: "Procurement Library ",
};

const PageFooter = ({
  wrapper = true,
  fixed = false,
  disclaimerText = "default",
}) => {
  return (
    <Row
      align="middle"
      className={`page-footer-container ${wrapper ? "with-padding-bg" : ""} ${
        fixed ? "with-fixed-position" : ""
      }`}
    >
      <Col span={18}>
        <Space align="center" size="large">
          <Image src={LogoWhite} preview={false} width={115} />
          <div className="copyright-text">
            <div>Copyright 2025 © IDH.</div>
            <div>
              All rights reserved. The{" "}
              {page?.[disclaimerText] ? page[disclaimerText] : page.default} is
              developed by Akvo.
            </div>
          </div>
        </Space>
      </Col>
      <Col span={6} style={{ textAlign: "right" }} align="end">
        <Image src={AkvoLogoWhite} preview={false} width={100} />
      </Col>
    </Row>
  );
};

export default PageFooter;
