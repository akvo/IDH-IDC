import React, { useMemo, useState } from "react";
import { Layout, Row, Col, Image, Menu, Button, Drawer } from "antd";
import { useCookies } from "react-cookie";
import { UserState } from "../../store";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import { allUserRole } from "../../store/static";
import { routePath } from "../route";
import { MenuOutlined } from "@ant-design/icons";
import { useWindowDimensions } from "../../hooks";

const pagesWithNoSider = ["/", "/login", "/welcome", "/register"];
const pagesWithNoHeader = ["/login", "/register"];
const { Header, Content } = Layout;

const PageHeader = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const { isMobile } = useWindowDimensions();
  const [drawerVisible, setDrawerVisible] = useState(false);

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

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setDrawerVisible(false); // close drawer on navigation
  };

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
      className={isMobile ? "mobile-screen" : ""}
    >
      <Row
        justify={isMobile ? "space-between" : "center"}
        align="middle"
        style={{ width: "100%" }}
      >
        <Col span={isMobile ? 14 : 6} align="start">
          <Link to="/">
            <Row justify="start" align="middle" gutter={[5, 5]}>
              <Col span={isMobile ? 12 : 9}>
                <Image
                  src={Logo}
                  height={50}
                  preview={false}
                  data-testid="logo-image"
                />
              </Col>
              {!isMobile && (
                <Col span={15}>
                  <div className="logo-text">Living Income Roadmap Toolkit</div>
                </Col>
              )}
            </Row>
          </Link>
        </Col>

        {/* Menu toggle (Mobile) or horizontal menu (Desktop) */}
        <Col
          span={isMobile ? 10 : 18}
          align="end"
          testid="nav-container"
          style={
            isMobile
              ? {}
              : {
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
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
              />
              <Drawer
                placement="right"
                closable
                onClose={toggleDrawer}
                open={drawerVisible}
                className="drawer-menu-wrapper"
              >
                <Menu
                  mode="inline"
                  items={menuItems}
                  onClick={handleMenuClick}
                />
              </Drawer>
            </>
          ) : (
            <Menu
              mode="horizontal"
              onClick={handleMenuClick}
              items={menuItems}
              style={{ borderBottom: "none" }}
              className="navigation-container"
            />
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
          <PageHeader isLoggedIn={isLoggedIn} />
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
      <PageHeader isLoggedIn={isLoggedIn} />
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
