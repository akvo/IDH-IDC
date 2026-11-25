import React, { useEffect, useMemo, useState } from "react";
import "./App.scss";
import { useCookies } from "react-cookie";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  PrivateRoutes,
  RedirectWithSearch,
  routePath,
} from "./components/route";
import { AccountShell, PageLayout } from "./components/layout";
import { Home } from "./pages/home";
import { Landing } from "./pages/income-driver-calculator";
import {
  Login,
  ResetPassword,
  Register,
  VerifyAcademy,
  ForgotPassword,
} from "./pages/login";
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
import { UserState, UIState, PLState, syncUserState } from "./store";
import { api } from "./lib";
import { AuthInitContext, refreshAccessToken } from "./lib/authRefresh";
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
import {
  AcademyLanding,
  AcademyLayout,
  AcademyOverviewPage,
  AcademyResourcesPage,
  AcademySettingsPage,
  CourseOverviewPage,
  ModuleLearningPage,
  MyProfilePage,
} from "./pages/academy";
import { LivingIncomeBenchmarkExplorer } from "./pages/lib-explorer";
import { useSignOut, useMatomoPageView } from "./hooks";
import { ScrollToHash } from "./components/utils";

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
  const [, , removeCookie] = useCookies(["AUTH_TOKEN"]);
  const userRole = UserState.useState((s) => s.role);
  const isInternalUser = UserState.useState((s) => s.internal_user);
  const signOut = useSignOut();
  const [authHydrated, setAuthHydrated] = useState(() => Boolean(api.token));

  // Matomo Page View Tracking
  useMatomoPageView();

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

  useEffect(() => {
    let cancelled = false;

    if (api.token) {
      if (userRole === null) {
        api
          .get("user/me")
          .then((res) => {
            if (!cancelled) {
              syncUserState(res?.data);
            }
          })
          .catch(() => {
            if (!cancelled) {
              signOut();
              setTimeout(() => {
                navigate("/");
              }, 300);
            }
          })
          .finally(() => {
            if (!cancelled) {
              setAuthHydrated(true);
            }
          });
      } else {
        setAuthHydrated(true);
      }
      return () => {
        cancelled = true;
      };
    }

    refreshAccessToken()
      .catch(() => {
        if (!cancelled) {
          removeCookie("AUTH_TOKEN", { path: "/" });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthInitContext.Provider value={!authHydrated}>
      <PageLayout testid="page-layout">
        <ScrollToHash />
        <ScrollToTop />
        <Routes>
          {/* Route path="*" element={<NotFound />} */}
          {/* {userRole !== null ? ( */}
          <Route element={<PrivateRoutes />}>
            {/* IDC Dashboard after login */}
            <Route exact path={routePath.idc.dashboard} element={<Welcome />} />

            {/* My profile and Settings outside the Academy */}
            <Route
              exact
              path={routePath.profile}
              element={
                <AccountShell>
                  <MyProfilePage />
                </AccountShell>
              }
            />
            <Route
              exact
              path={routePath.settings}
              element={
                <AccountShell>
                  <AcademySettingsPage />
                </AccountShell>
              }
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
                <Route exact path="/old-cases/:caseId" element={<OldCase />} />
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

            {/* Academy (authenticated) */}
            <Route element={<AcademyLayout />}>
              <Route
                exact
                path={routePath.academy.overview}
                element={<AcademyOverviewPage />}
              />
              <Route
                exact
                path={routePath.academy.courses}
                element={<CourseOverviewPage />}
              />
              <Route
                exact
                path={routePath.academy.resources}
                element={<AcademyResourcesPage />}
              />
              <Route
                exact
                path={routePath.academy.profile}
                element={<MyProfilePage />}
              />
              <Route
                exact
                path={routePath.academy.account}
                element={<RedirectWithSearch to={routePath.academy.profile} />}
              />
              <Route
                exact
                path={routePath.academy.settings}
                element={<AcademySettingsPage />}
              />
            </Route>
            {/* Full-width learning frame, outside the sidebar shell */}
            <Route
              exact
              path={`${routePath.academy.modules}/:moduleId`}
              element={<ModuleLearningPage />}
            />
            {/* EOL Academy */}
          </Route>
          {/* ) : (
            ""
          )} */}
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
          <Route exact path="/login" element={<Login />} />
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
          <Route exact path="/academy" element={<AcademyLanding />} />
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
          {/*
          DISABLE PL methodology page
          <Route
            exact
            path="/procurement-library/methodology"
            element={<ProcurementPage.Methodology />}
          />
          EOL DISABLE PL methodology page
          */}
          <Route
            exact
            path="/procurement-library/intervention-library/:practiceId"
            element={<ProcurementPage.Practice />}
          />
          <Route exact path="/register" element={<Register />} />
          <Route exact path="/verify-academy" element={<VerifyAcademy />} />
          <Route exact path="/forgot-password" element={<ForgotPassword />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageLayout>
    </AuthInitContext.Provider>
  );
};

export default App;
