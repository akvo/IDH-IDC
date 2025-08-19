import React, { useState, useCallback } from "react";
import "./landingcomp.scss";
import { Row, Col, Divider, Space, Image } from "antd";
import { Link } from "react-router-dom";
import { DataSecurityProvisionModal } from "../../../components/utils";
import { PageFooter } from "../../../components/layout";
import LinkedinIcon from "../../../assets/icons/linkedin.svg";
import YoutubeIcon from "../../../assets/icons/youtube.svg";
import { useWindowDimensions } from "../../../hooks";
import { routePath } from "../../../components/route";

const defaultDisclaimerText = (handleSecurityClick) => (
  <div className="disclaimer-text-wrapper">
    <div>
      <p data-testid="disclaimer-section-description">
        The data published on this website is provided by IDH as a public
        service to promote transparency, accountability, and informed
        decision-making. However, all data is provided &quot;as is&quot; without
        any warranty, representation, or guarantee of any kind, including but
        not limited to its content, accuracy, timeliness, completeness, or
        fitness for a particular purpose.
        <br />
        <br />
        IDH does not make any implied warranties and shall not be liable for any
        errors, omissions, or inaccuracies in the data provided, regardless of
        the cause, nor for any decision made or action taken or not taken by
        anyone using or relying on such data.
        <br />
        <br />
        For our own analyses, insights and recommendations based on this data,
        please refer to our Insights Explorer.
      </p>
    </div>
    <div>
      <p>
        We are committed to safeguarding your information and maintaining the
        highest standards of data protection. Please review our{" "}
        <Link
          className="copyright-text"
          style={{ color: "#fff" }}
          onClick={handleSecurityClick}
        >
          <u>Data Security Provision</u>
        </Link>{" "}
        for detailed information on how we collect, use, and protect your data.
      </p>
    </div>
  </div>
);

const ciiDisclaimerText = (handleSecurityClick) => (
  <>
    <p data-testid="disclaimer-section-description">
      The data published on this website is provided by IDH, Wageningen
      University and The Voice Network, as a public service to promote
      transparency, accountability, and informed decision-making. However, all
      data is provided &quot;as is&quot; without any warranty, representation,
      or guarantee of any kind, including but not limited to its content,
      accuracy, timeliness, completeness, or fitness for a particular purpose.
      <br />
      <br />
      The aforementioned organisations do not make any implied warranties and
      shall not be liable for any errors, omissions, or inaccuracies in the data
      provided, regardless of the cause, nor for any decision made or action
      taken or not taken by anyone using or relying on such data. We are
      committed to safeguarding your information and maintaining the highest
      standards of data protection. Please review our{" "}
      <Link
        className="copyright-text"
        style={{ color: "#fff" }}
        onClick={handleSecurityClick}
      >
        <u>Data Security Provision</u>
      </Link>{" "}
      for detailed information on how we collect, use, and protect your data.
      <br />
      <br />
      We encourage the use of this data in other publications, provided proper
      references are given. The CII is published under Creative Commons License
      Attribution-ShareAlike 4.0 International
      <br />
      <br />
      The Cocoa Income Inventory dashboard is developed by Akvo.
    </p>
  </>
);

const procurementDisclaimerText = () => (
  <div className="disclaimer-text-wrapper">
    <div>
      <p data-testid="disclaimer-section-description">
        Although every effort has been made to ensure that the content of this
        publication is up-to-date and accurate, errors and omissions may occur.
        The information is provided on an &quot;as is&quot; basis and is not
        intended as a substitute for the reader’s own due diligence and inquiry.
      </p>
    </div>
    <div>
      <p data-testid="disclaimer-section-description">
        IDH does not guarantee or warrant that the information is complete or
        free of error and accepts no liability for any damage whatsoever arising
        from any decision or action taken or refrained from in reliance thereon,
        nor for any inadvertent misrepresentation made or implied.
      </p>
      <p data-testid="disclaimer-section-description">
        For more information or for sharing your experience please contact{" "}
        <a href="mailto:birch@idhtrade.org" style={{ color: "#fff" }}>
          <strong>
            <u>Mark Birch</u>
          </strong>
        </a>
        , Program Director – Procurement and Living Income.
      </p>
    </div>
  </div>
);

const FooterDisclaimer = ({
  disclaimerText = "default",
  showPageFooter = true,
  showFAQNav = false,
}) => {
  const [dataSecurityProvisionVisible, setDataSecurityProvisionVisible] =
    useState(false);

  const { isMobile } = useWindowDimensions();

  // Prevent inline function warning in JSX
  const handleSecurityClick = useCallback(() => {
    setDataSecurityProvisionVisible(true);
  }, []);

  return (
    <Row
      id="footer-disclaimer"
      data-testid="disclaimer-section-wrapper"
      justify="space-between"
      className={isMobile ? "mobile-screen" : ""}
      gutter={isMobile ? [0, 24] : [0, 0]}
    >
      <Col span={isMobile ? 24 : 6}>
        <Row gutter={[32, 32]}>
          <Col span={24} className="footer-menu-wrapper">
            <Space direction="vertical" size="large">
              <Link to="/">Home</Link>
              <Link to="/income-driver-calculator">
                Income Driver Calculator
              </Link>
              <Link to="/procurement-library">Procurement Library</Link>
              <Link to="/cocoa-income-inventory">Cocoa Income Inventory</Link>
              <Link to="/tools-and-resources">Tools & Resources</Link>
              {showFAQNav ? <Link to={routePath.idc.faq}>FAQ</Link> : ""}
            </Space>
          </Col>
          <Col span={24}>
            <Space>
              <Image src={LinkedinIcon} preview={false} />
              <Image src={YoutubeIcon} preview={false} />
            </Space>
          </Col>
        </Row>
      </Col>
      <Col span={isMobile ? 24 : 18} style={{ paddingLeft: isMobile ? 0 : 20 }}>
        <h2
          data-testid="disclaimer-section-title"
          style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}
        >
          Disclaimer
        </h2>
        {(disclaimerText === "default" || disclaimerText === "idc") &&
          defaultDisclaimerText(handleSecurityClick)}
        {disclaimerText === "cii" && ciiDisclaimerText(handleSecurityClick)}
        {disclaimerText === "procurement" && procurementDisclaimerText()}
      </Col>
      {showPageFooter && (
        <Col span={24} className="footer-wrapper">
          <Divider style={{ borderColor: "#fff", opacity: 0.25 }} />
          <PageFooter
            wrapper={false}
            fixed={false}
            disclaimerText={disclaimerText}
          />
        </Col>
      )}

      {/* Data Security Provision Modal */}
      <DataSecurityProvisionModal
        visible={dataSecurityProvisionVisible}
        setVisible={setDataSecurityProvisionVisible}
      />
    </Row>
  );
};

export default FooterDisclaimer;
