import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Modal } from "antd";
import { UserState } from "../../../store";
import PageLayout, { PageHeader, getInitials } from "../PageLayout";
import { routePath, paths } from "../../route";

const mockSignOut = jest.fn();
jest.mock("../../../hooks/useSignOut", () => () => mockSignOut);

describe("PageLayout Component & Header Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1024;
    act(() => {
      UserState.update((s) => {
        s.id = null;
        s.fullname = "";
        s.email = "";
        s.role = "";
        s.tools = [];
        s.user_profile = null;
      });
    });
  });

  describe("getInitials helper", () => {
    it("extracts first and last initials from full multi-word name", () => {
      expect(getInitials("Jane Doe", "jane@example.com")).toBe("JD");
      expect(getInitials("  John   Michael   Doe  ", "john@example.com")).toBe(
        "JD"
      );
    });

    it("extracts first 2 letters for single-word names", () => {
      expect(getInitials("Admin", "admin@example.com")).toBe("AD");
      expect(getInitials("Winston", "winston@example.com")).toBe("WI");
    });

    it("falls back to email initials if name is missing or empty", () => {
      expect(getInitials("", "support@example.com")).toBe("SU");
      expect(getInitials(null, "admin@example.com")).toBe("AD");
      expect(getInitials(null, "  test@example.com")).toBe("TE");
    });

    it("returns 'U' if both name and email are missing or empty", () => {
      expect(getInitials("", "")).toBe("U");
      expect(getInitials(null, null)).toBe("U");
      expect(getInitials("   ", "   ")).toBe("U");
    });
  });

  describe("Desktop Header: Logged Out State", () => {
    it("renders public navigation links and Sign In button, omitting avatar", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <PageHeader isLoggedIn={false} />
        </MemoryRouter>
      );

      const signInLink = screen.getByTestId("button-signin");
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute("href", `${paths.login}?from=%2F`);
      expect(screen.queryByTestId("header-avatar-btn")).not.toBeInTheDocument();
      expect(screen.getByText("Tools & Resources")).toBeInTheDocument();
    });
  });

  describe("Desktop Header: Logged In State with Dual Tool Access", () => {
    beforeEach(() => {
      act(() => {
        UserState.update((s) => {
          s.id = 1;
          s.fullname = "Jane Doe";
          s.email = "jane.doe@example.com";
          s.role = "user";
          s.tools = ["idc", "academy"];
        });
      });
    });

    it("renders user initials avatar button and reveals dropdown menu on click", () => {
      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      const avatarBtn = screen.getByTestId("header-avatar-btn");
      expect(avatarBtn).toBeInTheDocument();
      expect(avatarBtn).toHaveTextContent("JD");

      // Open dropdown menu
      fireEvent.click(avatarBtn);

      expect(screen.getByTestId("user-info-card")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("My Profile")).toBeInTheDocument();
      expect(screen.getByText("SWITCH TOOL")).toBeInTheDocument();
      expect(screen.getByTestId("switcher-idc")).toBeInTheDocument();
      expect(screen.getByTestId("switcher-academy")).toBeInTheDocument();
      expect(screen.getByTestId("switcher-idc").closest("li")).toHaveClass(
        "tool-item-active"
      );
      expect(
        screen.getByTestId("switcher-academy").closest("li")
      ).not.toHaveClass("tool-item-active");
      expect(screen.getByText("Log out")).toBeInTheDocument();

      // Since user is role "user", Admin Panel should not be rendered
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
    });

    it("allows navigation to Living Income Academy and IDC without gating modal", () => {
      const modalSpy = jest.spyOn(Modal, "info");

      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));

      const idcOption = screen.getByTestId("switcher-idc");
      fireEvent.click(idcOption);
      expect(modalSpy).not.toHaveBeenCalled();

      const academyOption = screen.getByTestId("switcher-academy");
      fireEvent.click(academyOption);
      expect(modalSpy).not.toHaveBeenCalled();

      modalSpy.mockRestore();
    });

    it("handles My Profile and Log out clicks in desktop dropdown", () => {
      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <Routes>
            <Route
              path={paths.login}
              element={<div data-testid="login-route-target">Login Page</div>}
            />
            <Route path="*" element={<PageHeader isLoggedIn={true} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));

      const profileBtn = screen.getByText("My Profile");
      fireEvent.click(profileBtn);

      fireEvent.click(screen.getByTestId("header-avatar-btn"));
      const logoutBtn = screen.getByText("Log out");
      fireEvent.click(logoutBtn);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("login-route-target")).toBeInTheDocument();
    });
  });

  describe("Desktop Header: Academy-Only User Gating", () => {
    beforeEach(() => {
      act(() => {
        UserState.update((s) => {
          s.id = 2;
          s.fullname = "Academy Student";
          s.email = "student@academy.org";
          s.role = "user";
          s.tools = ["academy"];
        });
      });
    });

    it("renders 'No access' tag on IDC and triggers Access Request Modal upon click", () => {
      const modalSpy = jest.spyOn(Modal, "info").mockImplementation(() => {});

      render(
        <MemoryRouter initialEntries={["/academy"]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));

      expect(screen.getByTestId("switcher-idc").closest("li")).not.toHaveClass(
        "tool-item-active"
      );
      expect(screen.getByTestId("switcher-academy").closest("li")).toHaveClass(
        "tool-item-active"
      );
      expect(screen.getByText("No access")).toBeInTheDocument();

      const idcOption = screen.getByTestId("switcher-idc");
      fireEvent.click(idcOption);

      expect(modalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: "access-request-modal",
          okText: "Got it",
        })
      );

      modalSpy.mockRestore();
    });

    it("does not select or highlight Income Driver Calculator in header menu when clicked by unauthorized user on /", () => {
      const modalSpy = jest.spyOn(Modal, "info").mockImplementation(() => {
        return { destroy: jest.fn() };
      });

      render(
        <MemoryRouter initialEntries={["/"]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      const idcNav = screen.getByText("Income Driver Calculator");
      const idcNavItem = idcNav.closest("li");

      expect(idcNavItem).not.toHaveClass("ant-menu-item-selected");

      fireEvent.click(idcNav);

      expect(modalSpy).toHaveBeenCalled();
      expect(idcNavItem).not.toHaveClass("ant-menu-item-selected");
      expect(idcNavItem).not.toHaveClass("ant-menu-item-active");

      modalSpy.mockRestore();
    });
  });

  describe("Admin Role Menu Item", () => {
    it("renders 'Admin Panel' menu item when user role is admin", () => {
      act(() => {
        UserState.update((s) => {
          s.id = 3;
          s.fullname = "Super Admin";
          s.email = "admin@idhtrade.org";
          s.role = "admin";
          s.tools = ["idc", "academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));
      const adminBtn = screen.getByText("Admin Panel");
      expect(adminBtn).toBeInTheDocument();
      fireEvent.click(adminBtn);
    });
  });

  describe("Mobile Drawer Integration", () => {
    beforeEach(() => {
      window.innerWidth = 500;
    });

    it("renders mobile drawer with user identity, tool switcher, and logout for logged in user", () => {
      act(() => {
        UserState.update((s) => {
          s.id = 4;
          s.fullname = "Mobile User";
          s.email = "mobile@idhtrade.org";
          s.role = "admin";
          s.tools = ["idc", "academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      const menuBtn = screen.getByTestId("button-mobile-menu");
      expect(menuBtn).toBeInTheDocument();

      // Open drawer
      fireEvent.click(menuBtn);

      expect(screen.getByTestId("drawer-user-card")).toBeInTheDocument();
      expect(screen.getByText("Mobile User")).toBeInTheDocument();
      expect(screen.getByText("mobile@idhtrade.org")).toBeInTheDocument();
      expect(screen.getByTestId("drawer-tool-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("drawer-switch-idc")).toHaveClass(
        "tool-item-active"
      );
      expect(screen.getByTestId("drawer-switch-academy")).not.toHaveClass(
        "tool-item-active"
      );
      expect(screen.getByTestId("button-drawer-profile")).toBeInTheDocument();
      expect(screen.getByTestId("button-drawer-admin")).toBeInTheDocument();
      expect(screen.getByTestId("button-drawer-logout")).toBeInTheDocument();

      // Mobile interactions
      fireEvent.click(screen.getByTestId("drawer-switch-idc"));
      fireEvent.click(screen.getByTestId("drawer-switch-academy"));
      fireEvent.click(screen.getByTestId("button-drawer-profile"));
      fireEvent.click(screen.getByTestId("button-drawer-admin"));
      fireEvent.click(screen.getByTestId("button-drawer-logout"));
    });

    it("triggers Access Request Modal from mobile drawer for Academy-only account", () => {
      const modalSpy = jest.spyOn(Modal, "info").mockImplementation(() => {});

      act(() => {
        UserState.update((s) => {
          s.id = 5;
          s.fullname = "Mobile Academy Only";
          s.email = "student.mobile@academy.org";
          s.role = "user";
          s.tools = ["academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={["/academy"]}>
          <PageHeader isLoggedIn={true} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("button-mobile-menu"));

      const drawerIdc = screen.getByTestId("drawer-switch-idc");
      fireEvent.click(drawerIdc);

      expect(modalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          className: "access-request-modal",
        })
      );

      modalSpy.mockRestore();
    });

    it("renders Sign In button inside mobile drawer when logged out", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path={paths.login}
              element={<div data-testid="login-route-target">Login Page</div>}
            />
            <Route path="*" element={<PageHeader isLoggedIn={false} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("button-mobile-menu"));
      const drawerLoginBtn = screen.getByTestId("button-drawer-login");
      expect(drawerLoginBtn).toBeInTheDocument();
      expect(screen.queryByTestId("drawer-user-card")).not.toBeInTheDocument();
      fireEvent.click(drawerLoginBtn);
      expect(screen.getByTestId("login-route-target")).toBeInTheDocument();
    });
  });

  describe("PageLayout Component Wrapper", () => {
    it("renders layout content and suppresses header on login/register routes", () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <PageLayout>
            <div data-testid="child-content">Login Form Content</div>
          </PageLayout>
        </MemoryRouter>
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      // On /login in desktop view, header is not rendered
      expect(screen.queryByTestId("layout-header")).not.toBeInTheDocument();
    });

    it("renders layout content and suppresses header on /verify-academy route", () => {
      render(
        <MemoryRouter initialEntries={["/verify-academy"]}>
          <PageLayout>
            <div data-testid="child-content">Verify Academy Content</div>
          </PageLayout>
        </MemoryRouter>
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.queryByTestId("layout-header")).not.toBeInTheDocument();
    });

    it("renders header on standard application pages", () => {
      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <PageLayout>
            <div data-testid="dashboard-content">Dashboard Content</div>
          </PageLayout>
        </MemoryRouter>
      );

      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      expect(screen.getByTestId("layout-header")).toBeInTheDocument();
    });
  });
});

describe("PageLayout header on Academy pages", () => {
  const renderAt = (path) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <PageLayout>
          <div>content</div>
        </PageLayout>
      </MemoryRouter>
    );

  const getSelectedNavText = () =>
    Array.from(
      document.querySelectorAll(".navigation-container .ant-menu-item-selected")
    ).map((el) => el.textContent);

  beforeEach(() => {
    window.innerWidth = 1024;
    act(() => {
      UserState.update((s) => {
        s.id = 1;
        s.active = true;
        s.isAuthenticated = true;
        s.fullname = "Kole Johnson";
        s.user_profile = null;
      });
    });
  });

  afterEach(() => {
    act(() => {
      UserState.update((s) => {
        s.id = 0;
        s.active = false;
        s.isAuthenticated = false;
        s.fullname = null;
        s.user_profile = null;
      });
    });
  });

  it("keeps Academy highlighted on nested academy pages", () => {
    renderAt(routePath.academy.courses);
    expect(getSelectedNavText()).toEqual(["Academy"]);
  });

  it("prefers the learner profile name for the avatar initials", () => {
    act(() => {
      UserState.update((s) => {
        s.user_profile = { first_name: "Olivia", last_name: "Reyes" };
      });
    });
    renderAt(routePath.academy.overview);
    expect(screen.getByTestId("header-avatar-btn")).toHaveTextContent("OR");
  });

  it("does not show the avatar or a stray '0' when signed out", () => {
    act(() => {
      UserState.update((s) => {
        s.id = 0;
        s.active = false;
        s.isAuthenticated = false;
      });
    });
    renderAt(routePath.academy.overview);
    expect(screen.queryByTestId("header-avatar-btn")).not.toBeInTheDocument();
    // A numeric `isLoggedIn` (user id 0) would render a stray "0"
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  describe("Context-Aware My Profile Routing", () => {
    it("routes desktop My Profile to /profile for IDC user on IDC route", () => {
      act(() => {
        UserState.update((s) => {
          s.id = 1;
          s.fullname = "Jane Doe";
          s.email = "jane@example.com";
          s.role = "user";
          s.tools = ["idc", "academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <Routes>
            <Route
              path={routePath.profile}
              element={<div data-testid="target-profile">Profile Page</div>}
            />
            <Route
              path={routePath.academy.profile}
              element={
                <div data-testid="target-academy-profile">
                  Academy Profile Page
                </div>
              }
            />
            <Route path="*" element={<PageHeader isLoggedIn={true} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));
      fireEvent.click(screen.getByText("My Profile"));
      expect(screen.getByTestId("target-profile")).toBeInTheDocument();
      expect(
        screen.queryByTestId("target-academy-profile")
      ).not.toBeInTheDocument();
    });

    it("routes desktop My Profile to /academy/profile when inside /academy*", () => {
      act(() => {
        UserState.update((s) => {
          s.id = 1;
          s.fullname = "Jane Doe";
          s.email = "jane@example.com";
          s.role = "user";
          s.tools = ["idc", "academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={["/academy/courses"]}>
          <Routes>
            <Route
              path={routePath.profile}
              element={<div data-testid="target-profile">Profile Page</div>}
            />
            <Route
              path={routePath.academy.profile}
              element={
                <div data-testid="target-academy-profile">
                  Academy Profile Page
                </div>
              }
            />
            <Route path="*" element={<PageHeader isLoggedIn={true} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));
      fireEvent.click(screen.getByText("My Profile"));
      expect(screen.getByTestId("target-academy-profile")).toBeInTheDocument();
      expect(screen.queryByTestId("target-profile")).not.toBeInTheDocument();
    });

    it("routes desktop My Profile to /profile for Academy-only user outside /academy*", () => {
      act(() => {
        UserState.update((s) => {
          s.id = 2;
          s.fullname = "Academy Only Learner";
          s.email = "learner@example.com";
          s.role = "user";
          s.tools = ["academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={["/procurement-library"]}>
          <Routes>
            <Route
              path={routePath.profile}
              element={<div data-testid="target-profile">Profile Page</div>}
            />
            <Route
              path={routePath.academy.profile}
              element={
                <div data-testid="target-academy-profile">
                  Academy Profile Page
                </div>
              }
            />
            <Route path="*" element={<PageHeader isLoggedIn={true} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("header-avatar-btn"));
      fireEvent.click(screen.getByText("My Profile"));
      expect(screen.getByTestId("target-profile")).toBeInTheDocument();
      expect(
        screen.queryByTestId("target-academy-profile")
      ).not.toBeInTheDocument();
    });

    it("routes mobile drawer My Profile to /academy/profile inside /academy*", () => {
      window.innerWidth = 500;
      act(() => {
        UserState.update((s) => {
          s.id = 2;
          s.fullname = "Academy Mobile";
          s.email = "mobile@academy.org";
          s.role = "user";
          s.tools = ["academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={[routePath.academy.overview]}>
          <Routes>
            <Route
              path={routePath.academy.profile}
              element={
                <div data-testid="target-academy-profile">
                  Academy Profile Page
                </div>
              }
            />
            <Route path="*" element={<PageHeader isLoggedIn={true} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("button-mobile-menu"));
      fireEvent.click(screen.getByTestId("button-drawer-profile"));
      expect(screen.getByTestId("target-academy-profile")).toBeInTheDocument();
    });

    it("routes mobile drawer My Profile to /profile for IDC user outside /academy*", () => {
      window.innerWidth = 500;
      act(() => {
        UserState.update((s) => {
          s.id = 1;
          s.fullname = "IDC Mobile";
          s.email = "idc.mobile@idhtrade.org";
          s.role = "user";
          s.tools = ["idc", "academy"];
        });
      });

      render(
        <MemoryRouter initialEntries={[routePath.idc.dashboard]}>
          <Routes>
            <Route
              path={routePath.profile}
              element={<div data-testid="target-profile">Profile Page</div>}
            />
            <Route path="*" element={<PageHeader isLoggedIn={true} />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId("button-mobile-menu"));
      fireEvent.click(screen.getByTestId("button-drawer-profile"));
      expect(screen.getByTestId("target-profile")).toBeInTheDocument();
    });
  });
});
