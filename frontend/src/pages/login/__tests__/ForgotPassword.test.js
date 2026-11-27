import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "../ForgotPassword";
import { api } from "../../../lib";
import UserState from "../../../store/user";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../../../lib/api", () => ({
  post: jest.fn(),
}));

describe("ForgotPassword Component (Better Income Toolkit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UserState.update((s) => {
      s.id = null;
      s.active = null;
      s.isAuthenticated = false;
      s.authInitializing = false;
      s.tools = [];
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

  it("renders split-screen layout, logo, header subtitle, copy, and hero image", () => {
    renderComponent();

    expect(screen.getByTestId("forgot-password-container")).toBeInTheDocument();
    expect(screen.getByTestId("logo-image")).toBeInTheDocument();
    expect(
      screen.getByText("Toolkit Towards Better Incomes")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Forgot your password?" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter the email address of your Toolkit account\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We’ll send you a link to set a new password\./i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" })
    ).toBeInTheDocument();
    expect(screen.getByText("Back to log in")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-image")).toBeInTheDocument();
  });

  it("validates email requirement and does not submit when empty", async () => {
    renderComponent();

    const submitBtn = screen.getByRole("button", { name: "Send reset link" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Please input your email!")).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("submits email request and renders Figma Check your email screen with illustration and resend actions", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        message:
          "If this email is registered, a password reset link has been sent.",
      },
    });

    renderComponent();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    fireEvent.change(emailInput, {
      target: { value: "practitioner@example.com" },
    });

    const submitBtn = screen.getByRole("button", { name: "Send reset link" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "user/forgot-password",
        expect.any(FormData)
      );
    });

    const payload = api.post.mock.calls[0][1];
    expect(payload.get("email")).toBe("practitioner@example.com");

    await waitFor(() => {
      expect(screen.getByTestId("check-email-container")).toBeInTheDocument();
      expect(
        screen.getByTestId("check-email-illustration")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Check your email" })
      ).toBeInTheDocument();
      expect(screen.getByText("practitioner@example.com")).toBeInTheDocument();
      expect(screen.getByText("30 minutes")).toBeInTheDocument();
      expect(screen.getByTestId("button-back-to-login")).toBeInTheDocument();
      expect(screen.getByTestId("button-resend-link")).toBeInTheDocument();
      expect(
        screen.getByTestId("forgot-password-success-toast")
      ).toBeInTheDocument();
    });

    // Test resend link action
    api.post.mockResolvedValueOnce({
      data: { message: "Resent successfully" },
    });

    const resendBtn = screen.getByTestId("button-resend-link");
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(2);
      expect(api.post.mock.calls[1][0]).toBe("user/forgot-password");
      expect(api.post.mock.calls[1][1].get("email")).toBe(
        "practitioner@example.com"
      );
    });
  });

  it("displays uniform confirmation screen even when backend returns an error (anti-enumeration)", async () => {
    api.post.mockRejectedValueOnce(new Error("Network Error"));

    renderComponent();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    fireEvent.change(emailInput, {
      target: { value: "unknown@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "user/forgot-password",
        expect.any(FormData)
      );
      expect(screen.getByTestId("check-email-container")).toBeInTheDocument();
      expect(screen.getByText("unknown@example.com")).toBeInTheDocument();
    });
  });

  it("redirects authenticated users to their dashboard", () => {
    UserState.update((s) => {
      s.isAuthenticated = true;
      s.authInitializing = false;
      s.tools = ["idc"];
    });

    renderComponent();

    expect(mockNavigate).toHaveBeenCalledWith(
      "/income-driver-calculator/welcome",
      { replace: true }
    );
  });
});
