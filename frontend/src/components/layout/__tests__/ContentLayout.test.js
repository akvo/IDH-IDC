import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ContentLayout from "../ContentLayout";
import { UserState } from "../../../store";

const renderAt = (path, role = "super_admin") => {
  UserState.update((s) => {
    s.role = role;
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <ContentLayout
              breadcrumbItems={[
                { title: "Home", href: "/" },
                { title: "Users", href: "/admin/users" },
              ]}
              title="User Management"
              hideIDCSubMenu
            >
              <div data-testid="page" />
            </ContentLayout>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

const tabs = () => within(screen.getByTestId("admin-tabs-menu"));

describe("ContentLayout admin tabs", () => {
  it("shows the 4 admin tabs", () => {
    renderAt("/admin/users");

    expect(
      tabs()
        .getAllByRole("tab")
        .map((tab) => tab.textContent)
    ).toEqual([
      "Manage Users",
      "Manage Companies",
      "Manage Tags",
      "LI Academy User Statistics",
    ]);
  });

  it.each([
    ["/admin/users", "Manage Users"],
    ["/admin/companies", "Manage Companies"],
    ["/admin/tags", "Manage Tags"],
    ["/admin/academy-user-statistics", "LI Academy User Statistics"],
  ])("marks the tab for %s as active", (path, label) => {
    renderAt(path);

    expect(tabs().getByRole("tab", { selected: true })).toHaveTextContent(
      label
    );
  });

  it("opens the statistics tab", () => {
    renderAt("/admin/users");

    fireEvent.click(tabs().getByText("LI Academy User Statistics"));

    expect(tabs().getByRole("tab", { selected: true })).toHaveTextContent(
      "LI Academy User Statistics"
    );
  });

  it("updates the active tab when navigating via breadcrumb Link", () => {
    renderAt("/admin/academy-user-statistics");

    expect(tabs().getByRole("tab", { selected: true })).toHaveTextContent(
      "LI Academy User Statistics"
    );

    fireEvent.click(screen.getByRole("link", { name: "Users" }));

    expect(tabs().getByRole("tab", { selected: true })).toHaveTextContent(
      "Manage Users"
    );
  });

  it.each([
    ["/admin/user/5", "super_admin"],
    ["/admin/users", "user"],
  ])("hides the tabs on %s for %s", (path, role) => {
    renderAt(path, role);

    expect(screen.queryByTestId("admin-tabs-menu")).not.toBeInTheDocument();
  });

  it("renders IDCSubMenu without legacy Logout button for IDC admin on /admin/users", () => {
    UserState.update((s) => {
      s.id = 10;
      s.role = "admin";
      s.tools = ["idc", "academy"];
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route
            path="*"
            element={
              <ContentLayout
                breadcrumbItems={[
                  { title: "Home", href: "/" },
                  { title: "Users", href: "/admin/users" },
                ]}
                title="User Management"
              >
                <div data-testid="page" />
              </ContentLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Cases Overview")).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("suppresses IDCSubMenu on /admin/users for Academy-only admin without idc tool", () => {
    UserState.update((s) => {
      s.id = 11;
      s.role = "admin";
      s.tools = ["academy"];
    });

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route
            path="*"
            element={
              <ContentLayout
                breadcrumbItems={[
                  { title: "Home", href: "/" },
                  { title: "Users", href: "/admin/users" },
                ]}
                title="User Management"
              >
                <div data-testid="page" />
              </ContentLayout>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Cases Overview")).not.toBeInTheDocument();
  });
});
