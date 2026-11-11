import React, { useCallback, useMemo, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Menu,
  Button,
  Drawer,
  Avatar,
  Dropdown,
  Modal,
  Tag,
} from "antd";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import { adminRole } from "../../store/static";
import { routePath, routePrefix, paths } from "../route";
import {
  MenuOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useWindowDimensions, useSignOut } from "../../hooks";
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

const pagesWithNoSider = ["/", "/login", "/welcome", "/register"];
const { Header, Content } = Layout;

// Keep the top-level menu item active on nested pages, e.g. /academy/courses
const isAcademyShellPath = (pathname) =>
  pathname.startsWith(`${routePath.academy.landing}/`);

const getSelectedMenuKey = (pathname) =>
  isAcademyShellPath(pathname) ? routePath.academy.landing : pathname;

export const PageHeader = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();
  const [drawerVisible, setDrawerVisible] = useState(false);
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
    location.pathname.startsWith(
      routePrefix?.idc || "/income-driver-calculator"
    ) ||
    location.pathname.startsWith("/cases") ||
    location.pathname.startsWith("/case");
  const isCurrentAcademy = location.pathname.startsWith("/academy");
  const isAdmin = adminRole.includes(userRole);

  const showAccessRequestModal = () => {
    Modal.info({
      title: "Income Driver Calculator Access",
      icon: <InfoCircleOutlined style={{ color: "#01625f" }} />,
      className: "access-request-modal",
      width: 480,
      okText: "Got it",
      okButtonProps: {
        className: "button-modal-ok",
      },
      content: (
        <div className="access-modal-content">
          <p>
            The <strong>Income Driver Calculator</strong> is restricted to
            authorized supply chain partners and program participants.
          </p>
          <p>
            If your company or organization participates in an IDH living income
            program, please contact your organization administrator or reach out
            to us at:
          </p>
          <div className="access-modal-contact-card">
            <span className="contact-label">Support & Invitations:</span>
            <a
              href="mailto:livingincome@idhtrade.org"
              className="contact-email"
            >
              livingincome@idhtrade.org
            </a>
          </div>
        </div>
      ),
    });
  };

  const handleLogout = useCallback(() => {
    signOut();
    navigate(paths.login);
    setDrawerVisible(false);
  }, [signOut, navigate]);

  const menuItems = useMemo(() => {
    const menuList = [
      {
        testid: "nav-menu-idc",
        label: "Income Driver Calculator",
        key: isLoggedIn ? routePath.idc.dashboard : routePath.idc.landing,
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
        label: "Tools & Resources",
        key: "/tools-and-resources",
      },
    ];
    return menuList.filter((item) => !item?.hide);
  }, [isLoggedIn]);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleMenuClick = ({ key }) => {
    if (key === routePath.idc.dashboard || key === routePath.idc.landing) {
      if (isLoggedIn && !hasIdcAccess) {
        showAccessRequestModal();
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
        onClick: () => navigate("/profile"),
      },
      { type: "divider" },
      {
        key: "tool-switcher-group",
        type: "group",
        label: <span className="menu-group-heading">SWITCH TOOL</span>,
        children: [
          {
            key: "switch-idc",
            className: isCurrentIdc ? "tool-item-active" : "",
            label: (
              <div className="tool-switcher-item" data-testid="switcher-idc">
                <span className="tool-name">Income Driver Calculator</span>
                {!hasIdcAccess && (
                  <Tag className="tool-tag-no-access">No access</Tag>
                )}
              </div>
            ),
            onClick: () => {
              if (!hasIdcAccess) {
                showAccessRequestModal();
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
      ...(isAdmin
        ? [
            { type: "divider" },
            {
              key: "admin-panel",
              label: "Admin Panel",
              icon: <SettingOutlined />,
              onClick: () => navigate("/admin/users"),
            },
          ]
        : []),
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
    navigate,
    handleLogout,
  ]);

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
        <Col span={isMobile ? 18 : 6} align="start">
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
          span={isMobile ? 6 : 18}
          align="end"
          testid="nav-container"
          style={
            isMobile
              ? {}
              : {
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
              <Button
                icon={<MenuOutlined />}
                onClick={toggleDrawer}
                type="text"
                style={{ float: "right" }}
                data-testid="button-mobile-menu"
              />
              <Drawer
                placement="right"
                closable
                onClose={toggleDrawer}
                open={drawerVisible}
                className="drawer-menu-wrapper"
              >
                {isLoggedIn ? (
                  <div
                    className="drawer-user-card"
                    data-testid="drawer-user-card"
                  >
                    <Avatar className="drawer-avatar" size={40}>
                      {avatarInitials}
                    </Avatar>
                    <div className="drawer-user-details">
                      <div
                        className="drawer-user-name"
                        data-testid="drawer-user-name"
                      >
                        {fullname || "Toolkit User"}
                      </div>
                      <div className="drawer-user-email">{email || ""}</div>
                    </div>
                  </div>
                ) : null}

                {isLoggedIn ? (
                  <div
                    className="drawer-tool-switcher"
                    data-testid="drawer-tool-switcher"
                  >
                    <span className="drawer-section-title">SWITCH TOOL</span>
                    <div
                      className={`drawer-tool-item ${
                        isCurrentIdc ? "tool-item-active" : ""
                      }`}
                      data-testid="drawer-switch-idc"
                      onClick={() => {
                        if (!hasIdcAccess) {
                          showAccessRequestModal();
                          setDrawerVisible(false);
                          return;
                        }
                        navigate(routePath.idc.dashboard);
                        setDrawerVisible(false);
                      }}
                    >
                      <span>Income Driver Calculator</span>
                      {!hasIdcAccess && (
                        <Tag className="tool-tag-no-access">No access</Tag>
                      )}
                    </div>
                    <div
                      className={`drawer-tool-item ${
                        isCurrentAcademy ? "tool-item-active" : ""
                      }`}
                      data-testid="drawer-switch-academy"
                      onClick={() => {
                        navigate(routePath.academy.landing);
                        setDrawerVisible(false);
                      }}
                    >
                      <span>Living Income Academy</span>
                    </div>
                  </div>
                ) : null}

                <Menu
                  mode="inline"
                  items={menuItems}
                  onClick={handleMenuClick}
                  selectedKeys={selectedKeys}
                />

                {isLoggedIn ? (
                  <div className="drawer-footer-actions">
                    <Button
                      type="text"
                      block
                      icon={<UserOutlined />}
                      onClick={() => {
                        navigate("/profile");
                        setDrawerVisible(false);
                      }}
                      style={{ textAlign: "left", marginBottom: 8 }}
                      data-testid="button-drawer-profile"
                    >
                      My Profile
                    </Button>
                    {isAdmin && (
                      <Button
                        type="text"
                        block
                        icon={<SettingOutlined />}
                        onClick={() => {
                          navigate("/admin/users");
                          setDrawerVisible(false);
                        }}
                        style={{ textAlign: "left", marginBottom: 8 }}
                        data-testid="button-drawer-admin"
                      >
                        Admin Panel
                      </Button>
                    )}
                    <Button
                      block
                      danger
                      icon={<LogoutOutlined />}
                      onClick={handleLogout}
                      data-testid="button-drawer-logout"
                    >
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="drawer-footer-actions">
                    <Button
                      type="primary"
                      block
                      className="button-green"
                      onClick={() => {
                        navigate(paths.login);
                        setDrawerVisible(false);
                      }}
                      data-testid="button-drawer-login"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </Drawer>
            </>
          ) : (
            <>
              <Menu
                mode="horizontal"
                onClick={handleMenuClick}
                items={menuItems}
                style={{
                  borderBottom: "none",
                  flex: 1,
                  justifyContent: "flex-end",
                }}
                className="navigation-container"
                selectedKeys={selectedKeys}
              />
              {isLoggedIn ? (
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
                >
                  <button
                    type="button"
                    className="header-avatar-btn"
                    data-testid="header-avatar-btn"
                    aria-label="User Profile and Tool Switcher Menu"
                  >
                    <Avatar
                      className="header-avatar"
                      data-testid="header-avatar"
                      size={36}
                    >
                      {avatarInitials}
                    </Avatar>
                  </button>
                </Dropdown>
              ) : (
                <Link
                  to={paths.login}
                  className="nav-sign-in"
                  data-testid="button-signin"
                >
                  Sign In
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
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const userId = UserState.useState((s) => s.id);
  const userActive = UserState.useState((s) => s.active);
  const { isMobile } = useWindowDimensions();

  const pagesWithNoHeader = useMemo(() => {
    if (isMobile) {
      return ["/register"];
    }
    return ["/login", "/register"];
  }, [isMobile]);

  const authTokenAvailable = useMemo(() => {
    const res = cookies?.AUTH_TOKEN && cookies?.AUTH_TOKEN !== "undefined";
    return res;
  }, [cookies?.AUTH_TOKEN]);

  const isLoggedIn = useMemo(
    () => Boolean(authTokenAvailable || (userId && userActive)),
    [authTokenAvailable, userId, userActive]
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
