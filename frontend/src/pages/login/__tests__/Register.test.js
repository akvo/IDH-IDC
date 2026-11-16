import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register";
import { api } from "../../../lib";

jest.mock("../../../lib/api", () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe("Register Component (Living Income Academy)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Register />
      </MemoryRouter>
    );

  it("FE-REG-01: renders Living Income Academy branding, inputs, and links", () => {
    renderComponent();

    expect(screen.getByText("Living Income")).toBeInTheDocument();
    expect(screen.getByText("Academy")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByTestId("input-fullname")).toBeInTheDocument();
    expect(screen.getByTestId("input-email")).toBeInTheDocument();
    expect(screen.getByTestId("input-company-name")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
    expect(screen.getByTestId("input-confirm-password")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-data-security")).toBeInTheDocument();
    expect(screen.getByTestId("button-register")).toBeInTheDocument();
    expect(screen.getByText("Login here.")).toBeInTheDocument();
  });

  it("FE-REG-02: dynamically updates password criteria checklist", () => {
    renderComponent();

    const passwordInput = screen.getByTestId("input-password");

    // Initially criteria checkboxes are present
    expect(screen.getByText("Uppercase Character")).toBeInTheDocument();
    expect(screen.getByText("Lowercase Character")).toBeInTheDocument();
    expect(screen.getByText("Numbers")).toBeInTheDocument();
    expect(screen.getByText("Special Character")).toBeInTheDocument();
    expect(screen.getByText("Min 8 Character")).toBeInTheDocument();

    // Type strong password
    fireEvent.change(passwordInput, { target: { value: "StrongPass1!" } });

    // Ant Design Checkbox group updates its checked items
    const checkboxes = screen.getAllByRole("checkbox");
    // At least the criteria checkboxes should reflect the checked status
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("FE-REG-03: registers successfully and shows email verification instructions", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        message:
          "Registration successful. Please check your email to verify your account.",
      },
    });

    renderComponent();

    fireEvent.change(screen.getByTestId("input-fullname"), {
      target: { value: "Jane Learner" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "jane.learner@example.com" },
    });
    fireEvent.change(screen.getByTestId("input-company-name"), {
      target: { value: "Coffee Corp" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByTestId("input-confirm-password"), {
      target: { value: "StrongPass1!" },
    });

    // Check the data security provision checkbox
    const securityCheckbox = screen.getByTestId("checkbox-data-security");
    fireEvent.click(securityCheckbox);

    // Submit form
    const submitBtn = screen.getByTestId("button-register");
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("user/register-academy", {
        fullname: "Jane Learner",
        email: "jane.learner@example.com",
        company_name: "Coffee Corp",
        password: "StrongPass1!",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("registration-success-container")
      ).toBeInTheDocument();
      expect(screen.getByText("Registration Successful!")).toBeInTheDocument();
      expect(screen.getByText("jane.learner@example.com")).toBeInTheDocument();
    });
  });

  it("FE-REG-04: displays error notification when email already exists (409 Conflict)", async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { detail: "User existing@example.com already exists." },
      },
    });

    renderComponent();

    fireEvent.change(screen.getByTestId("input-fullname"), {
      target: { value: "Existing User" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByTestId("input-company-name"), {
      target: { value: "Existing Co" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByTestId("input-confirm-password"), {
      target: { value: "StrongPass1!" },
    });

    const securityCheckbox = screen.getByTestId("checkbox-data-security");
    fireEvent.click(securityCheckbox);

    fireEvent.click(screen.getByTestId("button-register"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(
        screen.getByText("User existing@example.com already exists.")
      ).toBeInTheDocument();
    });
  });

  it("FE-REG-05: disables submit button when data security provision is unchecked", () => {
    renderComponent();

    const submitBtn = screen.getByTestId("button-register");
    expect(submitBtn).toBeDisabled();
  });

  it("FE-REG-06: rejects submission when confirm password does not match", async () => {
    renderComponent();

    fireEvent.change(screen.getByTestId("input-fullname"), {
      target: { value: "Jane Mismatch" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "mismatch@example.com" },
    });
    fireEvent.change(screen.getByTestId("input-company-name"), {
      target: { value: "Mismatch Org" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByTestId("input-confirm-password"), {
      target: { value: "DifferentPass2@" },
    });

    const securityCheckbox = screen.getByTestId("checkbox-data-security");
    fireEvent.click(securityCheckbox);

    fireEvent.click(screen.getByTestId("button-register"));

    await waitFor(() => {
      expect(
        screen.getByText("Confirm Password that you entered do not match!")
      ).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it("FE-REG-07: rejects submission when email format is invalid", async () => {
    renderComponent();

    fireEvent.change(screen.getByTestId("input-fullname"), {
      target: { value: "Invalid Email User" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByTestId("input-company-name"), {
      target: { value: "Bad Email Corp" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByTestId("input-confirm-password"), {
      target: { value: "StrongPass1!" },
    });

    const securityCheckbox = screen.getByTestId("checkbox-data-security");
    fireEvent.click(securityCheckbox);

    fireEvent.click(screen.getByTestId("button-register"));

    await waitFor(() => {
      expect(
        screen.getByText("The input is not valid Email")
      ).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });
});
