import React, { useCallback } from "react";
import { Layout, ConfigProvider } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import AcademySidebar from "./AcademySidebar";
import AcademyFooter from "./AcademyFooter";
import ChatbotFloatButton from "./ChatbotFloatButton";
import { routePath } from "../../../components/route";
import { ACADEMY_THEME } from "../utils";
import "./AcademyLayout.scss";

// The current user (incl. user_profile for the header avatar) is loaded into
// UserState by App's GET /user/me on startup, so the shell does not refetch it.
const AcademyLayout = () => {
  const navigate = useNavigate();

  const handleGetHelp = useCallback(
    () => navigate(routePath.idc.faq),
    [navigate]
  );

  return (
    <ConfigProvider theme={ACADEMY_THEME}>
      <div className="academy-shell" data-testid="academy-layout">
        <Layout className="academy-shell-body">
          <AcademySidebar onGetHelp={handleGetHelp} />
          <Layout.Content
            className="academy-shell-content"
            data-testid="academy-content"
          >
            <Outlet />
          </Layout.Content>
        </Layout>
        <AcademyFooter />
        <ChatbotFloatButton />
      </div>
    </ConfigProvider>
  );
};

export default AcademyLayout;
