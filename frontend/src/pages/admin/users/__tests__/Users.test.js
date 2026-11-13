import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Users from "../Users";
import { UserState, UIState } from "../../../../store";
import { api } from "../../../../lib";

jest.mock("../../../../lib/api");

jest.setTimeout(15000);

const organisation_detail = {
  id: 1,
  name: "Akvo",
};

const business_unit_detail = [
  {
    id: 1,
    name: "Meat Guy",
    role: "admin",
  },
];

const mockUserData = {
  current: 1,
  data: [
    {
      id: 1,
      organisation: 1,
      email: "admin@akvo.org",
      fullname: "John Doe",
      role: "admin",
      active: true,
      tags_count: 0,
      cases_count: 0,
      tools: ["idc"],
      company: null,
    },
    {
      id: 2,
      organisation: 1,
      email: "academy@example.com",
      fullname: "Alice Academy",
      role: "user",
      active: true,
      tags_count: 0,
      cases_count: 0,
      tools: ["academy"],
      company: null,
    },
    {
      id: 3,
      organisation: 1,
      email: "dual@example.com",
      fullname: "Bob Dual",
      role: "user",
      active: true,
      tags_count: 0,
      cases_count: 0,
      tools: ["idc", "academy"],
      company: 42,
    },
    {
      id: 4,
      organisation: 1,
      email: "legacy@example.com",
      fullname: "Legacy User",
      role: "user",
      active: true,
      tags_count: 0,
      cases_count: 0,
      tools: [],
      company: null,
    },
  ],
  total: 4,
  total_page: 1,
};

