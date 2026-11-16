import React from "react";
import { Button } from "antd";

const AccountHeroBanner = ({
  initials,
  fullName,
  email,
  isEditing = false,
  saving = false,
  onEdit,
  onCancel,
  onSave,
  onContinue,
}) => {
  return (
    <section className="account-hero-banner" data-testid="account-hero-banner">
      <div className="account-hero-banner__graphic" aria-hidden="true" />
      <div className="account-hero-banner__body">
        <div
          className="account-hero-banner__avatar"
          data-testid="account-hero-avatar"
        >
          {initials}
        </div>
        <div className="account-hero-banner__info">
          <h1
            className="account-hero-banner__name"
            data-testid="account-hero-name"
          >
            {fullName}
          </h1>
          <p
            className="account-hero-banner__email"
            data-testid="account-hero-email"
          >
            {email}
          </p>
        </div>
        <div className="account-hero-banner__actions">
          {!isEditing ? (
            <Button
              className="account-hero-banner__edit-btn"
              data-testid="btn-edit-profile"
              onClick={onEdit}
            >
              Edit profile
            </Button>
          ) : (
            <>
              <Button
                className="account-hero-banner__cancel-btn"
                data-testid="btn-cancel-profile"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="account-hero-banner__save-btn"
                data-testid="btn-save-profile"
                onClick={onSave}
                loading={saving}
              >
                Save changes
              </Button>
            </>
          )}
          <Button
            type="primary"
            className="account-hero-banner__continue-btn"
            data-testid="btn-continue-learning"
            onClick={onContinue}
          >
            Continue learning
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AccountHeroBanner;
