import React from "react";
import SignInSecurityCard from "./components/SignInSecurityCard";
import DeleteAccountCard from "./components/DeleteAccountCard";
import "./AcademySettingsPage.scss";

// Learner account security: password change and account deletion
const AcademySettingsPage = () => (
  <div className="academy-settings" data-testid="academy-settings">
    <SignInSecurityCard />
    <DeleteAccountCard />
  </div>
);

export default AcademySettingsPage;
