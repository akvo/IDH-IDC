import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import Landing from "../Landing";
import { UserState } from "../../../store";
import { defaultUserState } from "../../../store/user";
import { routePath } from "../../../components/route";

jest.mock("../../../hooks", () => ({
  useWindowDimensions: () => ({ isMobile: false, width: 1280, height: 800 }),
  useSignOut: () => jest.fn(),
}));

jest.mock("../../cases/components", () => ({
  IDCSubMenu: () => <div data-testid="idc-sub-menu" />,
}));

jest.mock("../components", () => ({
  Jumbotron: () => <div data-testid="idc-jumbotron" />,
  GetStarted: () => <div data-testid="idc-get-started" />,
  FooterDisclaimer: () => <div data-testid="idc-footer" />,
  FrameworkDrivers: () => <div data-testid="idc-framework-drivers" />,
}));

jest.mock("../../../components/utils", () => ({
  OtherToolsAndResources: () => <div data-testid="other-tools-resources" />,
}));

jest.mock("../../faq", () => ({
  FAQ: () => <div data-testid="idc-faq" />,
}));

const AcademyRedirectProbe = () => {
  const location = useLocation();
  return (
    <div data-testid="academy-redirect-probe">
      {JSON.stringify(location.state || null)}
    </div>
  );
};

describe("IDC Landing Tool Guard", () => {
  beforeEach(() => {
    document.cookie =
      "AUTH_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    UserState.update(() => ({ ...defaultUserState }));
  });

  const renderLanding = () =>
    render(
      <CookiesProvider>
        <MemoryRouter initialEntries={[routePath.idc.landing]}>
          <Routes>
            <Route path={routePath.idc.landing} element={<Landing />} />
            <Route
              path={routePath.academy.landing}
              element={<AcademyRedirectProbe />}
            />
          </Routes>
        </MemoryRouter>
      </CookiesProvider>
    );

  it("allows unauthenticated public visitors to view IDC landing page", () => {
    renderLanding();
    expect(screen.getByTestId("idc-jumbotron")).toBeInTheDocument();
  });

  it("redirects authenticated Academy-only user from /income-driver-calculator to /academy with unauthorizedIDC state", () => {
    UserState.update((s) => {
      s.id = 201;
      s.active = 1;
      s.tools = ["academy"];
    });

    renderLanding();
    expect(screen.queryByTestId("idc-jumbotron")).not.toBeInTheDocument();
    expect(screen.getByTestId("academy-redirect-probe").textContent).toBe(
      JSON.stringify({ unauthorizedIDC: true })
    );
  });

  it("allows authenticated user with 'idc' tool access to view IDC landing page", () => {
    UserState.update((s) => {
      s.id = 202;
      s.active = 1;
      s.tools = ["idc", "academy"];
    });

    renderLanding();
    expect(screen.getByTestId("idc-jumbotron")).toBeInTheDocument();
  });
});
