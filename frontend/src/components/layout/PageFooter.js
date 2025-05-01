import React from "react";
import LogoWhite from "../../assets/images/logo-white.png";
import { Row, Col, Space, Image } from "antd";

const PageFooter = ({ wrapper = true, fixed = false }) => {
  return (
    <Row
      align="middle"
      className={`page-footer-container ${wrapper ? "with-padding-bg" : ""} ${
        fixed ? "with-fixed-position" : ""
      }`}
    >
      <Col span={24}>
        <Space align="center" size="large">
          <Image src={LogoWhite} preview={false} width={115} />
          <div className="copyright-text">
            <div>Copyright 2023 © IDH.</div>
            <div>All rights reserved. The IDC is developed by Akvo.</div>
          </div>
        </Space>
      </Col>
    </Row>
  );
};

export default PageFooter;
