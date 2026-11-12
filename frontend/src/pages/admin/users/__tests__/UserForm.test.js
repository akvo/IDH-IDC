import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { message } from "antd";
import UserForm from "../UserForm";
import { UserState, UIState } from "../../../../store";
import { api } from "../../../../lib";

jest.mock("../../../../lib/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("@piwikpro/react-piwik-pro", () => ({
  CustomEvent: {
    trackEvent: jest.fn(),
  },
}));

jest.setTimeout(15000);

const mockCompanyOptions = [
  { value: 42, label: "Global Agro" },
  { value: 99, label: "Sustainable Coffee Ltd" },
];

const academyOnlyUser = {
  id: 101,
  fullname: "Alice Academy",
  email: "alice.academy@example.com",
  role: "user",
  user_type: "external_regular",
  tools: ["academy"],
  active: true,
  company: null,
  business_units: [],
};

const idcUser = {
  id: 102,
  fullname: "Bob IDC",
  email: "bob.idc@example.com",
  role: "user",
  user_type: "external_regular",
  tools: ["idc", "academy"],
  active: true,
  company: 42,
  business_units: [],
};

describe("UserForm Component - Grant IDC Access & Company Linkage Workflow", () => {
  beforeAll(() => {
    global.window.master = {
      business_units: [
        { id: 1, name: "Cocoa Department" },
        { id: 2, name: "Coffee Department" },
      ],
    };
    global.window._paq = [];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      message.destroy();
      UserState.update((s) => {
        s.id = 1;
        s.fullname = "Super Admin User";
        s.email = "superadmin@idh.org";
        s.role = "super_admin";
        s.active = true;
        s.tools = ["idc", "academy"];
      });
      UIState.update((s) => {
        s.companyOptions = mockCompanyOptions;
      });
    });
  });

  afterEach(() => {
    act(() => {
      message.destroy();
    });
  });

  const renderComponent = (initialPath = "/admin/user/101") =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route exact path="/admin/user/new" element={<UserForm />} />
          <Route path="/admin/user/:userId" element={<UserForm />} />
        </Routes>
      </MemoryRouter>
    );

  const waitForFormReady = async () => {
    await waitFor(
      () => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(document.querySelector(".ant-spin")).not.toBeInTheDocument();
        expect(
          screen.queryByText("User Information") ||
            document.querySelector(".user-form-container")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  };

  it("renders Grant IDC Access switch ONLY when editing an existing user without IDC access", async () => {
    api.get.mockResolvedValueOnce({ data: academyOnlyUser });

    renderComponent("/admin/user/101");
    await waitForFormReady();

    await waitFor(() => {
      const grantSwitch =
        screen.queryByTestId("grant-idc-switch") ||
        screen.queryByRole("switch", { name: /grant idc/i });
      expect(grantSwitch).toBeInTheDocument();
      expect(grantSwitch).toHaveAttribute("aria-checked", "false");
    });

    expect(screen.getByText("Academy")).toBeInTheDocument();
  });

  it("does NOT render Grant IDC Access switch when creating a new user", async () => {
    renderComponent("/admin/user/new");
    await waitForFormReady();

    const grantSwitch =
      screen.queryByTestId("grant-idc-switch") ||
      screen.queryByRole("switch", { name: /grant idc/i });
    expect(grantSwitch).not.toBeInTheDocument();
  });

  it("does NOT render Grant IDC Access switch for user who already has IDC access", async () => {
    api.get.mockResolvedValueOnce({ data: idcUser });

    renderComponent("/admin/user/102");
    await waitForFormReady();

    const grantSwitch =
      screen.queryByTestId("grant-idc-switch") ||
      screen.queryByRole("switch", { name: /grant idc/i });
    expect(grantSwitch).not.toBeInTheDocument();
  });

  it("toggling Grant IDC switch reveals mandatory Company selector and blocks submit when empty", async () => {
    api.get.mockResolvedValueOnce({ data: academyOnlyUser });

    renderComponent("/admin/user/101");
    await waitForFormReady();

    const grantSwitch =
      screen.getByTestId("grant-idc-switch") ||
      screen.getByRole("switch", { name: /grant idc/i });

    act(() => {
      fireEvent.click(grantSwitch);
    });

    await waitFor(() => {
      expect(grantSwitch).toHaveAttribute("aria-checked", "true");
      expect(screen.getByLabelText("Company")).toBeInTheDocument();
    });

    const submitBtn =
      screen.queryByRole("button", { name: /save user|approve user/i }) ||
      document.querySelector("button[type='submit']");
    expect(submitBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Company is required")).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalledWith(
      expect.stringContaining("grant-idc"),
      expect.anything()
    );
  });

  it("selecting Company and submitting calls api.post('user/{id}/grant-idc') with company_id and user_type", async () => {
    api.get.mockResolvedValueOnce({ data: academyOnlyUser });
    api.put.mockResolvedValueOnce({
      data: { ...academyOnlyUser, active: true },
    });
    api.post.mockResolvedValueOnce({
      data: {
        ...academyOnlyUser,
        tools: ["academy", "idc"],
        company: 42,
      },
    });

    renderComponent("/admin/user/101");
    await waitForFormReady();

    const grantSwitch =
      screen.getByTestId("grant-idc-switch") ||
      screen.getByRole("switch", { name: /grant idc/i });

    act(() => {
      fireEvent.click(grantSwitch);
    });

    await waitFor(() => {
      expect(grantSwitch).toHaveAttribute("aria-checked", "true");
    });

    const companySelect =
      document.querySelector("#user-form_company")?.closest(".ant-select") ||
      document.querySelector("#company")?.closest(".ant-select") ||
      screen.getByLabelText("Company").closest(".ant-select");

    expect(companySelect).toBeInTheDocument();

    const selector =
      companySelect.querySelector(".ant-select-selector") || companySelect;
    fireEvent.mouseDown(selector);

    const option = await waitFor(() => {
      const opt =
        document.querySelector(
          ".ant-select-item-option[title='Global Agro']"
        ) ||
        screen.getByText("Global Agro", {
          selector: ".ant-select-item-option-content",
        });
      expect(opt).toBeInTheDocument();
      return opt;
    });

    act(() => {
      fireEvent.click(option);
    });

    const submitBtn =
      screen.queryByRole("button", { name: /save user|approve user/i }) ||
      document.querySelector("button[type='submit']");

    act(() => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringMatching(/user\/101\/grant-idc/),
        expect.objectContaining({
          company_id: 42,
          user_type: "external_regular",
        })
      );
    });
  });

  it("surfaces error feedback and keeps switch enabled when grant-idc API returns error", async () => {
    api.get.mockResolvedValueOnce({ data: academyOnlyUser });
    api.put.mockResolvedValueOnce({ data: { ...academyOnlyUser } });
    api.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: "User must be active and verified" },
      },
    });

    renderComponent("/admin/user/101");
    await waitForFormReady();

    const grantSwitch =
      screen.getByTestId("grant-idc-switch") ||
      screen.getByRole("switch", { name: /grant idc/i });

    act(() => {
      fireEvent.click(grantSwitch);
    });

    await waitFor(() => {
      expect(grantSwitch).toHaveAttribute("aria-checked", "true");
    });

    const companySelect =
      document.querySelector("#user-form_company")?.closest(".ant-select") ||
      document.querySelector("#company")?.closest(".ant-select") ||
      screen.getByLabelText("Company").closest(".ant-select");

    const selector =
      companySelect.querySelector(".ant-select-selector") || companySelect;
    fireEvent.mouseDown(selector);

    const option = await waitFor(() =>
      screen.getByText("Global Agro", {
        selector: ".ant-select-item-option-content",
      })
    );

    act(() => {
      fireEvent.click(option);
    });

    const submitBtn =
      screen.queryByRole("button", { name: /save user|approve user/i }) ||
      document.querySelector("button[type='submit']");

    act(() => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringMatching(/user\/101\/grant-idc/),
        expect.anything()
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /User must be active and verified|Failed! Something went wrong/i
        )
      ).toBeInTheDocument();
      expect(grantSwitch).toHaveAttribute("aria-checked", "true");
    });
  });

  it("editing base fields and IDC User Type calls sequential PUT then POST grant-idc", async () => {
    api.get.mockResolvedValueOnce({
      data: { ...academyOnlyUser, active: false },
    });
    api.put.mockResolvedValueOnce({
      data: { ...academyOnlyUser, active: true },
    });
    api.post.mockResolvedValueOnce({
      data: {
        ...academyOnlyUser,
        tools: ["academy", "idc"],
        company: 42,
        user_type: "external_advanced",
      },
    });

    renderComponent("/admin/user/101");
    await waitForFormReady();

    // Modify fullname to trigger baseChanged
    const fullnameInput = screen.getByLabelText("Fullname");
    act(() => {
      fireEvent.change(fullnameInput, { target: { value: "Alice Updated" } });
    });

    const grantSwitch = screen.getByTestId("grant-idc-switch");
    act(() => {
      fireEvent.click(grantSwitch);
    });

    await waitFor(() => {
      expect(grantSwitch).toHaveAttribute("aria-checked", "true");
    });

    // Select External Advanced for IDC User Type
    const idcTypeSelect = document
      .querySelector("#user-form_idc_user_type")
      ?.closest(".ant-select");
    expect(idcTypeSelect).toBeInTheDocument();
    fireEvent.mouseDown(idcTypeSelect.querySelector(".ant-select-selector"));
    const advOption = await waitFor(() =>
      screen.getByText("External Advanced", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(advOption);
    });

    // Select Company
    const companySelect = document
      .querySelector("#user-form_company")
      ?.closest(".ant-select");
    fireEvent.mouseDown(companySelect.querySelector(".ant-select-selector"));
    const companyOpt = await waitFor(() =>
      screen.getByText("Global Agro", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(companyOpt);
    });

    const submitBtn = document.querySelector("button[type='submit']");
    act(() => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "user/101?approved=true",
        expect.any(FormData)
      );
      expect(api.post).toHaveBeenCalledWith("user/101/grant-idc", {
        company_id: 42,
        user_type: "external_advanced",
      });
    });
  });

  it("saves existing IDC user without grant-idc and invites new user via standard form", async () => {
    // 1. Existing IDC user edit
    api.get.mockResolvedValueOnce({ data: idcUser });
    api.put.mockResolvedValueOnce({ data: idcUser });

    const { unmount } = renderComponent("/admin/user/102");
    await waitForFormReady();

    const submitEditBtn = document.querySelector("button[type='submit']");
    act(() => {
      fireEvent.click(submitEditBtn);
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("user/102", expect.any(FormData));
    });
    expect(api.post).not.toHaveBeenCalled();

    unmount();
    jest.clearAllMocks();

    // 2. New user invite flow with Role=user and User Type=external_regular + Company
    api.post.mockResolvedValueOnce({ data: { id: 200 } });
    renderComponent("/admin/user/new");
    await waitForFormReady();

    act(() => {
      fireEvent.change(screen.getByLabelText("Fullname"), {
        target: { value: "New Invite User" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "new.invite@example.com" },
      });
    });

    // Select Role = user
    const roleSelect = document
      .querySelector("#user-form_role")
      ?.closest(".ant-select");
    fireEvent.mouseDown(roleSelect.querySelector(".ant-select-selector"));
    const userRoleOpt = await waitFor(() =>
      screen.getByText("User", { selector: ".ant-select-item-option-content" })
    );
    act(() => {
      fireEvent.click(userRoleOpt);
    });

    // Select User Type = External Regular
    const userTypeSelect = await waitFor(() => {
      const el = document
        .querySelector("#user-form_user_type")
        ?.closest(".ant-select");
      expect(el).toBeInTheDocument();
      return el;
    });
    fireEvent.mouseDown(userTypeSelect.querySelector(".ant-select-selector"));
    const extRegOpt = await waitFor(() =>
      screen.getByText("External Regular", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(extRegOpt);
    });

    // Select Company
    const companySelect = await waitFor(() => {
      const el = document
        .querySelector("#user-form_company")
        ?.closest(".ant-select");
      expect(el).toBeInTheDocument();
      return el;
    });
    fireEvent.mouseDown(companySelect.querySelector(".ant-select-selector"));
    const compOpt = await waitFor(() =>
      screen.getByText("Global Agro", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(compOpt);
    });

    act(() => {
      fireEvent.click(document.querySelector("button[type='submit']"));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/user/register?invitation_id=true",
        expect.any(FormData)
      );
    });
  });

  describe("Revoke IDC Tool Access Flow", () => {
    it("renders 'Revoke IDC Access' button when editing user with idc in tools", async () => {
      api.get.mockResolvedValueOnce({ data: idcUser });

      renderComponent("/admin/user/102");

      await waitFor(() => {
        expect(screen.getByTestId("tool-access-card")).toBeInTheDocument();
      });

      expect(screen.getByTestId("revoke-idc-btn")).toBeInTheDocument();
      expect(
        screen.getByText("Revoke IDC Access", { selector: ".revoke-idc-label" })
      ).toBeInTheDocument();
      expect(screen.queryByTestId("grant-idc-switch")).not.toBeInTheDocument();
    });

    it("successfully revokes IDC access and transitions UI state", async () => {
      api.get.mockResolvedValueOnce({ data: idcUser });
      api.post.mockResolvedValueOnce({
        data: {
          ...idcUser,
          tools: ["academy"],
          company: null,
        },
      });

      renderComponent("/admin/user/102");

      const revokeBtn = await waitFor(() =>
        screen.getByTestId("revoke-idc-btn")
      );

      act(() => {
        fireEvent.click(revokeBtn);
      });

      // Confirm Popconfirm
      const confirmBtn = await waitFor(() =>
        screen.getByRole("button", { name: "Yes" })
      );
      act(() => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("user/102/revoke-idc");
      });

      // After revocation: IDC tag removed, Grant switch shown, Company section hidden
      await waitFor(() => {
        expect(screen.getByTestId("grant-idc-switch")).toBeInTheDocument();
        expect(screen.queryByTestId("revoke-idc-btn")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Company", { selector: ".ant-card-head-title" })
        ).not.toBeInTheDocument();
      });
    });

    it("handles 409 conflict when user owns cases and displays modal", async () => {
      api.get.mockResolvedValueOnce({ data: idcUser });
      api.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            detail: {
              id: 102,
              email: "bob.idc@example.com",
              cases: [
                { label: "Cocoa Farm Study 2024", value: 10 },
                { label: "Coffee Baseline 2023", value: 12 },
              ],
            },
          },
        },
      });

      renderComponent("/admin/user/102");

      const revokeBtn = await waitFor(() =>
        screen.getByTestId("revoke-idc-btn")
      );

      act(() => {
        fireEvent.click(revokeBtn);
      });

      const confirmBtn = await waitFor(() =>
        screen.getByRole("button", { name: "Yes" })
      );
      act(() => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Cannot Revoke IDC Access")
        ).toBeInTheDocument();
        expect(screen.getByText("Cocoa Farm Study 2024")).toBeInTheDocument();
        expect(screen.getByText("Coffee Baseline 2023")).toBeInTheDocument();
      });
    });
  });

  describe("Account Status and Deactivate/Reactivate in UserForm", () => {
    it("renders Active status tag and allows deactivation via Popconfirm", async () => {
      api.get.mockResolvedValue({
        data: {
          ...academyOnlyUser,
          id: 101,
          active: true,
        },
      });
      api.post.mockResolvedValue({
        data: { ...academyOnlyUser, id: 101, active: false },
      });

      renderComponent("/admin/user/101");

      await waitFor(() => {
        expect(screen.getByDisplayValue("Alice Academy")).toBeInTheDocument();
      });

      // Active status tags (one in Card extra, one in current tools if applicable)
      const activeTags = screen.getAllByText("Active");
      expect(activeTags.length).toBeGreaterThanOrEqual(1);

      // Deactivate Account button rendered
      const deactBtn = screen.getByTestId("deactivate-account-btn");
      expect(deactBtn).toBeInTheDocument();

      act(() => {
        fireEvent.click(deactBtn);
      });

      const confirmBtn = await waitFor(() =>
        screen.getByRole("button", { name: "Yes" })
      );
      act(() => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("user/101/deactivate");
      });
    });

    it("renders Inactive status tag and allows reactivation via Popconfirm", async () => {
      api.get.mockResolvedValue({
        data: {
          ...academyOnlyUser,
          id: 101,
          active: false,
        },
      });
      api.post.mockResolvedValue({
        data: { ...academyOnlyUser, id: 101, active: true },
      });

      renderComponent("/admin/user/101");

      await waitFor(() => {
        expect(screen.getByDisplayValue("Alice Academy")).toBeInTheDocument();
      });

      // Inactive tag rendered
      expect(screen.getByText("Inactive")).toBeInTheDocument();

      // Reactivate Account button rendered
      const reactBtn = screen.getByTestId("reactivate-account-btn");
      expect(reactBtn).toBeInTheDocument();

      act(() => {
        fireEvent.click(reactBtn);
      });

      const confirmBtn = await waitFor(() =>
        screen.getByRole("button", { name: "Yes" })
      );
      act(() => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("user/101/activate");
      });
    });

    it("disables Deactivate Account button when editing logged-in user's own profile", async () => {
      // Set current user id to 101 in UserState
      act(() => {
        UserState.update((s) => {
          s.id = 101;
        });
      });

      api.get.mockResolvedValue({
        data: {
          ...academyOnlyUser,
          id: 101,
          active: true,
        },
      });

      renderComponent("/admin/user/101");

      await waitFor(() => {
        expect(screen.getByDisplayValue("Alice Academy")).toBeInTheDocument();
      });

      const deactBtn = screen.getByTestId("deactivate-account-btn");
      expect(deactBtn).toBeDisabled();
    });
  });
});
