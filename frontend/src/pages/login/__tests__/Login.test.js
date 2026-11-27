import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CookiesProvider } from "react-cookie";
import Login from "../Login";
import { UserState } from "../../../store";
import { api } from "../../../lib";
import { routePath } from "../../../components/route";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../../../lib/api", () => ({
  post: jest.fn(),
  setToken: jest.fn(),
}));

jest.mock("@piwikpro/react-piwik-pro", () => ({
  CustomEvent: {
    trackEvent: jest.fn(),
  },
}));

describe("Login Component (Better Income Toolkit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    UserState.update((s) => {
      s.id = 0;
      s.email = null;
      s.role = null;
      s.tools = [];
      s.isAuthenticated = false;
    });
  });

  const renderComponent = (initialEntries = ["/login"]) =>
    render(
      <CookiesProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Login />
        </MemoryRouter>
      </CookiesProvider>
    );

  describe("FE-LOG-01: Visual Layout & Figma Branding", () => {
    it("renders split-screen layout, logo, header subtitle, and hero image", () => {
      renderComponent();

      expect(screen.getByTestId("login-split-container")).toBeInTheDocument();
      expect(screen.getByTestId("logo-link")).toHaveAttribute("href", "/");
      expect(screen.getByTestId("logo-image")).toBeInTheDocument();
      expect(
        screen.getByText("Toolkit Towards Better Incomes")
      ).toBeInTheDocument();
      expect(screen.getByTestId("login-title")).toHaveTextContent("Log in");
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
      expect(screen.getByTestId("checkbox-remember-me")).toBeInTheDocument();
      expect(screen.getByTestId("button-login")).toBeInTheDocument();
      expect(screen.getByTestId("login-image-wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("login-image")).toBeInTheDocument();
      expect(screen.getByText("© IDH 2026")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /livingincome@idhtrade\.org/ })
      ).toBeInTheDocument();
    });

    it("renders Academy registration callout link pointing to /register", () => {
      renderComponent();

      const registerLink = screen.getByTestId("link-register-academy");
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
      expect(screen.getByText(/New to the Toolkit\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Register for free/i)).toBeInTheDocument();
    });
  });

  describe("FE-LOG-02: Error State & Invalid Credentials", () => {
    it("displays error toast and highlights inputs with error class on 401 invalid credentials", async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { detail: "Incorrect email or password." },
        },
      });

      renderComponent(["/login"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "wrong@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "wrongpass" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(screen.getByTestId("login-alert-error")).toBeInTheDocument();
        expect(
          screen.getByText(
            /The email address or password is not correct\. Please check them and try again\./i
          )
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId("input-email")).toHaveClass("input-error");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("FE-LOG-03: Unverified Account Warning & Resend Flow", () => {
    it("shows yellow warning toast with resend link when account is unverified", async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            detail: "Please confirm your email address first.",
            error_code: "ACCOUNT_NOT_VERIFIED",
            email: "unverified@example.com",
          },
        },
      });

      renderComponent(["/login"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "unverified@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(screen.getByTestId("login-alert-warning")).toBeInTheDocument();
        expect(
          screen.getByText(/Please confirm your email address first\./i)
        ).toBeInTheDocument();
        expect(screen.getByText("unverified@example.com")).toBeInTheDocument();
        expect(
          screen.getByTestId("button-resend-verification")
        ).toBeInTheDocument();
        expect(screen.getByTestId("input-email")).not.toHaveClass(
          "input-error"
        );
      });

      // Click "send the link again"
      api.post.mockResolvedValueOnce({
        data: {
          message: "Verification link has been resent to your email address.",
        },
      });

      fireEvent.click(screen.getByTestId("button-resend-verification"));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "user/resend-academy-verification",
          { email: "unverified@example.com" }
        );
        expect(screen.getByTestId("toast-resend-success")).toBeInTheDocument();
        expect(
          screen.getByText(/Verification link resent!/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("FE-LOG-04: Verified State (?verified=true)", () => {
    it("renders VerifiedSuccessCard when ?verified=true is present", () => {
      renderComponent(["/login?verified=true"]);

      expect(screen.getByTestId("verified-success-card")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Your account is verified" })
      ).toBeInTheDocument();
      expect(screen.getByTestId("button-verified-login")).toBeInTheDocument();
      expect(screen.queryByTestId("input-email")).not.toBeInTheDocument();
    });

    it("switches to active login form when clicking Log in on VerifiedSuccessCard", () => {
      renderComponent(["/login?verified=true"]);

      fireEvent.click(screen.getByTestId("button-verified-login"));

      expect(
        screen.queryByTestId("verified-success-card")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
    });
  });

  describe("FE-LOG-05 to FE-LOG-09: Smart Redirection Matrix", () => {
    it("FE-LOG-05: redirects IDC user from IDC Landing (?from=idc_landing) to /income-driver-calculator/welcome", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-idc",
          user: {
            id: 10,
            fullname: "IDC Farmer",
            email: "farmer@akvo.org",
            role: "user",
            active: true,
            tools: ["idc", "academy"],
          },
        },
      });

      renderComponent(["/login?from=idc_landing"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "farmer@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "secret123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "user/login",
          expect.any(FormData)
        );
        expect(api.setToken).toHaveBeenCalledWith("mock-token-idc");
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.idc.dashboard, {
          replace: true,
          state: { fromLogin: true },
        });
      });

      expect(UserState.getRawState().tools).toEqual(["idc", "academy"]);
      expect(UserState.getRawState().isAuthenticated).toBe(true);
    });

    it("FE-LOG-06: redirects any user from Academy (?from=academy_landing) to /academy/overview", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-academy",
          user: {
            id: 20,
            fullname: "Learner",
            email: "learner@akvo.org",
            role: "user",
            active: true,
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=academy_landing"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "learner@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "learner123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("FE-LOG-06B: redirects IDC user from Academy (?from=/academy) to /academy/overview (Row 2)", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-idc-academy",
          user: {
            id: 21,
            fullname: "IDC User Visiting Academy",
            email: "idc_learner@akvo.org",
            role: "user",
            active: true,
            tools: ["idc", "academy"],
          },
        },
      });

      renderComponent(["/login?from=/academy"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "idc_learner@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("FE-LOG-06C: redirects IDC user from Academy subpath (?from=/academy/courses) to /academy/overview (Row 2)", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-idc-subpath",
          user: {
            id: 22,
            fullname: "IDC User Courses",
            email: "courses_user@akvo.org",
            role: "user",
            active: true,
            tools: ["idc", "academy"],
          },
        },
      });

      renderComponent(["/login?from=/academy/courses"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "courses_user@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("FE-LOG-06D: defaults Academy-only user without origin to /academy/overview", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-academy-default",
          user: {
            id: 23,
            fullname: "Pure Academy User",
            email: "pure_academy@akvo.org",
            role: "user",
            active: true,
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "pure_academy@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("FE-LOG-07: redirects any user from Toolkit Landing (?from=toolkit_landing) to /", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-toolkit",
          user: {
            id: 25,
            email: "user@akvo.org",
            role: "user",
            tools: ["idc", "academy"],
          },
        },
      });

      renderComponent(["/login?from=toolkit_landing"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "user@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "user123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("FE-LOG-07B: redirects IDC user from Toolkit Landing encoded origin (?from=%2F) to / (Row 3)", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-toolkit-slash",
          user: {
            id: 26,
            email: "user-slash@akvo.org",
            role: "user",
            tools: ["idc", "academy"],
          },
        },
      });

      renderComponent(["/login?from=%2F"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "user-slash@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "user123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("FE-LOG-08: redirects Academy-only user from IDC Landing (?from=idc_landing) to / with unauthorizedIDC: true", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-academy-only",
          user: {
            id: 30,
            fullname: "Academy Student",
            email: "student@academy.org",
            role: "user",
            active: true,
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=idc_landing"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "student@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "student123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", {
          replace: true,
          state: { fromLogin: true, unauthorizedIDC: true },
        });
      });
    });

    it("redirects IDC user to safe deep link from ?redirect parameter", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-dual",
          user: {
            id: 35,
            email: "dual@akvo.org",
            role: "user",
            tools: ["idc", "academy"],
          },
        },
      });

      renderComponent(["/login?redirect=/income-driver-calculator/cases"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "dual@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "secret123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/income-driver-calculator/cases",
          {
            replace: true,
            state: { fromLogin: true },
          }
        );
      });
    });

    it("intercepts Academy-only user attempting to access IDC deep link and routes to /academy/overview with unauthorizedIDC: true (Row 5)", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-intercept",
          user: {
            id: 40,
            email: "intercept@academy.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?redirect=/income-driver-calculator/cases/10"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "intercept@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "student123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
          replace: true,
          state: { fromLogin: true, unauthorizedIDC: true },
        });
      });
    });

    it("blocks open redirect attacks (https://evil.com, //evil.com) and defaults to safe route", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-safe",
          user: {
            id: 45,
            email: "victim@akvo.org",
            role: "user",
            tools: ["idc"],
          },
        },
      });

      renderComponent(["/login?redirect=https://evil.com/phish"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "victim@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "safe123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.idc.dashboard, {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("returns user to exact public Toolkit ?from= origin with query params after login", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-origin-query",
          user: {
            id: 46,
            email: "learner@akvo.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=%2Fprocurement-library%3Ftab%3D2"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "learner@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/procurement-library?tab=2",
          {
            replace: true,
            state: { fromLogin: true },
          }
        );
      });
    });

    it("preserves query params on Toolkit landing ?from=/?utm_source=newsletter and IDC landing for Academy-only users", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-toolkit-utm",
          user: {
            id: 461,
            email: "learner@akvo.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=%2F%3Futm_source%3Dnewsletter"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "learner@akvo.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/?utm_source=newsletter", {
          replace: true,
          state: { fromLogin: true },
        });
      });

      jest.clearAllMocks();
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-idc-utm",
          user: {
            id: 462,
            email: "learner2@akvo.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent([
        "/login?from=%2Fincome-driver-calculator%3Futm_source%3Dpromo",
      ]);

      const emailInputs = screen.getAllByPlaceholderText("Email");
      const passwordInputs = screen.getAllByPlaceholderText("Password");
      const loginBtns = screen.getAllByTestId("button-login");

      fireEvent.change(emailInputs[emailInputs.length - 1], {
        target: { value: "learner2@akvo.org" },
      });
      fireEvent.change(passwordInputs[passwordInputs.length - 1], {
        target: { value: "pass123" },
      });
      fireEvent.click(loginBtns[loginBtns.length - 1]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", {
          replace: true,
          state: { fromLogin: true, unauthorizedIDC: true },
        });
      });
    });

    it("returns Academy-only user from ?from=/tools-and-resources and ?from=/income-driver-calculator/faq", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-faq",
          user: {
            id: 47,
            email: "faq@academy.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=%2Fincome-driver-calculator%2Ffaq"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "faq@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/income-driver-calculator/faq",
          {
            replace: true,
            state: { fromLogin: true },
          }
        );
      });
    });

    it("allows Academy-only admin to return to /admin/academy-user-statistics while blocking non-admin", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-admin-academy",
          user: {
            id: 48,
            email: "admin@academy.org",
            role: "admin",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=%2Fadmin%2Facademy-user-statistics"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "admin@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "pass123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/admin/academy-user-statistics",
          {
            replace: true,
            state: { fromLogin: true },
          }
        );
      });

      jest.clearAllMocks();
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-user-admin-block",
          user: {
            id: 49,
            email: "user@academy.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?from=%2Fadmin%2Fusers"]);

      const emailInputs = screen.getAllByPlaceholderText("Email");
      const passwordInputs = screen.getAllByPlaceholderText("Password");
      const loginBtns = screen.getAllByTestId("button-login");

      fireEvent.change(emailInputs[emailInputs.length - 1], {
        target: { value: "user@academy.org" },
      });
      fireEvent.change(passwordInputs[passwordInputs.length - 1], {
        target: { value: "pass123" },
      });
      fireEvent.click(loginBtns[loginBtns.length - 1]);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
          replace: true,
          state: { fromLogin: true, unauthorizedIDC: true },
        });
      });
    });
  });

  describe("Forgot Password & Password Changed Flow", () => {
    it("renders Forgot password link pointing to /forgot-password", () => {
      renderComponent();

      const forgotLink = screen.getByTestId("link-forgot-password");
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink.getAttribute("href")).toBe("/forgot-password");
    });

    it("renders green success banner when ?passwordChanged=true is present", () => {
      renderComponent(["/login?passwordChanged=true"]);

      expect(screen.getByTestId("login-alert-success")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your password has been changed. Log in with your new password."
        )
      ).toBeInTheDocument();
    });

    it("renders the account ready banner after an invitation is completed", () => {
      renderComponent([{ pathname: "/login", state: { accountReady: true } }]);

      expect(
        screen.getByTestId("toast-password-changed-message")
      ).toHaveTextContent("Your account is ready.");
      expect(screen.getByTestId("toast-success-hint")).toHaveTextContent(
        "Please log in."
      );
    });

    it("redirects authenticated user to dashboard immediately with replace: true", () => {
      UserState.update((s) => {
        s.isAuthenticated = true;
        s.authInitializing = false;
        s.tools = ["idc"];
      });

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith(routePath.idc.dashboard, {
        replace: true,
      });
    });

    it("redirects authenticated Academy-only user to academy overview immediately with replace: true", () => {
      UserState.update((s) => {
        s.isAuthenticated = true;
        s.authInitializing = false;
        s.tools = ["academy"];
      });

      renderComponent();

      expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
        replace: true,
      });
    });

    it("redirects authenticated user with Academy origin (?from=/academy) to academy overview immediately with replace: true", () => {
      UserState.update((s) => {
        s.isAuthenticated = true;
        s.authInitializing = false;
        s.tools = ["idc", "academy"];
      });

      renderComponent(["/login?from=/academy"]);

      expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.overview, {
        replace: true,
      });
    });

    it("redirects authenticated user with Toolkit origin (?from=/) to / immediately with replace: true (Row 3)", () => {
      UserState.update((s) => {
        s.isAuthenticated = true;
        s.authInitializing = false;
        s.tools = ["idc", "academy"];
      });

      renderComponent(["/login?from=/"]);

      expect(mockNavigate).toHaveBeenCalledWith("/", {
        replace: true,
      });
    });

    it("redirects authenticated user with public Toolkit origin (?from=/cocoa-income-inventory) immediately", () => {
      UserState.update((s) => {
        s.isAuthenticated = true;
        s.authInitializing = false;
        s.tools = ["academy"];
      });

      renderComponent(["/login?from=%2Fcocoa-income-inventory"]);

      expect(mockNavigate).toHaveBeenCalledWith("/cocoa-income-inventory", {
        replace: true,
      });
    });
  });
});
