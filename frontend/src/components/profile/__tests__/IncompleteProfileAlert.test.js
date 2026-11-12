import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import IncompleteProfileAlert, {
  isUserProfileIncomplete,
} from "../IncompleteProfileAlert";
import { UserState, defaultUserState } from "../../../store";

describe("IncompleteProfileAlert & isUserProfileIncomplete", () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      UserState.update(() => ({ ...defaultUserState }));
    });
  });

  describe("isUserProfileIncomplete Helper", () => {
    it("returns false when user is null, undefined, or empty", () => {
      expect(isUserProfileIncomplete(null)).toBe(false);
      expect(isUserProfileIncomplete()).toBe(false);
      expect(isUserProfileIncomplete({})).toBe(false);
    });

    it("returns false when user is logged out (id === 0)", () => {
      expect(isUserProfileIncomplete({ id: 0, fullname: "" })).toBe(false);
      expect(
        isUserProfileIncomplete({
          id: 0,
          fullname: "Guest",
          tools: ["idc"],
          company: null,
        })
      ).toBe(false);
    });

    it("returns true when logged-in user has null, undefined, or empty fullname", () => {
      expect(
        isUserProfileIncomplete({
          id: 1,
          fullname: null,
          tools: ["academy"],
          company_name: "Sustainable Co",
        })
      ).toBe(true);

      expect(
        isUserProfileIncomplete({
          id: 1,
          fullname: "",
          tools: ["academy"],
          company_name: "Sustainable Co",
        })
      ).toBe(true);

      expect(
        isUserProfileIncomplete({
          id: 1,
          fullname: "   ",
          tools: ["academy"],
          company_name: "Sustainable Co",
        })
      ).toBe(true);
    });

    it("returns true when IDC user is missing both company and company_name", () => {
      expect(
        isUserProfileIncomplete({
          id: 2,
          fullname: "IDC Farmer",
          tools: ["idc"],
          company: null,
          company_name: null,
        })
      ).toBe(true);

      expect(
        isUserProfileIncomplete({
          id: 2,
          fullname: "IDC Farmer",
          tools: ["idc"],
          company: null,
          company_name: "   ",
        })
      ).toBe(true);
    });

    it("returns false when IDC user has company id or company_name", () => {
      expect(
        isUserProfileIncomplete({
          id: 2,
          fullname: "IDC Farmer",
          tools: ["idc"],
          company: 15,
          company_name: null,
        })
      ).toBe(false);

      expect(
        isUserProfileIncomplete({
          id: 2,
          fullname: "IDC Farmer",
          tools: ["idc"],
          company: null,
          company_name: "IDH Partner Org",
        })
      ).toBe(false);
    });

    it("returns true when Academy-only user is missing company in user_profile and company_name", () => {
      expect(
        isUserProfileIncomplete({
          id: 3,
          fullname: "Academy Learner",
          tools: ["academy"],
          company: null,
          company_name: null,
          user_profile: null,
        })
      ).toBe(true);

      expect(
        isUserProfileIncomplete({
          id: 3,
          fullname: "Academy Learner",
          tools: ["academy"],
          company: null,
          company_name: "",
          user_profile: { company_name: "   " },
        })
      ).toBe(true);
    });

    it("returns false when Academy-only user has company_name in user_profile or root", () => {
      expect(
        isUserProfileIncomplete({
          id: 3,
          fullname: "Academy Learner",
          tools: ["academy"],
          company: null,
          company_name: null,
          user_profile: { company_name: "Coffee Innovators" },
        })
      ).toBe(false);

      expect(
        isUserProfileIncomplete({
          id: 3,
          fullname: "Academy Learner",
          tools: ["academy"],
          company: null,
          company_name: "Tea Cooperatives Ltd",
          user_profile: null,
        })
      ).toBe(false);
    });

    it("evaluates dual-tool users requiring both fullname and company details", () => {
      expect(
        isUserProfileIncomplete({
          id: 4,
          fullname: "Dual Tool User",
          tools: ["idc", "academy"],
          company: null,
          company_name: null,
        })
      ).toBe(true);

      expect(
        isUserProfileIncomplete({
          id: 4,
          fullname: "Dual Tool User",
          tools: ["idc", "academy"],
          company: 20,
          company_name: "Global Agro",
        })
      ).toBe(false);

      expect(
        isUserProfileIncomplete({
          id: 5,
          fullname: "Dual Tool Profile User",
          tools: ["idc", "academy"],
          company: null,
          company_name: null,
          user_profile: { company_name: "Akvo" },
        })
      ).toBe(false);

      expect(
        isUserProfileIncomplete({
          id: 6,
          fullname: "Internal Staff",
          tools: ["idc", "academy"],
          internal_user: true,
          company: null,
          company_name: null,
          user_profile: null,
          organisation_detail: { id: 1, name: "Akvo" },
        })
      ).toBe(false);
    });
  });

  describe("IncompleteProfileAlert Component", () => {
    const incompleteUser = {
      id: 10,
      fullname: "Incomplete User",
      email: "incomplete@example.com",
      role: "user",
      tools: ["academy"],
      company: null,
      company_name: null,
      user_profile: null,
      active: true,
    };

    const completeUser = {
      id: 11,
      fullname: "Complete User",
      email: "complete@example.com",
      role: "user",
      tools: ["academy"],
      company: null,
      company_name: "Full Organization",
      user_profile: { company_name: "Full Organization" },
      active: true,
    };

    const renderAlert = (props = {}, storeUser = null) => {
      if (storeUser) {
        act(() => {
          UserState.update((s) => {
            Object.assign(s, storeUser);
          });
        });
      }
      return render(
        <MemoryRouter>
          <IncompleteProfileAlert {...props} />
        </MemoryRouter>
      );
    };

    it("renders alert with data-testid='incomplete-profile-alert' when profile is incomplete (via store)", () => {
      renderAlert({}, incompleteUser);

      expect(
        screen.getByTestId("incomplete-profile-alert")
      ).toBeInTheDocument();
      expect(screen.getByText(/complete your profile/i)).toBeInTheDocument();
    });

    it("renders alert when profile is incomplete (via user prop)", () => {
      renderAlert({ user: incompleteUser });

      expect(
        screen.getByTestId("incomplete-profile-alert")
      ).toBeInTheDocument();
    });

    it("renders nothing when user is logged out (id === 0)", () => {
      renderAlert(
        {},
        {
          id: 0,
          fullname: "",
          active: false,
        }
      );

      expect(
        screen.queryByTestId("incomplete-profile-alert")
      ).not.toBeInTheDocument();
    });

    it("renders nothing when user profile is completely filled", () => {
      renderAlert({}, completeUser);

      expect(
        screen.queryByTestId("incomplete-profile-alert")
      ).not.toBeInTheDocument();
    });

    it("renders action link to /profile when showActionLink is true (default)", () => {
      renderAlert({}, incompleteUser);

      const link =
        screen.queryByTestId("link-complete-profile") ||
        screen.getByRole("link", { name: /profile/i });

      expect(link).toBeInTheDocument();
      expect(
        link.getAttribute("href") || link.closest("a")?.getAttribute("href")
      ).toMatch(/\/profile$/);
    });

    it("hides action link when showActionLink is false", () => {
      renderAlert({ showActionLink: false }, incompleteUser);

      expect(
        screen.getByTestId("incomplete-profile-alert")
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("link-complete-profile")
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("dismisses alert, sets localStorage, and hides on close button click", () => {
      renderAlert({}, incompleteUser);

      expect(
        screen.getByTestId("incomplete-profile-alert")
      ).toBeInTheDocument();

      const closeBtn =
        screen.queryByRole("button", { name: /close/i }) ||
        screen.queryByLabelText("Close") ||
        document.querySelector(".ant-alert-close-icon") ||
        document.querySelector("[aria-label='close']");

      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);

      expect(
        localStorage.getItem(`idc_profile_alert_dismissed_${incompleteUser.id}`)
      ).toBe("true");

      expect(
        screen.queryByTestId("incomplete-profile-alert")
      ).not.toBeInTheDocument();
    });

    it("stays hidden on re-render when dismissed flag exists in localStorage", () => {
      localStorage.setItem(
        `idc_profile_alert_dismissed_${incompleteUser.id}`,
        "true"
      );

      renderAlert({}, incompleteUser);

      expect(
        screen.queryByTestId("incomplete-profile-alert")
      ).not.toBeInTheDocument();
    });

    it("applies custom className when provided", () => {
      renderAlert({ className: "custom-profile-alert" }, incompleteUser);

      const alertElement = screen.getByTestId("incomplete-profile-alert");
      expect(alertElement).toHaveClass("custom-profile-alert");
    });
  });
});
