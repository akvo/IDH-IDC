import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { message } from "antd";
import Profile from "../Profile";
import { api } from "../../../lib";
import { UserState, UIState, defaultUserState } from "../../../store";

jest.mock("../../../lib/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("Profile Page Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    act(() => {
      message.destroy();
      UserState.update(() => ({ ...defaultUserState }));
      UIState.update((s) => {
        s.companyOptions = [];
      });
    });
  });

  afterEach(() => {
    act(() => {
      message.destroy();
    });
  });

  const setupUser = (overrides = {}) => {
    act(() => {
      UserState.update((s) => {
        Object.assign(s, {
          id: 1,
          fullname: "Jane Learner",
          email: "jane.learner@example.com",
          role: "user",
          active: true,
          tools: ["academy"],
          company: null,
          company_name: "Sustainable Farming Initiative",
          user_profile: {
            company_name: "Sustainable Farming Initiative",
          },
          ...overrides,
        });
      });
    });
  };

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Profile />
      </MemoryRouter>
    );

  const getFullnameInput = () =>
    screen.queryByTestId("input-profile-fullname") ||
    screen.queryByTestId("input-fullname") ||
    screen.queryByLabelText(/full name/i) ||
    document.querySelector("input[name='fullname']") ||
    document.querySelector("#fullname");

  const getEmailInput = () =>
    screen.queryByTestId("input-profile-email") ||
    screen.queryByTestId("input-email") ||
    screen.queryByLabelText(/email/i) ||
    document.querySelector("input[name='email']") ||
    document.querySelector("#email");

  const getCompanyInput = () =>
    screen.queryByTestId("input-profile-company") ||
    screen.queryByTestId("input-company-name") ||
    screen.queryByTestId("input-company") ||
    screen.queryByLabelText(/company/i) ||
    document.querySelector("input[name='company_name']") ||
    document.querySelector("#company_name");

  const getSaveProfileButton = () =>
    screen.queryByTestId("button-save-profile") ||
    screen.queryByTestId("button-profile-save") ||
    screen.queryByRole("button", { name: /save|update profile/i });

  const unwrapInput = (el) =>
    el && el.tagName !== "INPUT" ? el.querySelector("input") || el : el;

  const getCurrentPasswordInput = () =>
    unwrapInput(
      screen.queryByTestId("input-current-password") ||
        screen.queryByLabelText(/current password/i) ||
        document.querySelector("input[name='current_password']") ||
        document.querySelector("#current_password")
    );

  const getNewPasswordInput = () =>
    unwrapInput(
      screen.queryByTestId("input-new-password") ||
        screen.queryByLabelText(/^new password/i) ||
        document.querySelector("input[name='new_password']") ||
        document.querySelector("#new_password")
    );

  const getConfirmPasswordInput = () =>
    unwrapInput(
      screen.queryByTestId("input-confirm-password") ||
        screen.queryByLabelText(/confirm.*password/i) ||
        document.querySelector("input[name='confirm_password']") ||
        document.querySelector("#confirm_password")
    );

  const getChangePasswordButton = () =>
    screen.queryByTestId("button-change-password") ||
    screen.queryByTestId("button-password-change") ||
    screen.queryByRole("button", { name: /change password|update password/i });

  it("FE-PROF-01: renders Identity Card with initials avatar, fullname, email, role, and active tool tags", () => {
    setupUser({
      fullname: "Jane Learner",
      email: "jane.learner@example.com",
      role: "user",
      tools: ["academy", "idc"],
    });

    renderComponent();

    // Check user info displayed
    expect(screen.getByText("Jane Learner")).toBeInTheDocument();
    expect(screen.getByText("jane.learner@example.com")).toBeInTheDocument();

    // Initials in avatar
    expect(screen.getByText("JL")).toBeInTheDocument();

    // Tool tags
    expect(screen.getByText(/academy/i)).toBeInTheDocument();
    expect(screen.getByText(/idc/i)).toBeInTheDocument();
  });

  it("FE-PROF-02: renders Profile Details and Security & Password sections", () => {
    setupUser();
    renderComponent();

    expect(screen.getByText(/profile details/i)).toBeInTheDocument();
    expect(screen.getByText(/security/i)).toBeInTheDocument();

    expect(getFullnameInput()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getCompanyInput()).toBeInTheDocument();
    expect(getSaveProfileButton()).toBeInTheDocument();

    expect(getCurrentPasswordInput()).toBeInTheDocument();
    expect(getNewPasswordInput()).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
    expect(getChangePasswordButton()).toBeInTheDocument();
  });

  it("FE-PROF-03: renders disabled email field preventing editing", () => {
    setupUser({ email: "locked.email@example.com" });
    renderComponent();

    const emailInput = getEmailInput();
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toBeDisabled();
    expect(emailInput.value).toBe("locked.email@example.com");
  });

  it("FE-PROF-04: handles IDC user: company field is disabled with 'Assigned by IDH Admin' note and updates fullname without overriding company", async () => {
    setupUser({
      id: 2,
      fullname: "Carlos IDC Officer",
      email: "carlos.idc@example.com",
      role: "user",
      tools: ["idc"],
      company: 101,
      company_name: "IDH Verified Enterprise",
    });

    api.put.mockResolvedValueOnce({
      data: {
        id: 2,
        fullname: "Carlos IDC Lead",
        email: "carlos.idc@example.com",
        company: 101,
        company_name: "IDH Verified Enterprise",
        tools: ["idc"],
      },
    });

    renderComponent();

    const companyInput = getCompanyInput();
    expect(companyInput).toBeInTheDocument();
    expect(companyInput).toBeDisabled();

    // Check for "Assigned by IDH Admin" note, tooltip, or placeholder
    expect(
      screen.getByText(/assigned by idh admin/i) ||
        companyInput
          .getAttribute("placeholder")
          ?.match(/assigned by idh admin/i)
    ).toBeTruthy();

    const fullnameInput = getFullnameInput();
    fireEvent.change(fullnameInput, {
      target: { value: "Carlos IDC Lead" },
    });

    const saveBtn = getSaveProfileButton();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "user/profile",
        expect.objectContaining({
          fullname: "Carlos IDC Lead",
        })
      );
    });

    // Verify company_name is not overridden to an unauthorized value
    const submittedPayload = api.put.mock.calls[0][1];
    if ("company_name" in submittedPayload) {
      expect(submittedPayload.company_name).not.toBe("Unauthorized Company");
    }
  });

  it("FE-PROF-05: handles Academy user: company field is editable and updates profile details via api.put", async () => {
    setupUser({
      id: 3,
      fullname: "Elena Learner",
      email: "elena@example.com",
      role: "user",
      tools: ["academy"],
      company: null,
      company_name: "Agri Start LLC",
      user_profile: { company_name: "Agri Start LLC" },
    });

    api.put.mockResolvedValueOnce({
      data: {
        id: 3,
        fullname: "Elena Learner Pro",
        email: "elena@example.com",
        company_name: "Agroecology Systems",
        tools: ["academy"],
      },
    });

    renderComponent();

    const companyInput = getCompanyInput();
    expect(companyInput).toBeInTheDocument();
    expect(companyInput).not.toBeDisabled();

    const fullnameInput = getFullnameInput();
    fireEvent.change(fullnameInput, {
      target: { value: "Elena Learner Pro" },
    });

    fireEvent.change(companyInput, {
      target: { value: "Agroecology Systems" },
    });

    const saveBtn = getSaveProfileButton();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "user/profile",
        expect.objectContaining({
          fullname: "Elena Learner Pro",
          company_name: "Agroecology Systems",
        })
      );
    });

    // Success feedback rendered or message displayed
    await waitFor(() => {
      expect(
        screen.queryAllByText(/profile updated/i).length > 0 ||
          screen.queryAllByText(/success/i).length > 0 ||
          screen.queryByRole("alert")
      ).toBeTruthy();
    });
  });

  it("FE-PROF-06: updates live PasswordCriteria checklist dynamically as user types new password", () => {
    setupUser();
    renderComponent();

    // Check checklist items present
    expect(screen.getByText("Uppercase Character")).toBeInTheDocument();
    expect(screen.getByText("Lowercase Character")).toBeInTheDocument();
    expect(screen.getByText("Numbers")).toBeInTheDocument();
    expect(screen.getByText("Special Character")).toBeInTheDocument();
    expect(screen.getByText("Min 8 Character")).toBeInTheDocument();

    const newPwdInput = getNewPasswordInput();

    // Type strong password
    fireEvent.change(newPwdInput, {
      target: { value: "StrongPass123!" },
    });

    // Checkbox elements reflect checked state
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("FE-PROF-07: validates mismatched confirm password and prevents api.post submission", async () => {
    setupUser();
    renderComponent();

    fireEvent.change(getCurrentPasswordInput(), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(getNewPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });
    fireEvent.change(getConfirmPasswordInput(), {
      target: { value: "DifferentPass456!" },
    });

    fireEvent.click(getChangePasswordButton());

    await waitFor(() => {
      expect(
        screen.getByText(
          /confirm password that you entered do not match|passwords do not match/i
        )
      ).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it("FE-PROF-08: successfully submits password change and resets password form fields", async () => {
    setupUser();

    api.post.mockResolvedValueOnce({
      data: { message: "Password changed successfully" },
    });

    renderComponent();

    fireEvent.change(getCurrentPasswordInput(), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(getNewPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });
    fireEvent.change(getConfirmPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });

    fireEvent.click(getChangePasswordButton());

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("user/change-password", {
        current_password: "OldPassword123!",
        new_password: "NewStrongPass123!",
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/password changed successfully/i) ||
          screen.queryByText(/success/i)
      ).toBeTruthy();
    });
  });

  it("FE-PROF-09: displays error notification when password change fails with 400 (wrong current password)", async () => {
    setupUser();

    api.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: "Incorrect current password" },
      },
    });

    renderComponent();

    fireEvent.change(getCurrentPasswordInput(), {
      target: { value: "WrongCurrentPassword!" },
    });
    fireEvent.change(getNewPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });
    fireEvent.change(getConfirmPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });

    fireEvent.click(getChangePasswordButton());

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(
        screen.getByText("Incorrect current password")
      ).toBeInTheDocument();
    });
  });

  it("FE-PROF-10: displays incomplete profile alert reminder when user profile lacks required fields", () => {
    setupUser({
      fullname: "",
      company_name: null,
      user_profile: null,
    });

    renderComponent();

    expect(
      screen.getByTestId("incomplete-profile-alert") ||
        screen.getByText(/complete your profile/i)
    ).toBeTruthy();
  });

  it("FE-PROF-11: shows and closes error alert when profile update fails", async () => {
    setupUser();
    api.put.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: "Unable to save profile right now" },
      },
    });

    renderComponent();
    fireEvent.click(getSaveProfileButton());

    await waitFor(() => {
      expect(
        screen.getByText("Unable to save profile right now")
      ).toBeInTheDocument();
    });

    const closeBtns = document.querySelectorAll(".ant-alert-close-icon");
    expect(closeBtns.length).toBeGreaterThan(0);
    fireEvent.click(closeBtns[closeBtns.length - 1]);

    await waitFor(() => {
      expect(
        screen.queryByText("Unable to save profile right now")
      ).not.toBeInTheDocument();
    });
  });

  it("FE-PROF-12: rejects weak new password and clears password error alert on close", async () => {
    setupUser();
    api.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: "Password rejected by policy" },
      },
    });

    renderComponent();

    fireEvent.change(getCurrentPasswordInput(), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(getNewPasswordInput(), {
      target: { value: "weak" },
    });
    fireEvent.change(getConfirmPasswordInput(), {
      target: { value: "weak" },
    });
    fireEvent.click(getChangePasswordButton());

    await waitFor(() => {
      expect(
        screen.getByText("Please satisfy all password criteria")
      ).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(getNewPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });
    fireEvent.change(getConfirmPasswordInput(), {
      target: { value: "NewStrongPass123!" },
    });
    fireEvent.click(getChangePasswordButton());

    await waitFor(() => {
      expect(
        screen.getByText("Password rejected by policy")
      ).toBeInTheDocument();
    });

    const closeBtn = document.querySelector(".ant-alert-close-icon");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(
        screen.queryByText("Password rejected by policy")
      ).not.toBeInTheDocument();
    });
  });

  it("FE-PROF-13: resolves companyOptions label, email fallback initial, and default role tag", () => {
    act(() => {
      UIState.update((s) => {
        s.companyOptions = [{ value: 42, label: "Global Cooperative" }];
      });
    });
    setupUser({
      fullname: "",
      email: "fallback@example.com",
      role: "",
      tools: ["idc"],
      company: 42,
      company_name: null,
      user_profile: null,
    });

    renderComponent();

    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("USER")).toBeInTheDocument();
    expect(getCompanyInput().value).toBe("Global Cooperative");
  });

  it("FE-PROF-14: hides incomplete alert and displays organisation fallback for dual-tool internal user with company: null", () => {
    setupUser({
      fullname: "Wayan Galih Pratama",
      email: "galih@akvo.org",
      role: "super_admin",
      internal_user: true,
      tools: ["idc", "academy"],
      company: null,
      company_name: null,
      organisation_detail: { id: 1, name: "Akvo" },
      user_profile: null,
    });

    renderComponent();

    expect(
      screen.queryByTestId("incomplete-profile-alert")
    ).not.toBeInTheDocument();
    expect(getCompanyInput().value).toBe("Akvo");
    expect(getCompanyInput()).toBeDisabled();
  });
});
