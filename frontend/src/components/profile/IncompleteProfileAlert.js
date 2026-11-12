import React, { useState, useEffect } from "react";
import { Alert } from "antd";
import { Link } from "react-router-dom";
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
  const tools = Array.isArray(userState.tools) ? userState.tools : [];
  const companyName = userState.company_name
    ? String(userState.company_name).trim()
    : "";
  if (tools.includes("idc")) {
    return !userState.company && !companyName;
  }
  const profileCompanyName = userState.user_profile?.company_name
    ? String(userState.user_profile.company_name).trim()
    : "";
  return !profileCompanyName && !companyName;
};

export const getProfileAlertStorageKey = (userId) =>
  `idc_profile_alert_dismissed_${userId}`;

const IncompleteProfileAlert = ({
  user = null,
  showActionLink = true,
  className = "",
  style = {},
}) => {
  const storeUser = UserState.useState((s) => s);
  const userState = user || storeUser;
  const userId = userState?.id;
  const [dismissed, setDismissed] = useState(() => {
    if (!userId) {
      return false;
    }
    try {
      return (
        window.localStorage?.getItem(getProfileAlertStorageKey(userId)) ===
        "true"
      );
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (!userId) {
      setDismissed(false);
      return;
    }
    try {
      const isDismissed =
        window.localStorage?.getItem(getProfileAlertStorageKey(userId)) ===
        "true";
      setDismissed(isDismissed);
    } catch (e) {
      setDismissed(false);
    }
  }, [userId]);

  const handleClose = () => {
    if (userId) {
      try {
        window.localStorage?.setItem(getProfileAlertStorageKey(userId), "true");
      } catch (e) {
        // ignore localStorage errors
      }
    }
    setDismissed(true);
  };

  const isIncomplete = isUserProfileIncomplete(userState);

  if (!isIncomplete || dismissed) {
    return null;
  }

  return (
    <Alert
      data-testid="incomplete-profile-alert"
      type="info"
      showIcon
      closable
      message="Complete your profile"
      description={
        <span>
          Please complete your full name and organization details.
          {showActionLink && (
            <>
              {" "}
              <Link to={routePath.profile}>Complete Profile &rarr;</Link>
            </>
          )}
        </span>
      }
      onClose={handleClose}
      className={`incomplete-profile-alert ${className}`.trim()}
      style={style}
    />
  );
};

export default IncompleteProfileAlert;
