import React, { useState, useEffect } from "react";
import { Button, Checkbox, Modal } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { UserState } from "../../store";
import { routePath } from "../route";
import "./IncompleteProfileAlert.scss";

export const isUserProfileIncomplete = (userState) => {
  if (!userState?.id) {
    return false;
  }
  const fullname = userState.fullname ? String(userState.fullname).trim() : "";
  if (!fullname) {
    return true;
  }
  const companyName = userState.company_name
    ? String(userState.company_name).trim()
    : "";
  const profileCompanyName = userState.user_profile?.company_name
    ? String(userState.user_profile.company_name).trim()
    : "";
  const internalOrgName =
    userState.internal_user && userState.organisation_detail?.name
      ? String(userState.organisation_detail.name).trim()
      : "";

  return Boolean(
    !userState.company &&
      !companyName &&
      !profileCompanyName &&
      !internalOrgName
  );
};

// "Don't show again": hides the reminder for good
export const getProfileAlertStorageKey = (userId) =>
  `idc_profile_alert_dismissed_${userId}`;

// Skip: hides the reminder until the next login
export const getProfileAlertSessionKey = (userId) =>
  `idc_profile_alert_skipped_${userId}`;

const readFlag = (storage, key) => {
  try {
    return window[storage]?.getItem(key) === "true";
  } catch (e) {
    return false;
  }
};

const writeFlag = (storage, key) => {
  try {
    window[storage]?.setItem(key, "true");
  } catch (e) {
    // ignore storage errors
  }
};

const isDismissedFor = (userId) =>
  Boolean(userId) &&
  (readFlag("localStorage", getProfileAlertStorageKey(userId)) ||
    readFlag("sessionStorage", getProfileAlertSessionKey(userId)));

// Post-login reminder for users with missing profile details, shown as a
// popup in both tools ("missing details" design)
const IncompleteProfileAlert = ({ user = null, className = "" }) => {
  const storeUser = UserState.useState((s) => s);
  const userState = user || storeUser;
  const userId = userState?.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Stay in the Academy shell when reminded from inside the Academy
  const profilePath = pathname.startsWith(routePath.academy.landing)
    ? routePath.academy.profile
    : routePath.profile;
  const [dismissed, setDismissed] = useState(() => isDismissedFor(userId));
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    setDismissed(isDismissedFor(userId));
  }, [userId]);

  const dismiss = () => {
    if (userId) {
      writeFlag("sessionStorage", getProfileAlertSessionKey(userId));
      if (dontShowAgain) {
        writeFlag("localStorage", getProfileAlertStorageKey(userId));
      }
    }
    setDismissed(true);
  };

  const handleCompleteNow = () => {
    dismiss();
    navigate(`${profilePath}?edit=1`);
  };

  const open = isUserProfileIncomplete(userState) && !dismissed;

  return (
    <Modal
      open={open}
      centered
      closable={false}
      footer={null}
      width={624}
      onCancel={dismiss}
      // Blur the page behind the reminder (design)
      maskStyle={{
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(6px)",
      }}
      wrapClassName={`incomplete-profile-modal ${className}`.trim()}
    >
      <div
        className="incomplete-profile-modal__body"
        data-testid="incomplete-profile-alert"
      >
        <div className="incomplete-profile-modal__icon" aria-hidden="true">
          <WarningOutlined />
        </div>
        <div className="incomplete-profile-modal__content">
          <h2 className="incomplete-profile-modal__title">
            A few details are missing
          </h2>
          <p className="incomplete-profile-modal__text">
            Please complete your profile. A few details are missing.
          </p>
          <div className="incomplete-profile-modal__footer">
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              data-testid="checkbox-dont-show-again"
            >
              Don’t show again
            </Checkbox>
            <div className="incomplete-profile-modal__actions">
              <Button
                shape="round"
                size="large"
                onClick={dismiss}
                data-testid="btn-skip-profile-alert"
              >
                Skip
              </Button>
              <Button
                type="primary"
                shape="round"
                size="large"
                onClick={handleCompleteNow}
                data-testid="link-complete-profile"
              >
                Complete now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IncompleteProfileAlert;
