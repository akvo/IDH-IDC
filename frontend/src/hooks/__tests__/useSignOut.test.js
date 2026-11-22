import { renderHook, act } from "@testing-library/react";
import { CookiesProvider, Cookies } from "react-cookie";
import useSignOut from "../useSignOut";
import { UserState } from "../../store";
import { defaultUserState } from "../../store/user";
import api from "../../lib/api";

describe("useSignOut", () => {
  const cookies = new Cookies();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls logout endpoint, clears legacy cookie, in-memory token and user state", () => {
    const postSpy = jest
      .spyOn(api, "post")
      .mockResolvedValueOnce({ data: { message: "Logged out" } });
    cookies.set("AUTH_TOKEN", "token", { path: "/" });
    api.setToken("token");
    UserState.update((s) => {
      s.id = 1;
      s.fullname = "Kole Johnson";
      s.isAuthenticated = true;
      s.user_type = "learner";
      s.isExternalRegular = true;
      s.isCaseCreator = true;
      s.user_profile = { first_name: "Kole" };
    });

    const { result } = renderHook(() => useSignOut(), {
      wrapper: CookiesProvider,
    });
    act(() => result.current());

    expect(postSpy).toHaveBeenCalledWith("user/logout");
    expect(api.token).toBeNull();
    expect(cookies.get("AUTH_TOKEN")).toBeUndefined();
    expect(UserState.getRawState()).toEqual({
      ...defaultUserState,
      authInitializing: false,
    });
  });
});
