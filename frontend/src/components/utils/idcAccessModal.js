import React, { useState } from "react";
import { Modal, Button, Checkbox } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import "./idcAccessModal.scss";

export const IdcAccessModalContent = ({
  onDiscard,
  onExplore,
  onToggleDontShowAgain,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setDontShowAgain(checked);
    if (typeof window !== "undefined") {
      if (checked) {
        localStorage.setItem("idh_dismiss_idc_access_warning", "true");
      } else {
        localStorage.removeItem("idh_dismiss_idc_access_warning");
      }
    }
    if (onToggleDontShowAgain) {
      onToggleDontShowAgain(checked);
    }
  };

  return (
    <div
      className="idc-access-modal-content"
      data-testid="idc-access-modal-content"
    >
      <div className="modal-icon-badge">
        <div className="icon-circle">
          <ExclamationCircleFilled className="badge-icon" />
        </div>
      </div>
      <h2 className="modal-title" data-testid="idc-access-modal-title">
        You don’t have access to the Income Driver Calculator yet.
      </h2>
      <div className="modal-body-text">
        <p>
          Your account gives you the Living Income Academy, which you can use
          right away. The calculator is available by invitation: send an email
          to{" "}
          <a
            href="mailto:livingincome@idhtrade.org"
            className="modal-email-link"
          >
            livingincome@idhtrade.org
          </a>{" "}
          with your name, your organisation and what you would like to use the
          calculator for. IDH will get back to you personally to provide access
          to the IDC. You then log in with the same email address and password.
        </p>
      </div>
      <div className="modal-checkbox-row">
        <Checkbox
          checked={dontShowAgain}
          onChange={handleCheckboxChange}
          data-testid="checkbox-dont-show-again"
        >
          Don&apos;t show again
        </Checkbox>
      </div>
      <div className="modal-actions-row">
        <Button
          className="button-modal-discard"
          data-testid="button-modal-discard"
          onClick={() => onDiscard && onDiscard(dontShowAgain)}
        >
          Discard
        </Button>
        <Button
          type="primary"
          className="button-modal-explore"
          data-testid="button-modal-explore"
          onClick={() => onExplore && onExplore(dontShowAgain)}
        >
          Explore academy
        </Button>
      </div>
    </div>
  );
};

export const showIdcAccessRequestModal = ({
  navigate,
  onExplore,
  onDiscard,
  force = false,
} = {}) => {
  if (
    !force &&
    typeof window !== "undefined" &&
    localStorage.getItem("idh_dismiss_idc_access_warning") === "true"
  ) {
    return null;
  }

  let isDismissChecked = false;

  const modalInstance = Modal.info({
    title: "Income Driver Calculator Access",
    icon: <ExclamationCircleFilled style={{ color: "#01625f" }} />,
    className: "access-request-modal",
    width: 654,
    style: { maxWidth: "90vw" },
    centered: true,
    maskClosable: true,
    okText: "Got it",
    okButtonProps: {
      className: "button-modal-ok",
      style: { display: "none" },
    },
    content: (
      <IdcAccessModalContent
        onToggleDontShowAgain={(checked) => {
          isDismissChecked = checked;
        }}
        onDiscard={() => {
          if (isDismissChecked && typeof window !== "undefined") {
            localStorage.setItem("idh_dismiss_idc_access_warning", "true");
          }
          modalInstance.destroy();
          if (onDiscard) {
            onDiscard();
          }
        }}
        onExplore={() => {
          if (isDismissChecked && typeof window !== "undefined") {
            localStorage.setItem("idh_dismiss_idc_access_warning", "true");
          }
          modalInstance.destroy();
          if (onExplore) {
            onExplore();
          } else if (navigate) {
            navigate("/academy/overview");
          } else if (typeof window !== "undefined") {
            window.location.href = "/academy/overview";
          }
        }}
      />
    ),
  });

  return modalInstance;
};
