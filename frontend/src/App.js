import React, { useEffect, useMemo } from "react";
import "./App.scss";
import { Spin } from "antd";
import { useCookies } from "react-cookie";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { PrivateRoutes, routePath } from "./components/route";
import { PageLayout } from "./components/layout";
import { Home } from "./pages/home";
import { Landing } from "./pages/income-driver-calculator";
import { Login, ResetPassword } from "./pages/login";
import { Cases as OldCases, Case as OldCase } from "./pages/old-cases";
import { Cases, Case } from "./pages/cases";
import { NotFound } from "./pages/not-found";
import { Welcome as OldWelcome } from "./pages/old-welcome";
import { Welcome } from "./pages/welcome";
import {
  Users,
  UserForm,
  Tags,
  TagForm,
  Company,
  CompanyForm,
} from "./pages/admin";
import { UserState, UIState, PLState } from "./store";
import { api } from "./lib";
import { adminRole, PROD_HOST } from "./store/static";
import { ExploreStudiesPage } from "./pages/explore-studies";
import orderBy from "lodash/orderBy";
import {
  ProcurementLibrary,
  ProcurementPage,
} from "./pages/procurement-library-v2";
import { OtherResources } from "./pages/other-resources";
import { FAQ } from "./pages/faq";
import {
  CocoaIncomeInventory,
  CocoaIncomeInventoryDashboard,
} from "./pages/cocoa-income-inventory";
import { LivingIncomeBenchmarkExplorer } from "./pages/lib-explorer";
import { useSignOut } from "./hooks";

const optionRoutes = [
  "organisation/options",
  "tag/options",
  "company/options",
  "company/having_case_options",
];

const PLOptionRoutes = ["plv2/category/attributes"];

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when the route changes
  }, [pathname]);

  return null;
};

const App = () => {
  const host = window.location.hostname;
  const navigate = useNavigate();
  const [cookies, ,] = useCookies(["AUTH_TOKEN"]);
  const userRole = UserState.useState((s) => s.role);
  const isInternalUser = UserState.useState((s) => s.internal_user);
  const signOut = useSignOut();

  const isExternalUser = useMemo(() => {
    return userRole === "user" && !isInternalUser;
  }, [userRole, isInternalUser]);

  useEffect(() => {
    const optionApiCalls = optionRoutes.map((url) => api.get(url));
    Promise.all(optionApiCalls)
      .then((res) => {
        const [orgRes, tagRes, companyRes, companyHavingCaseRes] = res;
        UIState.update((s) => {
          s.organisationOptions = orgRes.data;
          s.tagOptions = tagRes.data;
          s.companyOptions = orderBy(companyRes.data, ["label"], ["asc"]);
          s.companyHavingCaseOptions = orderBy(
            companyHavingCaseRes.data,
            ["label"],
            ["asc"]
          );
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  // PL Related State
  useEffect(() => {
    const PLOptionRoutesptionApiCalls = PLOptionRoutes.map((url) =>
      api.get(url)
    );
    Promise.all(PLOptionRoutesptionApiCalls)
      .then((res) => {
        const [catAttrRes] = res;
        PLState.update((s) => {
          s.categoryWithAttributes = catAttrRes.data;
        });
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);
  // EOL PL Related State

  const authTokenAvailable = useMemo(() => {
    const res = cookies?.AUTH_TOKEN && cookies?.AUTH_TOKEN !== "undefined";
    if (res) {
      api.setToken(cookies?.AUTH_TOKEN);
    }
    return res;
  }, [cookies?.AUTH_TOKEN]);

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
            s.company = data.company;
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
  }, [authTokenAvailable, userRole]);

  return (
    <PageLayout testid="page-layout">
      <ScrollToTop />
      {authTokenAvailable && userRole === null ? (
        <div className="loading-container">
          <Spin />
        </div>
      ) : (
        <Routes>
          <Route path="*" element={<NotFound />} />
          {userRole !== null ? (
            <Route element={<PrivateRoutes />}>
              {/* IDC Dashboard after login */}
              <Route
                exact
                path={routePath.idc.dashboard}
                element={<Welcome />}
              />

              {/* Case */}
              {/* Manage new cases step routes */}
              <Route exact path={routePath.idc.cases} element={<Cases />} />
              <Route
                exact
                path={`${routePath.idc.case}/:caseId/:step`}
                element={<Case />}
              />

              {/* TODO:: Delete later Old  Page */}
              {host !== PROD_HOST && (
                <>
                  <Route
                    exact
                    path="/old-welcome"
                    element={<OldWelcome signOut={signOut} />}
                  />
                  <Route exact path="/old-cases" element={<OldCases />} />
                  <Route exact path="/old-cases/new" element={<OldCase />} />
                  <Route
                    exact
                    path="/old-cases/:caseId"
                    element={<OldCase />}
                  />
                </>
              )}
              {/* EOL Case */}

              {/* for all logged in user route */}
              <Route
                exact
                path={routePath.idc.exploreStudies}
                element={<ExploreStudiesPage />}
              />
              <Route
                exact
                path={`${routePath.idc.exploreStudies}/:countryId/:commodityId/:driverId`}
                element={<ExploreStudiesPage />}
              />
              <Route
                exact
                path={routePath.idc.livingIncomeBenchmarkExplorer}
                element={<LivingIncomeBenchmarkExplorer />}
              />
            </Route>
          ) : (
            ""
          )}
          {!isExternalUser ? (
            <Route element={<PrivateRoutes />}>
              <Route
                exact
                path={routePath.idc.exploreStudies}
                element={<ExploreStudiesPage />}
              />
              <Route
                exact
                path={`${routePath.idc.exploreStudies}/:countryId/:commodityId/:driverId`}
                element={<ExploreStudiesPage />}
              />
              <Route
                exact
                path={routePath.idc.livingIncomeBenchmarkExplorer}
                element={<LivingIncomeBenchmarkExplorer />}
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
              <Route exact path="/admin/companies" element={<Company />} />
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

          {/* ITK Homepage */}
          <Route exact path="/" element={<Home />} />
          {/* EOL ITK Homepage */}

          {/* IDC PAGE */}
          <Route exact path={routePath.idc.landing} element={<Landing />} />
          <Route exact path={routePath.idc.login} element={<Login />} />
          <Route exact path={routePath.idc.faq} element={<FAQ />} />
          {/* EOL IDC PAGE */}

          <Route
            exact
            path="/tools-and-resources"
            element={<OtherResources />}
          />
          <Route
            exact
            path="/cocoa-income-inventory"
            element={<CocoaIncomeInventory />}
          />
          <Route
            exact
            path="/cocoa-income-inventory/dashboard"
            element={<CocoaIncomeInventoryDashboard />}
          />
          <Route
            exact
            path="/procurement-library"
            element={<ProcurementLibrary />}
          />
          <Route
            exact
            path="/procurement-library/assessment"
            element={<ProcurementPage.Assessment />}
          />
          <Route
            exact
            path="/procurement-library/intervention-library"
            element={<ProcurementPage.InterventionLibrary />}
          />
          <Route
            exact
            path="/procurement-library/methodology"
            element={<ProcurementPage.Methodology />}
          />
          <Route
            exact
            path="/procurement-library/intervention-library/:practiceId"
            element={<ProcurementPage.Practice />}
          />
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