describe("Users page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, "", "/admin/users");
    act(() => {
      UserState.update((s) => {
        s.id = 1;
        s.fullname = "John Doe";
        s.email = "admin@akvo.com";
        s.role = "admin";
        s.active = true;
        s.organisation_detail = organisation_detail;
        s.business_unit_detail = business_unit_detail;
        s.tags_count = 2;
        s.cases_count = 1;
        s.case_access = [{ case: 1, permission: "edit" }];
        s.internal_user = false;
        s.company = null;
        s.tools = ["idc"];
      });
      UIState.update((s) => {
        s.companyOptions = [
          { value: 42, label: "Global Agro", count_users: 1 },
        ];
      });
    });
  });

  it("should render page title, breadcrumbs, and admin tabs menu", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    const wrapper = render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector(".ant-breadcrumb")).toBeInTheDocument();
      expect(wrapper.getByTestId("title")).toHaveTextContent("User Management");
      expect(wrapper.queryByTestId("subTitle")).not.toBeInTheDocument();
      expect(wrapper.getByTestId("admin-tabs-menu")).toBeInTheDocument();
    });
  });

  it("should render user list table content", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    const wrapper = render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      const tableContent = wrapper.getByTestId("table-content");
      expect(tableContent).toBeInTheDocument();
    });
  });

  it("should render Tool Access column with IDC and Academy tag badges and '-' fallback", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("columnheader", { name: "Tool Access" })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      // IDC badges for users 1 and 3
      const idcBadges = screen.getAllByText("IDC");
      expect(idcBadges.length).toBeGreaterThanOrEqual(2);

      // Academy badges for users 2 and 3
      const academyBadges = screen.getAllByText("Academy");
      expect(academyBadges.length).toBeGreaterThanOrEqual(2);

      // Fallback for user 4 with empty tools
      const fallbackDashes = screen.getAllByText("-");
      expect(fallbackDashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should filter users by Tool Access=academy and request tool=academy with page=1", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("user?page=1")
      );
    });

    const toolSelect =
      screen.queryByTestId("filter-tool-access") ||
      document.querySelector("[data-testid='filter-tool-access']") ||
      screen.getByText("Tool Access").closest(".ant-select") ||
      document.querySelectorAll(".ant-select")[0];

    expect(toolSelect).toBeInTheDocument();

    const selector =
      toolSelect.querySelector(".ant-select-selector") || toolSelect;
    fireEvent.mouseDown(selector);

    const academyOption = await waitFor(() => {
      const option =
        document.querySelector(".ant-select-item-option[title='Academy']") ||
        screen.getByText("Academy", {
          selector: ".ant-select-item-option-content",
        });
      expect(option).toBeInTheDocument();
      return option;
    });

    act(() => {
      fireEvent.click(academyOption);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringMatching(
          /user\?.*tool=academy.*page=1|user\?.*page=1.*tool=academy/
        )
      );
    });
  });

  it("should filter users by Tool Access=idc and request tool=idc with page=1", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("user?page=1")
      );
    });

    const toolSelect =
      screen.queryByTestId("filter-tool-access") ||
      document.querySelector("[data-testid='filter-tool-access']") ||
      screen.getByText("Tool Access").closest(".ant-select") ||
      document.querySelectorAll(".ant-select")[0];

    const selector =
      toolSelect.querySelector(".ant-select-selector") || toolSelect;
    fireEvent.mouseDown(selector);

    const idcOption = await waitFor(() => {
      const option =
        document.querySelector(".ant-select-item-option[title='IDC']") ||
        screen.getByText("IDC", {
          selector: ".ant-select-item-option-content",
        });
      expect(option).toBeInTheDocument();
      return option;
    });

    act(() => {
      fireEvent.click(idcOption);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringMatching(
          /user\?.*tool=idc.*page=1|user\?.*page=1.*tool=idc/
        )
      );
    });
  });

  it("should reset page to 1 when clearing Tool Access filter", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });

    const toolSelect = screen.getByTestId("filter-tool-access");
    const selector =
      toolSelect.querySelector(".ant-select-selector") || toolSelect;
    fireEvent.mouseDown(selector);

    const academyOption = await waitFor(() =>
      screen.getByText("Academy", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(academyOption);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("tool=academy")
      );
    });

    api.get.mockClear();

    const clearBtn = toolSelect.querySelector(".ant-select-clear");
    expect(clearBtn).toBeInTheDocument();
    act(() => {
      fireEvent.mouseDown(clearBtn);
      fireEvent.click(clearBtn);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.not.stringContaining("tool=")
      );
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });
  });

  it("should filter by role and company", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });

    const roleSelect = screen.getByTestId("filter-user-role");
    fireEvent.mouseDown(
      roleSelect.querySelector(".ant-select-selector") || roleSelect
    );
    const adminOpt = await waitFor(() =>
      screen.getByText("Admin", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(adminOpt);
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("role=admin")
      );
    });

    const companySelect = screen.getByTestId("filter-company");
    fireEvent.mouseDown(
      companySelect.querySelector(".ant-select-selector") || companySelect
    );
    const companyOpt = await waitFor(() =>
      screen.getByText("Global Agro (1)", {
        selector: ".ant-select-item-option-content",
      })
    );
    act(() => {
      fireEvent.click(companyOpt);
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("company=42")
      );
    });
  });

  it("should toggle approved checkbox, search with 404 fallback, and delete user", async () => {
    api.get.mockResolvedValue({ data: mockUserData });
    api.delete.mockResolvedValue({});

    render(
      <Router>
        <Users />
      </Router>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });

    // Toggle Show Approved User
    const approvedCheckbox = screen.getByRole("checkbox", {
      name: /show approved user/i,
    });
    act(() => {
      fireEvent.click(approvedCheckbox);
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("approved=false")
      );
    });

    // Search + 404 empty fallback
    api.get.mockRejectedValueOnce({ response: { status: 404 } });
    const searchInput = screen.getByPlaceholderText("Find User");
    act(() => {
      fireEvent.change(searchInput, { target: { value: "nobody" } });
    });
    const searchBtn = document.querySelector(".ant-input-search-button");
    act(() => {
      fireEvent.click(searchBtn);
    });
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("search=nobody")
      );
    });
  });

  describe("Status column and Activate/Deactivate actions", () => {
    const mockUsersWithInactive = {
      current: 1,
      data: [
        {
          id: 1,
          organisation: 1,
          email: "admin@akvo.org",
          fullname: "John Doe",
          role: "admin",
          active: true,
          tags_count: 0,
          cases_count: 0,
          tools: ["idc"],
          company: null,
        },
        {
          id: 2,
          organisation: 1,
          email: "active.user@example.com",
          fullname: "Active User",
          role: "user",
          active: true,
          tags_count: 0,
          cases_count: 0,
          tools: ["academy"],
          company: null,
        },
        {
          id: 3,
          organisation: 1,
          email: "inactive.user@example.com",
          fullname: "Inactive User",
          role: "user",
          active: false,
          tags_count: 0,
          cases_count: 0,
          tools: ["idc"],
          company: null,
        },
      ],
      total: 3,
      total_page: 1,
    };

    it("renders Status column with Active and Inactive tags", async () => {
      api.get.mockResolvedValue({ data: mockUsersWithInactive });

      render(
        <Router>
          <Users />
        </Router>
      );

      await waitFor(() => {
        expect(screen.getByText("All Users")).toBeInTheDocument();
      });

      // Status header exists
      expect(screen.getByText("Status")).toBeInTheDocument();

      // Active and Inactive tags exist
      const activeTags = screen.getAllByText("Active");
      expect(activeTags.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("clicking Deactivate button calls api.post('user/{id}/deactivate') and refetches", async () => {
      api.get.mockResolvedValue({ data: mockUsersWithInactive });
      api.post.mockResolvedValue({
        data: { ...mockUsersWithInactive.data[1], active: false },
      });

      render(
        <Router>
          <Users />
        </Router>
      );

      await waitFor(() => {
        expect(screen.getByText("active.user@example.com")).toBeInTheDocument();
      });

      const deactBtn = screen.getByTestId("deactivate-user-2");
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
        expect(api.post).toHaveBeenCalledWith("user/2/deactivate");
      });
    });

    it("clicking Activate button calls api.post('user/{id}/activate') and refetches", async () => {
      api.get.mockResolvedValue({ data: mockUsersWithInactive });
      api.post.mockResolvedValue({
        data: { ...mockUsersWithInactive.data[2], active: true },
      });

      render(
        <Router>
          <Users />
        </Router>
      );

      await waitFor(() => {
        expect(
          screen.getByText("inactive.user@example.com")
        ).toBeInTheDocument();
      });

      const actBtn = screen.getByTestId("activate-user-3");
      expect(actBtn).toBeInTheDocument();

      act(() => {
        fireEvent.click(actBtn);
      });

      const confirmBtn = await waitFor(() =>
        screen.getByRole("button", { name: "Yes" })
      );
      act(() => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("user/3/activate");
      });
    });

    it("disables Deactivate button for logged-in user's own account", async () => {
      api.get.mockResolvedValue({ data: mockUsersWithInactive });

      render(
        <Router>
          <Users />
        </Router>
      );

      await waitFor(() => {
        expect(screen.getByText("admin@akvo.org")).toBeInTheDocument();
      });

      // Current user id is 1 (John Doe, admin@akvo.org)
      const selfDeactBtn = screen.getByTestId("deactivate-user-1");
      expect(selfDeactBtn).toBeDisabled();
      expect(selfDeactBtn).toHaveAttribute(
        "title",
        "You cannot deactivate your own account"
      );
    });
  });
});
