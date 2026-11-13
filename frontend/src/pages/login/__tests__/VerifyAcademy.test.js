import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VerifyAcademy from "../VerifyAcademy";
import { api } from "../../../lib";

jest.mock("../../../lib/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe("VerifyAcademy Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (
    initialEntries = ["/verify-academy?token=valid_token_123"]
  ) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <VerifyAcademy />
      </MemoryRouter>
    );

  it("FE-VER-01: renders loading spinner while token verification is pending", () => {
    api.get.mockReturnValue(new Promise(() => {})); // Never resolves to capture loading
    renderComponent();

    expect(screen.getByTestId("verify-loading")).toBeInTheDocument();
    expect(
      screen.getByText("Verifying your Living Income Academy account...")
    ).toBeInTheDocument();
  });

  it("FE-VER-02: shows error state when token query parameter is missing", async () => {
    renderComponent(["/verify-academy"]);

    await waitFor(() => {
      expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
      expect(
        screen.getByText("Verification token is missing.")
      ).toBeInTheDocument();
    });
    expect(api.get).not.toHaveBeenCalled();
  });

  it("FE-VER-03: renders success view when token verification succeeds", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        message: "Account verified successfully. You may now log in.",
        verified: true,
      },
    });

    renderComponent(["/verify-academy?token=valid_token_123"]);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("user/verify-academy", {
        params: { token: "valid_token_123" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("verify-success")).toBeInTheDocument();
      expect(
        screen.getByText("Account Verified Successfully!")
      ).toBeInTheDocument();
      expect(screen.getByTestId("button-go-login")).toBeInTheDocument();
    });
  });

  it("FE-VER-04: renders error view when token verification fails with 400 Bad Request", async () => {
    api.get.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: "Invalid or expired verification token." },
      },
    });

    renderComponent(["/verify-academy?token=expired_token"]);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("user/verify-academy", {
        params: { token: "expired_token" },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
      expect(
        screen.getByText("Invalid or expired verification token.")
      ).toBeInTheDocument();
      expect(screen.getByTestId("button-back-register")).toBeInTheDocument();
      expect(screen.getByTestId("button-back-login")).toBeInTheDocument();
    });
  });

  it("FE-VER-05: shows error state when token query parameter is whitespace only", async () => {
    renderComponent(["/verify-academy?token=%20%20%20"]);

    await waitFor(() => {
      expect(screen.getByTestId("verify-error")).toBeInTheDocument();
      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
      expect(
        screen.getByText("Verification token is missing.")
      ).toBeInTheDocument();
    });
    expect(api.get).not.toHaveBeenCalled();
  });
});
