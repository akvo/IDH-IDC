import { render, waitFor, act } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Users from "../Users";
import { UserState } from "../../../../store";
import { api } from "../../../../lib";

jest.mock("../../../../lib/api");

global.window.location = {
  ancestorOrigins: null,
  hash: null,
  host: "dummy.com",
  port: "80",
  protocol: "http:",
  hostname: "dummy.com",
  href: "http://dummy.com?page=1&name=testing",
  origin: "http://dummy.com",
  pathname: "/admin/users",
  search: null,
  assign: null,
  reload: null,
  replace: null,
};

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
    },
  ],
  total: 1,
  total_page: 1,
};

describe("Users page", () => {
  it("should render page title, breadcrumbs, and admin tabs menu", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    const wrapper = render(
      <Router>
        <Users />
      </Router>
    );

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
      });
    });

    waitFor(() => {
      expect(wrapper.getByTestId("breadcrumb").toBeInTheDocument());
      expect(wrapper.getByTestId("title").not.toBeInTheDocument());
      expect(wrapper.getByTestId("subTitle").not.toBeInTheDocument());
      expect(wrapper.getByTestId("admin-tabs-menu").toBeInTheDocument());
    });
  });

  it("should render user list table content", async () => {
    api.get.mockResolvedValue({ data: mockUserData });

    const wrapper = render(
      <Router>
        <Users />
      </Router>
    );

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
      });
    });

    waitFor(() => {
      const tableContent = wrapper.getByTestId("table-content");
      expect(tableContent).toBeInTheDocument();
    });
  });

  it.todo("should filter user list by search value");
  it.todo("should go to add new user page if Add User button clicked");
  it.todo("should go to edit user page if edit icon clicked");
});
