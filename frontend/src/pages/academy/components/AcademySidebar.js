import React, { useMemo } from "react";
import { Layout, Input, Menu, Button, Divider } from "antd";
import {
  HomeOutlined,
  SearchOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { routePath } from "../../../components/route";

const mainMenuItems = [
  {
    key: routePath.academy.overview,
    label: "My overview",
    icon: <HomeOutlined />,
  },
  {
    key: routePath.academy.courses,
    label: "Course Overview",
    icon: <AppstoreOutlined />,
  },
  {
    key: routePath.academy.resources,
    label: "Academy resources",
    icon: <FolderOpenOutlined />,
  },
];

const accountMenuItems = [
  {
    key: routePath.academy.account,
    label: "Account",
    icon: <UserOutlined />,
  },
  {
    key: routePath.academy.settings,
    label: "Settings",
    icon: <SettingOutlined />,
  },
];

const allMenuKeys = [...mainMenuItems, ...accountMenuItems].map((m) => m.key);

// Match nested routes too, e.g. /academy/courses/chapter/5 -> Course Overview
export const getActiveMenuKey = (pathname = "") =>
  allMenuKeys.find((key) => pathname === key || pathname.startsWith(`${key}/`));

const AcademySidebar = ({ onGetHelp }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedKeys = useMemo(() => {
    const activeKey = getActiveMenuKey(pathname);
    return activeKey ? [activeKey] : [];
  }, [pathname]);

  const handleMenuClick = ({ key }) => navigate(key);

  const handleSearch = (e) => {
    const keyword = e.target.value?.trim();
    if (!keyword) {
      return;
    }
    navigate(
      `${routePath.academy.courses}?search=${encodeURIComponent(keyword)}`
    );
  };

  return (
    <Layout.Sider
      width={220}
      theme="light"
      className="academy-sidebar"
      data-testid="academy-sidebar"
    >
      <nav className="academy-sidebar-inner" aria-label="Academy navigation">
        <div className="academy-sidebar-top">
          <Input
            placeholder="Quick Search"
            allowClear
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
            className="academy-sidebar-search"
            aria-label="Quick Search"
          />
          <Divider className="academy-sidebar-divider" />
          <Menu
            mode="inline"
            items={mainMenuItems}
            selectedKeys={selectedKeys}
            onClick={handleMenuClick}
            className="academy-sidebar-menu"
            data-testid="academy-sidebar-main-menu"
          />
        </div>
        <div className="academy-sidebar-bottom">
          <div className="academy-help-card" data-testid="academy-help-card">
            <h3 className="academy-help-title">Need help?</h3>
            <p className="academy-help-text">
              Ask the facilitators in your RVO cohort, or search the glossary.
            </p>
            <Button block className="academy-help-button" onClick={onGetHelp}>
              Get help
            </Button>
          </div>
          <Divider className="academy-sidebar-divider" />
          <Menu
            mode="inline"
            items={accountMenuItems}
            selectedKeys={selectedKeys}
            onClick={handleMenuClick}
            className="academy-sidebar-menu"
            data-testid="academy-sidebar-account-menu"
          />
        </div>
      </nav>
    </Layout.Sider>
  );
};

export default AcademySidebar;
