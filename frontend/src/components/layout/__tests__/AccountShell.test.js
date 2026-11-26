import React from "react";
import { render, screen } from "@testing-library/react";
import AccountShell from "../AccountShell";

describe("AccountShell", () => {
  it("wraps the page in the content panel", () => {
    render(
      <AccountShell>
        <p>Profile content</p>
      </AccountShell>
    );

    expect(screen.getByTestId("account-shell")).toContainElement(
      screen.getByText("Profile content")
    );
  });
});
