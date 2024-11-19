import React, { useState, useMemo } from "react";
import { Breadcrumb, Card, Tabs, Affix } from "antd";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";
import { adminRole } from "../../store/static";
import { UserState } from "../../store";
import { useNavigate, Link } from "react-router-dom";

const tabItems = [
  {
    key: "/admin/users",
    label: "Manage Users",
    value: "user",
  },
  {
    key: "/admin/company",
    label: "Manage Company",
    value: "company",
  },
  {
    key: "/admin/tags",
    label: "Manage Tags",
    value: "tag",
  },
];

// Show tabItems only on manage/table view, hide in form page
const showTabItemsForPath = tabItems.map((x) => x.key);

const ContentLayout = ({
  children,
  wrapperId = "landing",
  breadcrumbItems = [],
  title = null,
  subTitle = null,
  breadcrumbRightContent = null,
}) => {
  const navigate = useNavigate();
  const hasBreadcrumb = breadcrumbItems.length;
  const renderCard = hasBreadcrumb || title;
  const userRole = UserState.useState((s) => s.role);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const handleOnClickTab = (key) => {
    setCurrentPath(key);
    navigate(key);
  };

  const activeTabMenu = useMemo(() => {
    return tabItems.find((x) => currentPath.includes(x.value));
  }, [currentPath]);

  if (!renderCard) {
    return (
      <div className="content-wrapper" id={wrapperId}>
        {children}
      </div>
    );
  }

  return (
    <div>
      <Affix offsetTop={80} id="content-layout">
        <Card className="content-card-container" bordered={false}>
          {hasBreadcrumb ? (
            <div>
              <Breadcrumb
                separator={<RightOutlined />}
                items={breadcrumbItems.map((x, bi) => ({
                  key: bi,
                  title: (
                    <Link to={x.href}>
                      {x.title.toLowerCase() === "home" ? (
                        <HomeOutlined style={{ fontSize: "16px" }} />
                      ) : (
                        x.title
                      )}
                    </Link>
                  ),
                }))}
              />
              {breadcrumbRightContent && (
                <div className="breadcrumb-right-content">
                  {breadcrumbRightContent}
                </div>
              )}
            </div>
          ) : (
            ""
          )}
          {title ? (
            <div
              data-testid="title"
              className="title"
              style={{ paddingTop: "14px" }}
            >
              {title}
            </div>
          ) : (
            ""
          )}
          {subTitle ? (
            <div data-testid="subTitle" className="subTitle">
              {subTitle}
            </div>
          ) : (
            ""
          )}
          {adminRole.includes(userRole) &&
          currentPath.includes("/admin/") &&
          showTabItemsForPath.includes(window.location.pathname) ? (
            <Tabs
              data-testid="admin-tabs-menu"
              activeKey={activeTabMenu.key}
              items={tabItems}
              tabBarGutter={48}
              onChange={handleOnClickTab}
              className="admin-tab-menu-container"
            />
          ) : (
            ""
          )}
        </Card>
      </Affix>
      <div className="content-wrapper" id={wrapperId}>
        {children}
      </div>
    </div>
  );
};

export default ContentLayout;
