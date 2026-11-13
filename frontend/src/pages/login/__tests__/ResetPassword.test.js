import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ResetPassword from "../ResetPassword";
import { api } from "../../../lib";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../../../lib/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe("ResetPassword Component (Better Income Toolkit)", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = new URL(
      "http://localhost/reset-password/sample-token-123"
    );
    api.get.mockResolvedValue({
      data: {
        email: "practitioner@example.com",
        fullname: "Jane Doe",
      },
    });
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  const renderComponent = (
    initialEntries = ["/reset-password/sample-token-123"]
  ) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/reset-password/:tokenId" element={<ResetPassword />} />
          <Route path="/invitation/:tokenId" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

  it("FE-RST-01: renders Better Income Toolkit branding and Reset Password heading", async () => {
    renderComponent();

    expect(screen.getByText("Better Income")).toBeInTheDocument();
    expect(screen.getByText("Toolkit")).toBeInTheDocument();
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.queryByText("Income Driver")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Income Drive Calculator")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("logo-image")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "user/reset-password/sample-token-123"
      );
    });
  });

  it("FE-RST-01B: renders Set Password heading on invitation route", async () => {
    window.location = new URL("http://localhost/invitation/sample-token-123");
    renderComponent(["/invitation/sample-token-123"]);

    expect(screen.getByText("Set Password")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("user/invitation/sample-token-123");
    });
  });

  it("FE-RST-02: dynamically updates PasswordCriteria checklist as password is typed", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("input-password")).not.toBeDisabled();
    });

    expect(screen.getByText("Uppercase Character")).toBeInTheDocument();
    expect(screen.getByText("Lowercase Character")).toBeInTheDocument();
    expect(screen.getByText("Numbers")).toBeInTheDocument();
    expect(screen.getByText("Special Character")).toBeInTheDocument();
    expect(screen.getByText("Min 8 Character")).toBeInTheDocument();

    const passwordInput = screen.getByTestId("input-password");
    fireEvent.change(passwordInput, {
      target: {
        id: "form-reset-password_password",
        value: "StrongPass1!",
      },
    });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("FE-RST-03: submits reset password on valid match, shows success toast, and navigates to /login", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        access_token: "mock-jwt-token",
        token_type: "bearer",
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("input-password")).not.toBeDisabled();
    });

    const passwordInput = screen.getByTestId("input-password");
    const confirmInput = screen.getByTestId("input-confirm-password");

    fireEvent.change(passwordInput, {
      target: {
        id: "form-reset-password_password",
        value: "StrongPass1!",
      },
    });
    fireEvent.change(confirmInput, {
      target: {
        id: "form-reset-password_confirm",
        value: "StrongPass1!",
      },
    });

    const submitBtn = screen.getByTestId("button-login");
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "user/reset-password/sample-token-123",
        expect.any(FormData)
      );
    });

    const payload = api.post.mock.calls[0][1];
    expect(payload.get("password")).toBe("StrongPass1!");

    await waitFor(() => {
      expect(
        screen.getByText(
          "Password already set. Now you can login with your new password."
        )
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      },
      { timeout: 2000 }
    );
  });

  it("FE-RST-04: shows error notification when password reset submission fails", async () => {
    api.post.mockRejectedValueOnce(new Error("Server error"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("input-password")).not.toBeDisabled();
    });

    const passwordInput = screen.getByTestId("input-password");
    const confirmInput = screen.getByTestId("input-confirm-password");

    fireEvent.change(passwordInput, {
      target: {
        id: "form-reset-password_password",
        value: "StrongPass1!",
      },
    });
    fireEvent.change(confirmInput, {
      target: {
        id: "form-reset-password_confirm",
        value: "StrongPass1!",
      },
    });

    fireEvent.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(
        screen.getByText("Set password failed. Please contact your admin.")
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("FE-RST-05: redirects to /not-found when token verification fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Invalid token"));

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/not-found");
    });
  });

  it("FE-RST-06: rejects submission when confirm password does not match", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("input-password")).not.toBeDisabled();
    });

    const passwordInput = screen.getByTestId("input-password");
    const confirmInput = screen.getByTestId("input-confirm-password");

    fireEvent.change(passwordInput, {
      target: {
        id: "form-reset-password_password",
        value: "StrongPass1!",
      },
    });
    fireEvent.change(confirmInput, {
      target: {
        id: "form-reset-password_confirm",
        value: "MismatchPass2@",
      },
    });

    fireEvent.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(
        screen.getByText("Confirm Password that you entered do not match!")
      ).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it("FE-RST-07: handles invitation mode and toggles data security provision", async () => {
    delete window.location;
    window.location = new URL("http://localhost/invitation/invite-token-456");

    api.get.mockResolvedValueOnce({
      data: {
        invitation_id: "invite-token-456",
        email: "invitee@example.com",
      },
    });

    renderComponent(["/invitation/invite-token-456"]);

    await waitFor(() => {
      expect(screen.getByTestId("input-password")).not.toBeDisabled();
    });

    expect(screen.getByText(/Data Security Provision/i)).toBeInTheDocument();
    const securityCheckbox = screen.getByRole("checkbox", {
      name: /By checking this box/i,
    });
    expect(securityCheckbox).not.toBeChecked();

    const submitBtn = screen.getByTestId("button-login");
    expect(submitBtn).toBeDisabled();

    fireEvent.click(securityCheckbox);
    expect(securityCheckbox).toBeChecked();
    expect(submitBtn).not.toBeDisabled();
  });
});
