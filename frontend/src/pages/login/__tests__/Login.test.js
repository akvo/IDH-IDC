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
    UserState.update((s) => {
      s.id = 0;
      s.email = null;
      s.role = null;
      s.tools = [];
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

  describe("Branding & Guidance UI", () => {
    it("renders toolkit branding: Better Income Toolkit titles and logo", () => {
      renderComponent();

      expect(screen.getByText("Better Income")).toBeInTheDocument();
      expect(screen.getByText("Toolkit")).toBeInTheDocument();
      expect(
        screen.getByText("Welcome to the Better Income Toolkit")
      ).toBeInTheDocument();
      expect(screen.getByTestId("logo-image")).toBeInTheDocument();
    });

    it("renders Academy registration callout link pointing to /register", () => {
      renderComponent();

      const registerLink = screen.getByTestId("link-register-academy");
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
      expect(screen.getByText(/New to the Academy\?/i)).toBeInTheDocument();
      expect(screen.getByText(/Register for free/i)).toBeInTheDocument();
    });

    it("renders IDC request callout with support email link", () => {
      renderComponent();

      expect(
        screen.getByText(/Need access to the Income Driver Calculator\?/i)
      ).toBeInTheDocument();
      const mailLink = screen.getByRole("link", {
        name: "livingincome@idhtrade.org",
      });
      expect(mailLink).toHaveAttribute(
        "href",
        "mailto:livingincome@idhtrade.org"
      );
    });

    it("renders verified alert when ?verified=true is present in query parameters", () => {
      renderComponent(["/login?verified=true"]);

      expect(screen.getByTestId("alert-verified")).toBeInTheDocument();
      expect(screen.getByText("Email Verified")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your email has been verified successfully. Please sign in to access your account."
        )
      ).toBeInTheDocument();
    });

    it("does not render verified alert when ?verified=true is absent", () => {
      renderComponent(["/login"]);

      expect(screen.queryByTestId("alert-verified")).not.toBeInTheDocument();
    });
  });

  describe("Authentication & Smart Redirection Engine", () => {
    it("redirects IDC user to default IDC dashboard when no redirect param is given", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-idc",
          user: {
            id: 10,
            fullname: "IDC Farmer",
            email: "farmer@akvo.org",
            role: "user",
            active: true,
            tools: ["idc"],
          },
        },
      });

      renderComponent(["/login"]);

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

      expect(UserState.getRawState().tools).toEqual(["idc"]);
    });

    it("redirects IDC user to safe deep link from ?redirect parameter", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-dual",
          user: {
            id: 11,
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

    it("redirects Academy-only user to /academy default route", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-academy",
          user: {
            id: 12,
            fullname: "Academy Student",
            email: "student@academy.org",
            role: "user",
            active: true,
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "student@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "student123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.landing, {
          replace: true,
          state: { fromLogin: true },
        });
      });

      expect(UserState.getRawState().tools).toEqual(["academy"]);
    });

    it("intercepts Academy-only user trying to access IDC route and redirects to /academy with unauthorizedIDC state", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-academy-intercept",
          user: {
            id: 13,
            email: "student2@academy.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?redirect=/income-driver-calculator/cases/10"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "student2@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "student123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(routePath.academy.landing, {
          replace: true,
          state: { fromLogin: true, unauthorizedIDC: true },
        });
      });
    });

    it("allows Academy-only user to access safe Academy deep link", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-academy-deeplink",
          user: {
            id: 14,
            email: "student3@academy.org",
            role: "user",
            tools: ["academy"],
          },
        },
      });

      renderComponent(["/login?redirect=/academy/courses"]);

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "student3@academy.org" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "student123" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/academy/courses", {
          replace: true,
          state: { fromLogin: true },
        });
      });
    });

    it("blocks open redirect attacks (https://evil.com, //evil.com) and defaults to safe route", async () => {
      api.post.mockResolvedValueOnce({
        data: {
          access_token: "mock-token-safe",
          user: {
            id: 15,
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

    it("displays error message on 401 Unauthorized response", async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { detail: "Incorrect username or password" },
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
        expect(
          screen.getByText(/Login failed\. Incorrect username or password/i)
        ).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Forgot Password Flow", () => {
    it("toggles to Reset Password mode and submits reset email request", async () => {
      api.post.mockResolvedValueOnce({ data: { message: "Reset email sent" } });

      renderComponent();

      fireEvent.click(screen.getByTestId("link-forgot-password"));

      expect(
        screen.getByRole("heading", { name: "Reset Password" })
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("toolkit-login-guidance")
      ).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Password")).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "forgot@akvo.org" },
      });
      fireEvent.click(screen.getByTestId("button-login"));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "user/forgot-password",
          expect.any(FormData)
        );
        expect(
          screen.getByText(/Reset Password link has been sent to your email/i)
        ).toBeInTheDocument();
      });
    });
  });
});
