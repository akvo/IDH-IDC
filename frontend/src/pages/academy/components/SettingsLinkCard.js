import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

// Bottom card of My profile pointing to password and account settings
// (Figma 13018:15302)
const SettingsLinkCard = ({ settingsPath }) => {
  const navigate = useNavigate();
  return (
    <div
      className="academy-account-card academy-account-card--link"
      data-testid="settings-link-card"
    >
      <div className="academy-account-card__header">
        <h2 className="academy-account-card__title">Settings</h2>
        <p className="academy-account-card__subtitle">
          Change password or delete account
        </p>
      </div>
      <Button
        className="academy-account-card__link-btn"
        data-testid="btn-to-settings"
        onClick={() => navigate(settingsPath)}
      >
        To settings
      </Button>
    </div>
  );
};

export default SettingsLinkCard;
