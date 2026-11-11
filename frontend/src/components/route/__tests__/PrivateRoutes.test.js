import React from "react";
import { render, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { Cookies } from "react-cookie";
import { UserState, defaultUserState } from "../../../store";
import PrivateRoutes from "../PrivateRoutes";
import { routePath, paths } from "../paths";

const LocationCapture = () => {
  const location = useLocation();
  return (
    <div data-testid="academy-redirect-probe">
      {JSON.stringify({
        pathname: location.pathname,
        state: location.state,
      })}
    </div>
  );
};

describe("PrivateRoutes Component", () => {
  beforeEach(() => {
    const cookies = new Cookies();
    cookies.remove("AUTH_TOKEN", { path: "/" });
    act(() => {
      UserState.update(() => ({ ...defaultUserState }));
    });
  });

  it("redirects unauthenticated visitors to /login preserving state.from", () => {
    const LoginProbe = () => {
      const location = useLocation();
      return (
        <div>
          <span>Mock Login Page</span>
          <span data-testid="login-from">{location.state?.from?.pathname}</span>
        </div>
      );
    };

    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route
              path="/private"
              element={<div data-testid="private-route" />}
            />
          </Route>
          <Route path={paths.login} element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("Mock Login Page")).toBeInTheDocument();
    expect(getByTestId("login-from")).toHaveTextContent("/private");
  });

  it("renders Outlet when authToken and user info are available on non-IDC private route", () => {
    const cookies = new Cookies();
    act(() => {
      cookies.set("AUTH_TOKEN", "yourAuthToken", { path: "/" });
      UserState.update((s) => {
        s.id = 1;
        s.active = true;
      });
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/private" element={<div>Mock Private Route</div>} />
          </Route>
          <Route path={paths.login} element={<div>Mock Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("Mock Private Route")).toBeInTheDocument();
  });

  it.each([
    routePath.idc.dashboard,
    routePath.idc.cases,
    `${routePath.idc.case}/42/1`,
    "/admin/users",
  ])(
    "redirects Academy-only user from IDC route (%s) to /academy with unauthorizedIDC state",
    (idcUrl) => {
      const cookies = new Cookies();
      act(() => {
        cookies.set("AUTH_TOKEN", "academyToken", { path: "/" });
        UserState.update((s) => {
          s.id = 2;
          s.active = true;
          s.role = "user";
          s.tools = ["academy"];
        });
      });

      const { getByTestId, queryByTestId } = render(
        <MemoryRouter initialEntries={[idcUrl]}>
          <Routes>
            <Route element={<PrivateRoutes />}>
              <Route
                path={idcUrl}
                element={<div data-testid="idc-protected">Secret IDC</div>}
              />
            </Route>
            <Route
              path={routePath.academy.landing}
              element={<LocationCapture />}
            />
            <Route path={paths.login} element={<div>Mock Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(queryByTestId("idc-protected")).not.toBeInTheDocument();
      const probe = JSON.parse(
        getByTestId("academy-redirect-probe").textContent
      );
      expect(probe.pathname).toBe(routePath.academy.landing);
      expect(probe.state).toEqual({ unauthorizedIDC: true });
    }
  );

  it("denies access on IDC route when user has empty tools array", () => {
    const cookies = new Cookies();
    act(() => {
      cookies.set("AUTH_TOKEN", "emptyToolsToken", { path: "/" });
      UserState.update((s) => {
        s.id = 3;
        s.active = true;
        s.tools = [];
      });
    });

    const { getByTestId, queryByTestId } = render(
      <MemoryRouter initialEntries={[routePath.idc.cases]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route
              path={routePath.idc.cases}
              element={<div data-testid="idc-cases">Cases</div>}
            />
          </Route>
          <Route
            path={routePath.academy.landing}
            element={<LocationCapture />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(queryByTestId("idc-cases")).not.toBeInTheDocument();
    const probe = JSON.parse(getByTestId("academy-redirect-probe").textContent);
    expect(probe.state).toEqual({ unauthorizedIDC: true });
  });

  it("allows Academy-only user onto authenticated /academy/* routes", () => {
    const cookies = new Cookies();
    act(() => {
      cookies.set("AUTH_TOKEN", "academyToken", { path: "/" });
      UserState.update((s) => {
        s.id = 4;
        s.active = true;
        s.tools = ["academy"];
      });
    });

    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/academy/courses"]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route
              path="/academy/courses"
              element={<div data-testid="academy-courses">Courses</div>}
            />
          </Route>
          <Route
            path={routePath.academy.landing}
            element={<LocationCapture />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(getByTestId("academy-courses")).toBeInTheDocument();
  });

  it("allows authorized IDC / dual-access user onto IDC routes without interruption", () => {
    const cookies = new Cookies();
    act(() => {
      cookies.set("AUTH_TOKEN", "idcToken", { path: "/" });
      UserState.update((s) => {
        s.id = 5;
        s.active = true;
        s.tools = ["idc", "academy"];
      });
    });

    const { getByTestId } = render(
      <MemoryRouter initialEntries={[routePath.idc.cases]}>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route
              path={routePath.idc.cases}
              element={<div data-testid="idc-cases">Cases</div>}
            />
          </Route>
          <Route
            path={routePath.academy.landing}
            element={<LocationCapture />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(getByTestId("idc-cases")).toBeInTheDocument();
  });
});
