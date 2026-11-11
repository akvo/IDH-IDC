import React from "react";
import { Modal } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export const showIdcAccessRequestModal = () =>
  Modal.info({
    title: "Income Driver Calculator Access",
    icon: <InfoCircleOutlined style={{ color: "#01625f" }} />,
    className: "access-request-modal",
    width: 480,
    okText: "Got it",
    okButtonProps: {
      className: "button-modal-ok",
    },
    content: (
      <div className="access-modal-content">
        <p>
          The <strong>Income Driver Calculator</strong> is restricted to
          authorized supply chain partners and program participants.
        </p>
        <p>
          If your company or organization participates in an IDH living income
          program, please contact your organization administrator or reach out
          to us at:
        </p>
        <div className="access-modal-contact-card">
          <span className="contact-label">Support & Invitations:</span>
          <a href="mailto:livingincome@idhtrade.org" className="contact-email">
            livingincome@idhtrade.org
          </a>
        </div>
      </div>
    ),
  });
