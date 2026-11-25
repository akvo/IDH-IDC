import React, { useState, useEffect } from "react";
import { Alert, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
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

export const getProfileAlertStorageKey = (userId) =>
  `idc_profile_alert_dismissed_${userId}`;

const IncompleteProfileAlert = ({
  user = null,
  showActionLink = true,
  className = "",
  style = {},
}) => {
  const storeUser = UserState.useState((s) => s);
  const { pathname } = useLocation();
  // Stay in the Academy shell when reminded from inside the Academy
  const profilePath = pathname.startsWith(routePath.academy.landing)
    ? routePath.academy.profile
    : routePath.profile;
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
      message={
        <div className="incomplete-profile-alert__content">
          <span className="incomplete-profile-alert__title">
            Please complete your profile.
          </span>{" "}
          <span className="incomplete-profile-alert__subtitle">
            A few details are missing.
          </span>
        </div>
      }
      action={
        <div className="incomplete-profile-alert__actions">
          {showActionLink && (
            <Link
              to={`${profilePath}?edit=1`}
              data-testid="link-complete-profile"
              className="incomplete-profile-alert__action"
            >
              Complete now
            </Link>
          )}
          <Button
            type="text"
            size="small"
            onClick={handleClose}
            data-testid="btn-skip-profile-alert"
            className="incomplete-profile-alert__skip"
          >
            Skip
          </Button>
        </div>
      }
      className={`incomplete-profile-alert ${className}`.trim()}
      style={style}
    />
  );
};

export default IncompleteProfileAlert;
