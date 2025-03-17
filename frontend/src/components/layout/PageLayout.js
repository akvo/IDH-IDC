import React, { useState, useMemo } from "react";
import { Layout, Row, Col, Space, Image, Menu } from "antd";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoadingOutlined, DownOutlined } from "@ant-design/icons";
import Logo from "../../assets/images/logo.png";
import { adminRole, allUserRole } from "../../store/static";

const pagesWithNoSider = ["/", "/login", "/welcome", "/register"];
const pagesWithNoHeader = ["/login", "/register"];
const { Header, Content } = Layout;

// const procurementLibraryMenu = {
//   testid: "nav-menu-procurement-library",
//   name: "Procurement Library",
//   path: "/procurement-library",
//   role: allUserRole,
// };
// const cocoaIncomeInventoryMenu = {
//   testid: "nav-menu-cocoa-income-inventory",
//   name: "Cocoa Income Inventory",
//   path: "/cocoa-income-inventory",
//   role: allUserRole,
// };

const PageHeader = ({ isLoggedIn, signOut }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const userRole = UserState.useState((s) => s.role);
  const isInternalUser = UserState.useState((s) => s.internal_user);

  const menuList = [
    {
      testid: "nav-menu-cases",
      label: "Cases Overview",
      key: "/cases",
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
      isInternalUser: true,
      role: adminRole,
      isPublic: false,
      children: [
        {
          testid: "nav-menu-explore-studies",
          label: "Explore other studies",
          key: "/explore-studies",
          isInternalUser: true,
          role: adminRole,
        },
      ],
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
    },
    {
      testid: "nav-menu-login",
      label: <Link className="nav-sign-in"> Sign in</Link>,
      key: "/login",
      isPublic: true,
      role: [],
    },
    {
      testid: "nav-menu-logout",
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

  // menu without loggin
  const generalMenus = useMemo(() => {
    const otherResourcesMenu = {
      testid: "nav-menu-tools-and-resources",
      name: "Tools & Resources",
      path: "/tools-and-resources",
      role: allUserRole,
    };
    const faqMenu = {
      testid: "nav-menu-faq",
      name: "FAQ",
      path: "/faq",
      role: allUserRole,
    };
    const procurementLibraryMenu = {
      testid: "nav-menu-procurement-library",
      name: "Procurement Library",
      path: "/procurement-library",
      role: allUserRole,
    };
    const cocoaIncomeInventoryMenu = {
      testid: "nav-menu-cocoa-income-inventory",
      name: "Cocoa Income Inventory",
      path: "/cocoa-income-inventory",
      role: allUserRole,
    };
    const values = [
      procurementLibraryMenu,
      cocoaIncomeInventoryMenu,
      otherResourcesMenu,
      faqMenu,
    ];
    return values;
  }, []);

  // logged in menus
  const authMenus = useMemo(() => {
    const exploreStudiesMenu = {
      testid: "nav-menu-explore-studies",
      name: "Explore Studies",
      path: "/explore-studies",
      role: allUserRole,
    };
    let values = [
      {
        testid: "nav-menu-cases",
        name: "Cases Overview",
        path: "/cases",
        role: allUserRole,
      },
    ];
    if (adminRole.includes(userRole)) {
      values = [
        ...values,
        exploreStudiesMenu,
        ...generalMenus,
        {
          testid: "nav-menu-admin",
          name: "Admin",
          path: "/admin/users",
          role: adminRole,
        },
      ];
    }
    if (userRole === "user" && isInternalUser) {
      values = [...values, exploreStudiesMenu, ...generalMenus];
    }
    return values;
  }, [userRole, isInternalUser, generalMenus]);

  const menuItems = useMemo(() => {
    const items = menuList.filter((item) => {
      console.log(item, userRole);
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
    });
    return items;
  }, [userRole, isInternalUser]);

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
        <Col span={3} align="start" style={{ width: "100%" }}>
          <Link to={isLoggedIn ? "/welcome" : "/"}>
            <Image
              src={Logo}
              height={65}
              preview={false}
              data-testid="logo-image"
            />
          </Link>
        </Col>
        <Col
          span={21}
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
          {/* EOL Login button */}
          {/* TODO:: DELETE THIS */}
          {/* <Space size={12} className="navigation-container">
            {isLoggedIn
              ? authMenus
                  .filter((x) => x.role.includes(userRole))
                  .map((x, xi) => (
                    <Link
                      key={`auth-nav-menu-${xi}`}
                      data-testid={x.testid}
                      to={x.path}
                    >
                      {x.name}
                    </Link>
                  ))
              : generalMenus.map((x, xi) => (
                  <Link
                    key={`general-nav-menu-${xi}`}
                    data-testid={x.testid}
                    to={x.path}
                  >
                    {x.name}
                  </Link>
                ))}
            {!isLoggedIn ? (
              <Link className="nav-sign-in" to="/login">
                {" "}
                Sign in
              </Link>
            ) : (
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
            )}
          </Space> */}
          {/* EOL OF TODO:: */}
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

  if (pagesWithNoSider.includes(pathname) || isResetPasswordPage) {
    return (
      <Layout>
        {!pagesWithNoHeader.includes(pathname) && !isResetPasswordPage ? (
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
