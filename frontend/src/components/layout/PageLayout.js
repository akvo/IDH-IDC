import React, { useCallback, useMemo, useState } from "react";
import { Layout, Row, Col, Menu, Button, Drawer, Avatar, Dropdown } from "antd";
import { UserState } from "../../store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import { adminRole } from "../../store/static";
import { routePath, routePrefix } from "../route";
import {
  MenuOutlined,
  CloseSquareOutlined,
  UserOutlined,
  SettingOutlined,
  LockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useWindowDimensions, useSignOut } from "../../hooks";
import { showIdcAccessRequestModal } from "../utils";
import { getUserInitials } from "../../pages/academy/utils";

export const getInitials = (name, mail) => {
  if (name && typeof name === "string" && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (mail && typeof mail === "string" && mail.trim()) {
    return mail.trim().substring(0, 2).toUpperCase();
  }
  return "U";
};

const pagesWithNoSider = [
  "/",
  "/login",
  "/welcome",
  "/register",
  "/verify-academy",
  "/forgot-password",
];
const { Header, Content } = Layout;

// Keep the top-level menu item active on nested pages, e.g. /academy/courses
const isAcademyShellPath = (pathname) =>
  pathname.startsWith(`${routePath.academy.landing}/`);

const getSelectedMenuKey = (pathname) =>
  isAcademyShellPath(pathname) ? routePath.academy.landing : pathname;

export const PageHeader = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions(992);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [navKey, setNavKey] = useState(0);
  const location = useLocation();
  const signOut = useSignOut();

  const fullname = UserState.useState((s) => s.fullname);
  const email = UserState.useState((s) => s.email);
  const userRole = UserState.useState((s) => s.role);
  const userProfile = UserState.useState((s) => s.user_profile);
  const rawTools = UserState.useState((s) => s.tools);
  const userTools = useMemo(
    () => (Array.isArray(rawTools) ? rawTools : []),
    [rawTools]
  );
  const selectedKeys = [getSelectedMenuKey(location.pathname)];
  const avatarInitials =
    getUserInitials({ user_profile: userProfile }) ||
    getInitials(fullname, email);

  const hasIdcAccess = userTools.includes("idc");
  const isCurrentIdc =
    hasIdcAccess &&
    (location.pathname.startsWith(
      routePrefix?.idc || "/income-driver-calculator"
    ) ||
      location.pathname.startsWith("/cases") ||
      location.pathname.startsWith("/case"));
  const isCurrentAcademy = location.pathname.startsWith("/academy");
  const isAdmin = adminRole.includes(userRole);
  // Inside the Academy the profile keeps the Academy sidebar
  const profileTargetRoute = isCurrentAcademy
    ? routePath.academy.profile
    : routePath.profile;

  const loginHref = location.pathname
    ? `/login?from=${encodeURIComponent(
        `${location.pathname}${location.search || ""}`
      )}`
    : "/login";

  const handleLogout = useCallback(() => {
    signOut();
    navigate("/");
    setDrawerVisible(false);
  }, [signOut, navigate]);

  const openIdcAccessModal = useCallback(() => {
    showIdcAccessRequestModal({
      force: true,
      navigate,
      onDiscard: () => {
        if (typeof document !== "undefined" && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        setNavKey((prev) => prev + 1);
      },
      onExplore: () => {
        setNavKey((prev) => prev + 1);
        navigate(routePath.academy.overview);
      },
    });
  }, [navigate]);

  const menuItems = useMemo(() => {
    const menuList = [
      {
        testid: "nav-menu-idc",
        label: "Income Driver Calculator",
        key: isLoggedIn ? routePath.idc.dashboard : routePath.idc.landing,
        className: isLoggedIn && !hasIdcAccess ? "nav-item-idc-muted" : "",
      },
      {
        testid: "nav-menu-procurement-library",
        label: "Procurement Library",
        key: "/procurement-library",
      },
      {
        testid: "nav-menu-cocoa-income-inventory",
        label: "Cocoa Income Inventory",
        key: "/cocoa-income-inventory",
      },
      {
        testid: "nav-menu-academy",
        label: "Academy",
        key: routePath.academy.landing,
      },
      {
        testid: "nav-menu-tools-and-resources",
        label: "Other Tools & Resources",
        key: "/tools-and-resources",
      },
    ];
    return menuList.filter((item) => !item?.hide);
  }, [isLoggedIn, hasIdcAccess]);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleMenuClick = ({ key, domEvent }) => {
    if (key === routePath.idc.dashboard || key === routePath.idc.landing) {
      if (isLoggedIn && !hasIdcAccess) {
        if (domEvent?.preventDefault) {
          domEvent.preventDefault();
        }
        if (typeof document !== "undefined" && document.activeElement?.blur) {
          document.activeElement.blur();
        }
        setNavKey((prev) => prev + 1);
        openIdcAccessModal();
        setDrawerVisible(false);
        return;
      }
    }
    navigate(key);
    setDrawerVisible(false);
  };

  const avatarDropdownItems = useMemo(() => {
    return [
      {
        key: "user-card",
        type: "group",
        label: (
          <div className="header-avatar-user-card" data-testid="user-info-card">
            <div className="user-card-name" data-testid="user-card-name">
              {fullname || "Toolkit User"}
            </div>
            <div className="user-card-email">{email || ""}</div>
          </div>
        ),
      },
      { type: "divider" },
      {
        key: "profile",
        label: "My Profile",
        icon: <UserOutlined />,
        onClick: () => navigate(profileTargetRoute),
      },
      ...(isAdmin
        ? [
            {
              key: "admin-panel",
              label: "Admin",
              icon: <SettingOutlined />,
              onClick: () => navigate(routePath.admin.users),
            },
          ]
        : []),
      { type: "divider" },
      {
        key: "tool-switcher-group",
        type: "group",
        label: <span className="menu-group-heading">SWITCH TOOL</span>,
        children: [
          {
            key: "switch-idc",
            className: [
              isCurrentIdc ? "tool-item-active" : "",
              !hasIdcAccess ? "tool-item-locked" : "",
            ]
              .filter(Boolean)
              .join(" "),
            label: (
              <div className="tool-switcher-item" data-testid="switcher-idc">
                <span className="tool-name">Income Driver Calculator</span>
                {!hasIdcAccess && (
                  <LockOutlined
                    className="tool-lock-icon"
                    data-testid="switcher-idc-lock"
                  />
                )}
              </div>
            ),
            onClick: () => {
              if (!hasIdcAccess) {
                openIdcAccessModal();
                return;
              }
              navigate(routePath.idc.dashboard);
            },
          },
          {
            key: "switch-academy",
            className: isCurrentAcademy ? "tool-item-active" : "",
            label: (
              <div
                className="tool-switcher-item"
                data-testid="switcher-academy"
              >
                <span className="tool-name">Living Income Academy</span>
              </div>
            ),
            onClick: () => navigate(routePath.academy.landing),
          },
        ],
      },
      { type: "divider" },
      {
        key: "logout",
        label: "Log out",
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout,
      },
    ];
  }, [
    fullname,
    email,
    hasIdcAccess,
    isCurrentIdc,
    isCurrentAcademy,
    isAdmin,
    profileTargetRoute,
    navigate,
    handleLogout,
    openIdcAccessModal,
  ]);

  const avatarDropdown = isLoggedIn ? (
    <Dropdown
      menu={{
        items: avatarDropdownItems,
        selectedKeys: [
          isCurrentIdc
            ? "switch-idc"
            : isCurrentAcademy
            ? "switch-academy"
            : "",
        ],
      }}
      trigger={["click"]}
      placement="bottomRight"
      overlayClassName="header-avatar-dropdown"
      onOpenChange={(open) => {
        if (open) {
          setDrawerVisible(false);
        }
      }}
    >
      <button
        type="button"
        className="header-avatar-btn"
        data-testid="header-avatar-btn"
        aria-label="User Profile and Tool Switcher Menu"
      >
        <Avatar className="header-avatar" data-testid="header-avatar">
          {avatarInitials}
        </Avatar>
      </button>
    </Dropdown>
  ) : null;

  return (
    <Header
      data-testid="layout-header"
      testid="layout-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}
      id="page-layout-header"
      className={isMobile ? "mobile-screen" : ""}
    >
      <Row
        justify={isMobile ? "space-between" : "center"}
        align="middle"
        style={{ width: "100%" }}
      >
        <Col
          flex={isMobile ? "1 1 auto" : "0 0 auto"}
          style={isMobile ? { minWidth: 0 } : {}}
          align="start"
        >
          <Link to="/">
            <div className="header-logo-wrapper">
              <img
                src={Logo}
                style={{
                  height: `${isMobile ? 40 : 50}px`,
                }}
                data-testid="logo-image"
              />
              <div className="logo-text">
                Toolkit Towards
                <br />
                Better Incomes
              </div>
            </div>
          </Link>
        </Col>

        {/* Menu toggle (Mobile) or horizontal menu (Desktop) */}
        <Col
          flex={isMobile ? "0 0 auto" : "1 1 0"}
          align="end"
          testid="nav-container"
          style={
            isMobile
              ? {}
              : {
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "16px",
                }
          }
        >
          {isMobile ? (
            <>
              <div className="mobile-header-actions">
                {avatarDropdown}
                <Button
                  icon={
                    drawerVisible ? <CloseSquareOutlined /> : <MenuOutlined />
                  }
                  onClick={toggleDrawer}
                  type="text"
                  data-testid="button-mobile-menu"
                  aria-label="Toggle navigation menu"
                />
              </div>
              <Drawer
                placement="top"
                height="auto"
                closable={false}
                onClose={toggleDrawer}
                open={drawerVisible}
                rootClassName="drawer-menu-root"
                className="drawer-menu-wrapper"
                rootStyle={{
                  top: 80,
                  height: "calc(100vh - 80px)",
                  zIndex: 990,
                }}
              >
                <Menu
                  key={`mobile-nav-${navKey}`}
                  mode="inline"
                  items={menuItems}
                  onClick={handleMenuClick}
                  selectedKeys={selectedKeys}
                />

                {!isLoggedIn ? (
                  <div className="drawer-footer-actions">
                    <Link
                      to={loginHref}
                      className="nav-sign-in drawer-login-link"
                      onClick={() => setDrawerVisible(false)}
                      data-testid="button-drawer-login"
                    >
                      Log in
                    </Link>
                  </div>
                ) : null}
              </Drawer>
            </>
          ) : (
            <>
              <Menu
                key={`desktop-nav-${navKey}`}
                mode="horizontal"
                onClick={handleMenuClick}
                items={menuItems}
                disabledOverflow={true}
                style={{
                  borderBottom: "none",
                  flex: 1,
                  minWidth: 0,
                  justifyContent: "flex-end",
                }}
                className="navigation-container"
                selectedKeys={selectedKeys}
              />
              {isLoggedIn ? (
                avatarDropdown
              ) : (
                <Link
                  to={loginHref}
                  className="nav-sign-in"
                  data-testid="button-signin"
                >
                  Log in
                </Link>
              )}
            </>
          )}
        </Col>
      </Row>
    </Header>
  );
};

const PageLayout = ({ children }) => {
  const location = useLocation();
  const pathname = location?.pathname;
  const storeIsAuth = UserState.useState((s) => s.isAuthenticated);
  const userId = UserState.useState((s) => s.id);
  const userActive = UserState.useState((s) => s.active);
  const { isMobile } = useWindowDimensions();

  const pagesWithNoHeader = useMemo(() => {
    if (isMobile) {
      return ["/register", "/verify-academy", "/forgot-password"];
    }
    return ["/login", "/register", "/verify-academy", "/forgot-password"];
  }, [isMobile]);

  const isLoggedIn = useMemo(
    () => Boolean(storeIsAuth || (userId && userActive)),
    [storeIsAuth, userId, userActive]
  );

  const isResetPasswordPage =
    pathname.includes("invitation") || pathname.includes("reset-password");

  if (
    pagesWithNoSider.some((path) => pathname.endsWith(path)) ||
    isResetPasswordPage
  ) {
    return (
      <Layout>
        {!pagesWithNoHeader.some((path) => pathname.endsWith(path)) &&
        !isResetPasswordPage ? (
          <PageHeader isLoggedIn={isLoggedIn} />
        ) : (
          ""
        )}
        <Content
          data-testid="layout-content"
          testid="layout-content"
          className="content-container"
        >
          {children}
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader isLoggedIn={isLoggedIn} />
      <Layout>
        <Layout>
          <Content
            data-testid="layout-content"
            testid="layout-content"
            className="content-container"
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default PageLayout;
