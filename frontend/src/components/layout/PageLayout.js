import React, { useMemo } from "react";
import { Layout, Row, Col, Image, Menu } from "antd";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import { allUserRole } from "../../store/static";
import { routePath } from "../route";

const pagesWithNoSider = ["/", "/login", "/welcome", "/register"];
const pagesWithNoHeader = ["/login", "/register"];
const { Header, Content } = Layout;

const PageHeader = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  const menuItems = useMemo(() => {
    const menuList = [
      {
        testid: "nav-menu-idc",
        label: "Income Driver Calculator",
        key: isLoggedIn ? routePath.idc.dashboard : routePath.idc.landing,
        role: [],
        isPublic: true,
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
    ];
    // const filterByUser = (item) => {
    //   if (!userRole && !isLoggedIn) {
    //     return item.isPublic;
    //   }
    //   if (userRole && isLoggedIn) {
    //     if (item?.isInternalUser) {
    //       return item?.role?.includes(userRole) || isInternalUser;
    //     }
    //     return item?.role?.includes(userRole);
    //   }
    //   return false;
    // };
    const items = menuList.filter((item) => !item?.hide);
    // .filter((item) => {
    //   const children = item?.children?.filter((child) => {
    //     return filterByUser(child);
    //   });
    //   item["children"] = children;
    //   return filterByUser(item);
    // });
    return items;
  }, [isLoggedIn]);

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
