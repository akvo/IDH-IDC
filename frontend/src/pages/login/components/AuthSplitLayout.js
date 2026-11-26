import React from "react";
import { Link } from "react-router-dom";
import { MailOutlined } from "@ant-design/icons";
import { ContentLayout } from "../../../components/layout";
import Logo from "../../../assets/images/logo.png";
import "./AuthSplitLayout.scss";

export const SUPPORT_EMAIL = "livingincome@idhtrade.org";

// Toolkit onboarding shell: branded header, page content and footer on the
// left, `aside` on the right (stacked below on mobile)
// `heroAside` keeps the full-bleed image pane of the login screen instead of
// the card panel
const AuthSplitLayout = ({
  children,
  aside,
  heroAside = false,
  testId,
  onEmailClick,
}) => (
  <ContentLayout wrapperId="login">
    <div
      className="login-split-container auth-split-container"
      data-testid={testId}
    >
      <div className="login-left-pane">
        <div className="login-pane-header">
          <Link to="/" data-testid="logo-link" className="header-brand-link">
            <img
              src={Logo}
              alt="IDH Logo"
              className="header-logo"
              data-testid="logo-image"
            />
            <div className="header-divider" />
            <span className="header-subtitle">
              Toolkit Towards Better Incomes
            </span>
          </Link>
        </div>

        <div className="login-pane-body">{children}</div>

        <div className="login-pane-footer">
          <span className="footer-copyright">© IDH 2026</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="footer-email-link"
            onClick={onEmailClick}
          >
            <MailOutlined className="footer-email-icon" />
            <span>{SUPPORT_EMAIL}</span>
          </a>
        </div>
      </div>

      <aside
        className={`login-right-pane ${
          heroAside ? "auth-hero-pane" : "auth-aside-pane"
        }`}
      >
        {aside}
      </aside>
    </div>
  </ContentLayout>
);

export default AuthSplitLayout;
