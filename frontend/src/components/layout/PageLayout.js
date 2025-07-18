import React, { useState, useMemo } from "react";
import { Layout, Row, Col, Space, Image, Menu } from "antd";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoadingOutlined, DownOutlined } from "@ant-design/icons";
import Logo from "../../assets/images/logo.png";
import {
  adminRole,
  allUserRole,
  LINK_TO_CASE_PROD,
  PROD_HOST,
} from "../../store/static";
import { routePath } from "../route";

const pagesWithNoSider = ["/", "/login", "/welcome", "/register"];
const pagesWithNoHeader = ["/login", "/register"];
const { Header, Content } = Layout;

const PageHeader = ({ isLoggedIn, signOut }) => {
  const host = window.location.hostname;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const userRole = UserState.useState((s) => s.role);
  const isInternalUser = UserState.useState((s) => s.internal_user);
  const location = useLocation();

  const menuItems = useMemo(() => {
    const menuList = [
      {
        testid: "nav-menu-home",
        label: "Home",
        key: "/",
        role: [],
        isPublic: true,
        hide: location?.pathname === "/",
      },
      {
        testid: "nav-menu-idc",
        label: "Income Driver Calculator",
        key: routePath.idc.landing,
        role: [],
        isPublic: true,
      },
      {
        testid: "nav-menu-cases",
        label: "Cases Overview",
        key: host === PROD_HOST ? LINK_TO_CASE_PROD : routePath.idc.cases,
        role: allUserRole,
        isPublic: false,
      },
      {
        testid: "nav-menu-explorers-dropdown",
        label: (
          <>
            Explorers <DownOutlined />
          </>
        ),
        key: "nav-menu-explorers-dropdown",
        isInternalUser: false,
        role: allUserRole,
        isPublic: false,
        children: [
          {
            testid: "nav-menu-lib-explorer",
            label: "Living income benchmark explorer",
            key: "/living-income-benchmark-explorer",
            isInternalUser: false,
            role: allUserRole,
          },
          {
            testid: "nav-menu-explore-studies",
            label: "Explore other studies",
            key: "/explore-studies",
            isInternalUser: false,
            role: allUserRole,
          },
        ],
      },
      {
        testid: "nav-menu-procurement-library",
        label: "Procurement Library",
        key: "/procurement-library",
        isPublic: true,
        role: [],
      },
      {
        testid: "nav-menu-cocoa-income-inventory",
        label: "Cocoa Income Inventory",
        key: "/cocoa-income-inventory",
        isPublic: true,
        role: [],
      },
      {
        testid: "nav-menu-tools-and-resources",
        label: "Tools & Resources",
        key: "/tools-and-resources",
        isPublic: true,
        role: allUserRole,
      },
      {
        testid: "nav-menu-admin",
        label: "Admin",
        key: "/admin/users",
        isPublic: false,
        role: adminRole,
      },
      {
        testid: "nav-menu-faq",
        label: "FAQ",
        key: "/faq",
        isPublic: true,
        role: allUserRole,
        hide: true, // TODO:: hide for NOW
      },
      {
        testid: "nav-menu-login",
        label: <Link className="nav-sign-in"> Sign in to IDC</Link>,
        key: routePath.idc.login,
        isPublic: true,
        role: [],
        hide: true,
      },
      {
        testid: "nav-menu-logout",
        hide: true,
        label: (
          <Link
            className="nav-sign-in"
            onClick={() => {
              signOut();
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                navigate("/");
              }, 300);
            }}
          >
            {loading ? (
              <Space>
                <LoadingOutlined />
                Sign out
              </Space>
            ) : (
              "Sign out"
            )}
          </Link>
        ),
        key: "nav-menut-logout",
        isPublic: false,
        role: allUserRole,
      },
    ];
    const filterByUser = (item) => {
      if (!userRole && !isLoggedIn) {
        return item.isPublic;
      }
      if (userRole && isLoggedIn) {
        if (item?.isInternalUser) {
          return item?.role?.includes(userRole) || isInternalUser;
        }
        return item?.role?.includes(userRole);
      }
      return false;
    };
    const items = menuList
      .filter((item) => !item?.hide)
      .filter((item) => {
        const children = item?.children?.filter((child) => {
          return filterByUser(child);
        });
        item["children"] = children;
        return filterByUser(item);
      });
    return items;
  }, [userRole, isInternalUser, isLoggedIn, loading, signOut, navigate, host]);

  return (
    <Header
      testid="layout-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        width: "100%",
      }}
      id="page-layout-header"
    >
      <Row justify="center" align="middle" style={{ width: "100%" }}>
        <Col span={6} align="start" style={{ width: "100%" }}>
          {/* <Link to={isLoggedIn ? routePath.idc.dashboard : "/"}> */}
          <Link to="/">
            <Row justify="center" align="middle" gutter={[5, 5]}>
              <Col span={9}>
                <Image
                  src={Logo}
                  height={50}
                  preview={false}
                  data-testid="logo-image"
                />
              </Col>
              <Col span={15}>
                <div className="logo-text">Living Income Roadmap Toolkit</div>
              </Col>
            </Row>
          </Link>
        </Col>
        <Col
          span={18}
          align="end"
          testid="nav-container"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Menu
            onClick={({ key }) => navigate(key)}
            mode="horizontal"
            items={menuItems}
            className="navigation-container"
          />
        </Col>
      </Row>
    </Header>
  );
};

const PageLayout = ({ children, signOut }) => {
  const location = useLocation();
  const pathname = location?.pathname;
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const userId = UserState.useState((s) => s.id);
  const userActive = UserState.useState((s) => s.active);

  const authTokenAvailable = useMemo(() => {
    const res = cookies?.AUTH_TOKEN && cookies?.AUTH_TOKEN !== "undefined";
    return res;
  }, [cookies?.AUTH_TOKEN]);

  const isLoggedIn = useMemo(
    () => authTokenAvailable || (userId && userActive),
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
          <PageHeader isLoggedIn={isLoggedIn} signOut={signOut} />
        ) : (
          ""
        )}
        <Content testid="layout-content" className="content-container">
          {children}
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader isLoggedIn={isLoggedIn} signOut={signOut} />
      <Layout>
        <Layout>
          <Content testid="layout-content" className="content-container">
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default PageLayout;
