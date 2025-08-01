import { useMemo, useState } from "react";
import "./idc-sub-menu.scss";
import { Space, Menu, Affix } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LoadingOutlined, LogoutOutlined } from "@ant-design/icons";
import { UserState } from "../../../store";
import {
  adminRole,
  allUserRole,
  LINK_TO_CASE_PROD,
  PROD_HOST,
} from "../../../store/static";
import { routePath } from "../../../components/route";
import { showIDCSubMenu } from "../../../components/route";
import { useSignOut } from "../../../hooks";

const IDCSubMenu = () => {
  const host = window.location.hostname;
  const navigate = useNavigate();
  const {
    role: userRole,
    internal_user: isInternalUser,
    id: isLoggedIn,
  } = UserState.useState();
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const signOut = useSignOut();

  const activePathname = useMemo(() => {
    const paths = location.pathname.split("/");
    const idcPath = paths?.[1] || "";
    const pagePath = paths?.[2] || "";
    if (pagePath === "") {
      return `/${idcPath}`;
    }
    return `/${idcPath}/${pagePath}`;
  }, [location]);

  const subMenuItems = useMemo(() => {
    const menuList = [
      {
        testid: "nav-menu-cases",
        label: "Cases Overview",
        key: host === PROD_HOST ? LINK_TO_CASE_PROD : routePath.idc.cases,
        role: allUserRole,
        isPublic: false,
      },
      {
        testid: "nav-menu-lib-explorer",
        label: "Living income benchmark explorer",
        key: routePath.idc.livingIncomeBenchmarkExplorer,
        isInternalUser: false,
        role: allUserRole,
      },
      {
        testid: "nav-menu-explore-studies",
        label: "Explore other studies",
        key: routePath.idc.exploreStudies,
        isInternalUser: false,
        hideForExternalUser: true,
        role: allUserRole,
      },
      {
        testid: "nav-menu-faq",
        label: "FAQ",
        key: routePath.idc.faq,
        isPublic: false,
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
        testid: "nav-menu-about",
        label: "About",
        key: routePath.idc.landing,
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
        if (item?.hideForExternalUser && !isInternalUser) {
          return item?.role?.includes(userRole) && !item?.hideForExternalUser;
        }
        return item?.role?.includes(userRole);
      }
      return false;
    };
    const items = menuList
      .filter((item) => !item?.hide)
      .filter((item) => filterByUser(item))
      .filter((item) => {
        const children = item?.children?.filter((child) => {
          return filterByUser(child);
        });
        item["children"] = children;
        return filterByUser(item);
      });
    return items;
  }, [userRole, isInternalUser, isLoggedIn, host]);

  if (!isLoggedIn || !showIDCSubMenu()) {
    return "";
  }

  return (
    <div id="idc-sub-menu">
      <Affix
        offsetTop={80}
        style={{ width: "100%" }}
        className="idc-sub-menu-affix"
      >
        <div className="idc-sub-menu-wrapper">
          <Menu
            mode="horizontal"
            items={subMenuItems}
            className="idc-sub-menu-navigation-container"
            onClick={({ key }) => navigate(key)}
            selectedKeys={[activePathname]}
          />
          <Link
            className="nav-sign-in"
            onClick={() => {
              setLoading(true);
              signOut();
              setTimeout(() => {
                setLoading(false);
                navigate(routePath.idc.landing);
              }, 500);
            }}
          >
            {loading ? (
              <Space>
                <LoadingOutlined />
                Sign out
              </Space>
            ) : (
              <Space>
                Logout
                <LogoutOutlined />
              </Space>
            )}
          </Link>
        </div>
      </Affix>
    </div>
  );
};

export default IDCSubMenu;
