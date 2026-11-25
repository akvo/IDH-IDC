import React from "react";
import "./AccountShell.scss";

// Grey canvas with a white content panel, matching the Academy shell
// without its sidebar. Hosts the shared account pages (My profile,
// Settings) when they are opened outside the Academy.
const AccountShell = ({ children }) => (
  <div className="account-shell" data-testid="account-shell">
    <div className="account-shell-content">{children}</div>
  </div>
);

export default AccountShell;
