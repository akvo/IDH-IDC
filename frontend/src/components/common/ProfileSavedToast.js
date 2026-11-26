import React from "react";
import { notification } from "antd";
import { CheckSquareOutlined } from "@ant-design/icons";
import "./ProfileSavedToast.scss";

export const PROFILE_SAVED_TOAST_KEY = "profile-saved";

// "Changes saved" confirmation shown after saving My profile
// (Figma 13018:19695)
const ProfileSavedToast = () => (
  <div
    className="profile-saved-toast__content"
    data-testid="profile-saved-toast"
  >
    <CheckSquareOutlined className="profile-saved-toast__icon" />
    <span className="profile-saved-toast__title">Changes saved</span>{" "}
    <span className="profile-saved-toast__message">
      Your profile is updated!
    </span>
  </div>
);

export const showProfileSavedToast = () =>
  notification.open({
    key: PROFILE_SAVED_TOAST_KEY,
    message: <ProfileSavedToast />,
    placement: "top",
    duration: 4,
    closeIcon: null,
    className: "profile-saved-toast",
  });

export default ProfileSavedToast;
