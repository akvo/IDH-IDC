import React, { useEffect, useMemo, useCallback } from "react";
import "./App.scss";
import { Spin } from "antd";
import { useCookies } from "react-cookie";
import { Routes, Route, useNavigate } from "react-router-dom";
import { PrivateRoutes } from "./components/route";
import { PageLayout } from "./components/layout";
import { Home } from "./pages/home";
import { Landing } from "./pages/landing";
import { Login, ResetPassword } from "./pages/login";
import { Cases as OldCases, Case as OldCase } from "./pages/old-cases";
import { Cases, Case } from "./pages/cases";
import { NotFound } from "./pages/not-found";
import { Welcome } from "./pages/welcome";
import {
  Users,
  UserForm,
  Tags,
  TagForm,
  Company,
  CompanyForm,
} from "./pages/admin";
import { UserState, UIState } from "./store";
import { api } from "./lib";
import { adminRole } from "./store/static";
import { ExploreStudiesPage } from "./pages/explore-studies";
import orderBy from "lodash/orderBy";

const optionRoutes = ["organisation/options", "tag/options", "company/options"];

const App = () => {
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["AUTH_TOKEN"]);
  const userRole = UserState.useState((s) => s.role);
  const isInternalUser = UserState.useState((s) => s.internal_user);

  const isExternalUser = useMemo(() => {
    return userRole === "user" && !isInternalUser;
  }, [userRole, isInternalUser]);

  useEffect(() => {
    const optionApiCalls = optionRoutes.map((url) => api.get(url));
    Promise.all(optionApiCalls)
      .then((res) => {
        const [orgRes, tagRes, companyRes] = res;
        UIState.update((s) => {
          s.organisationOptions = orgRes.data;
          s.tagOptions = tagRes.data;
          s.companyOptions = orderBy(companyRes.data, ["label"], ["asc"]);
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  const authTokenAvailable = useMemo(() => {
    const res = cookies?.AUTH_TOKEN && cookies?.AUTH_TOKEN !== "undefined";
    if (res) {
      api.setToken(cookies?.AUTH_TOKEN);
    }
    return res;
  }, [cookies?.AUTH_TOKEN]);

  const signOut = useCallback(() => {
    removeCookie("AUTH_TOKEN");
    UserState.update((s) => {
      s.id = 0;
      s.fullname = null;
      s.email = null;
      s.role = null;
      s.active = false;
      s.organisation_detail = {
        id: 0,
        name: null,
      };
      s.business_unit_detail = [
        {
          id: 0,
          name: null,
          role: null,
        },
      ];
      s.tags_count = 0;
      s.cases_count = 0;
      s.case_access = [];
      s.internal_user = false;
    });
  }, [removeCookie]);

  useEffect(() => {
    if (authTokenAvailable && userRole === null) {
      api
        .get("user/me")
        .then((res) => {
          const { data } = res;
          UserState.update((s) => {
            s.id = data.id;
            s.fullname = data.fullname;
            s.email = data.email;
            s.role = data.role;
            s.active = data.active;
            s.organisation_detail = data.organisation_detail || [];
            s.business_unit_detail = data.business_unit_detail || [];
            s.tags_count = data.tags_count;
            s.cases_count = data.cases_count;
            s.case_access = data.case_access || [];
            s.internal_user = data.internal_user;
          });
        })
        .catch(() => {
          signOut();
          setTimeout(() => {
            navigate("/");
          }, 300);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authTokenAvailable]);

  return (
    <PageLayout testid="page-layout" signOut={signOut}>
      {authTokenAvailable && userRole === null ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Routes>
          <Route path="*" element={<NotFound />} />
          {userRole !== null ? (
            <Route element={<PrivateRoutes />}>
              <Route
                exact
                path="/welcome"
                element={<Welcome signOut={signOut} />}
              />
              <Route exact path="/home" element={<Home />} />
              <Route exact path="/cases" element={<Cases />} />
              <Route exact path="/case/:caseId/:stepId" element={<Case />} />
              {/*
                TODO :: Delete later
                Old Case Page
              */}
              <Route exact path="/old-cases" element={<OldCases />} />
              <Route exact path="/old-cases/new" element={<OldCase />} />
              <Route exact path="/old-cases/:caseId" element={<OldCase />} />
              {/* EOL Old Case */}
            </Route>
          ) : (
            ""
          )}
          {!isExternalUser ? (
            <Route element={<PrivateRoutes />}>
              <Route
                exact
                path="/explore-studies"
                element={<ExploreStudiesPage />}
              />
              <Route
                exact
                path="/explore-studies/:countryId/:commodityId/:driverId"
                element={<ExploreStudiesPage />}
              />
            </Route>
          ) : (
            ""
          )}
          {adminRole.includes(userRole) ? (
            <Route element={<PrivateRoutes />}>
              <Route exact path="/admin/users" element={<Users />} />
              <Route exact path="/admin/user/new" element={<UserForm />} />
              <Route path="/admin/user/:userId" element={<UserForm />} />
              <Route path="/admin/tags" element={<Tags />} />
              <Route path="/admin/tag/new" element={<TagForm />} />
              <Route path="/admin/tag/:tagId" element={<TagForm />} />
              <Route exact path="/admin/company" element={<Company />} />
              <Route
                exact
                path="/admin/company/new"
                element={<CompanyForm />}
              />
              <Route
                exact
                path="/admin/company/:companyId"
                element={<CompanyForm />}
              />
            </Route>
          ) : (
            ""
          )}
          <Route exact path="/" element={<Landing signOut={signOut} />} />
          <Route exact path="/login" element={<Login />} />
          {/* <Route exact path="/register" element={<Register />} /> */}
          <Route
            exact
            path="/invitation/:tokenId"
            element={<ResetPassword />}
          />
          <Route
            exact
            path="/reset-password/:tokenId"
            element={<ResetPassword />}
          />
        </Routes>
      )}
    </PageLayout>
  );
};

export default App;
