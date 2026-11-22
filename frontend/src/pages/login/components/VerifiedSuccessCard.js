import React from "react";
import { Button } from "antd";
import VerifiedIllustration from "../../../assets/images/account-verified-illustration.png";

const VerifiedSuccessCard = ({ onProceedToLogin }) => {
  return (
    <div className="verified-success-card" data-testid="verified-success-card">
      <div className="verified-illustration-wrapper">
        <img
          src={VerifiedIllustration}
          alt="Your account is verified"
          className="verified-illustration"
          data-testid="verified-illustration"
        />
      </div>
      <h1 className="verified-title" data-testid="verified-title">
        Your account <br />
        is verified
      </h1>
      <Button
        type="primary"
        className="button-login button-verified"
        data-testid="button-verified-login"
        onClick={onProceedToLogin}
        size="large"
        block
      >
        Log in
      </Button>
    </div>
  );
};

export default VerifiedSuccessCard;
