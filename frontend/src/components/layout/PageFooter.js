import React from "react";
import LogoWhite from "../../assets/images/logo-white.png";
import AkvoLogoWhite from "../../assets/images/akvo-logo-white.png";
import { Row, Col, Space, Image } from "antd";
import { useWindowDimensions } from "../../hooks";

const page = {
  default: "Living Income Roadmap Toolkit",
  idc: "Income Driver Calculator",
  cii: "Cocoa Income Inventory",
  procurement: "Procurement Library ",
};

const PageFooter = ({
  wrapper = true,
  fixed = false,
  isLandingPage = true,
  disclaimerText = "default",
}) => {
  const { isMobile } = useWindowDimensions();

  return (
    <Row
      align="middle"
      className={`page-footer-container ${wrapper ? "with-padding-bg" : ""} ${
        fixed ? "with-fixed-position" : ""
      } ${isLandingPage ? "with-landing-padding" : ""}`}
      gutter={isMobile ? [0, 32] : [0, 32]}
    >
      <Col span={isMobile ? 24 : 18}>
        <Space
          align={isMobile ? "left" : "center"}
          size="large"
          direction={isMobile ? "vertical" : "horizontal"}
        >
          <Image src={LogoWhite} preview={false} width={115} />
          <div className="copyright-text">
            <div>Copyright 2025 © IDH.</div>
            <div>
              All rights reserved. The{" "}
              {page?.[disclaimerText] ? page[disclaimerText] : page.default} is
              developed by{" "}
              <a
                href="https://akvo.org/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Akvo
              </a>
              .
            </div>
          </div>
        </Space>
      </Col>
      <Col span={isMobile ? 24 : 6} align={isMobile ? "left" : "right"}>
        <Image src={AkvoLogoWhite} preview={false} width={100} />
      </Col>
    </Row>
  );
};

export default PageFooter;
