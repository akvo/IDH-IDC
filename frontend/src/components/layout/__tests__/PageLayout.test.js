import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Cookies } from "react-cookie";
import PageLayout from "../PageLayout";
import { UserState } from "../../../store";
import { routePath } from "../../route";

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PageLayout>
        <div>content</div>
      </PageLayout>
    </MemoryRouter>
  );

const getSelectedNavText = () =>
  Array.from(
    document.querySelectorAll(".navigation-container .ant-menu-item-selected")
  ).map((el) => el.textContent);

describe("PageLayout header on Academy pages", () => {
  const cookies = new Cookies();

  beforeEach(() => {
    act(() => {
      cookies.set("AUTH_TOKEN", "token", { path: "/" });
      UserState.update((s) => {
        s.id = 1;
        s.active = true;
        s.fullname = "Kole Johnson";
        s.user_profile = null;
      });
    });
  });

  afterEach(() => {
    act(() => {
      cookies.remove("AUTH_TOKEN", { path: "/" });
      UserState.update((s) => {
        s.id = 0;
        s.active = false;
        s.fullname = null;
        s.user_profile = null;
      });
    });
  });

  it("keeps Academy highlighted on nested academy pages", () => {
    renderAt(routePath.academy.courses);
    expect(getSelectedNavText()).toEqual(["Academy"]);
  });

  it("shows the user's initials linking to the account page", () => {
    renderAt(routePath.academy.overview);
    const avatar = screen.getByTestId("header-user-avatar");
    expect(avatar).toHaveTextContent("KJ");
    expect(avatar).toHaveAttribute("href", routePath.academy.account);
  });

  it("prefers the learner profile name for the initials", () => {
    act(() => {
      UserState.update((s) => {
        s.user_profile = { first_name: "Olivia", last_name: "Reyes" };
      });
    });
    renderAt(routePath.academy.overview);
    expect(screen.getByTestId("header-user-avatar")).toHaveTextContent("OR");
  });

  it("does not show the avatar outside the academy shell", () => {
    renderAt(routePath.academy.landing);
    expect(screen.queryByTestId("header-user-avatar")).not.toBeInTheDocument();
    renderAt(routePath.idc.cases);
    expect(screen.queryByTestId("header-user-avatar")).not.toBeInTheDocument();
  });

  it("does not show the avatar when signed out", () => {
    act(() => {
      cookies.remove("AUTH_TOKEN", { path: "/" });
      UserState.update((s) => {
        s.id = 0;
        s.active = false;
      });
    });
    renderAt(routePath.academy.overview);
    expect(screen.queryByTestId("header-user-avatar")).not.toBeInTheDocument();
  });
});
