import { renderHook, act } from "@testing-library/react";
import { CookiesProvider, Cookies } from "react-cookie";
import useSignOut from "../useSignOut";
import { UserState } from "../../store";
import { defaultUserState } from "../../store/user";
import api from "../../lib/api";

describe("useSignOut", () => {
  const cookies = new Cookies();

  it("clears the session cookie, in-memory token and the whole user state", () => {
    cookies.set("AUTH_TOKEN", "token", { path: "/" });
    api.setToken("token");
    UserState.update((s) => {
      s.id = 1;
      s.fullname = "Kole Johnson";
      s.user_type = "learner";
      s.isExternalRegular = true;
      s.isCaseCreator = true;
      s.user_profile = { first_name: "Kole" };
    });

    const { result } = renderHook(() => useSignOut(), {
      wrapper: CookiesProvider,
    });
    act(() => result.current());

    expect(api.token).toBeNull();
    expect(cookies.get("AUTH_TOKEN")).toBeUndefined();
    expect(UserState.getRawState()).toEqual(defaultUserState);
  });
});
