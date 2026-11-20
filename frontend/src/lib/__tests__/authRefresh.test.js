import axios from "axios";
import api from "../api";
import { isAuthBypassUrl, refreshAccessToken } from "../authRefresh";
import UserState, { defaultUserState } from "../../store/user";

jest.mock("axios");

describe("authRefresh & api 401 single-flight refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.setToken(null);
    UserState.replace({ ...defaultUserState });
  });

  it("identifies auth bypass endpoints correctly", () => {
    expect(isAuthBypassUrl("user/login")).toBe(true);
    expect(isAuthBypassUrl("/api/user/refresh")).toBe(true);
    expect(isAuthBypassUrl("user/logout?foo=1")).toBe(true);
    expect(isAuthBypassUrl("user/me")).toBe(false);
    expect(isAuthBypassUrl("cases/10")).toBe(false);
  });

  it("coalesces concurrent refreshAccessToken calls into one POST /api/user/refresh", async () => {
    let resolveRefresh;
    axios.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      })
    );

    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();
    const p3 = refreshAccessToken();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith("/api/user/refresh", null, {
      withCredentials: true,
    });

    resolveRefresh({
      data: {
        access_token: "fresh-jwt-token",
        user: {
          id: 42,
          fullname: "Ada Lovelace",
          email: "ada@example.com",
          role: "user",
          active: true,
          tools: ["idc", "academy"],
        },
      },
    });

    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
    expect(t1).toBe("fresh-jwt-token");
    expect(t2).toBe("fresh-jwt-token");
    expect(t3).toBe("fresh-jwt-token");
    expect(api.token).toBe("fresh-jwt-token");
    expect(UserState.getRawState().isAuthenticated).toBe(true);
    expect(UserState.getRawState().authInitializing).toBe(false);
    expect(UserState.getRawState().tools).toEqual(["idc", "academy"]);
  });

  it("clears in-memory token and resets UserState when refresh fails", async () => {
    api.setToken("stale-token");
    UserState.update((s) => {
      s.id = 99;
      s.isAuthenticated = true;
    });
    axios.post.mockRejectedValueOnce(new Error("Refresh rejected"));

    await expect(refreshAccessToken()).rejects.toThrow("Refresh rejected");

    expect(api.token).toBeNull();
    expect(UserState.getRawState()).toEqual({
      ...defaultUserState,
      authInitializing: false,
    });
  });

  it("refreshes once and retries failed api.get on 401", async () => {
    api.setToken("expired-token");
    axios.mockRejectedValueOnce({ response: { status: 401 } });
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: "rotated-token",
        user: { id: 7, role: "user", active: true, tools: ["idc"] },
      },
    });
    axios.mockResolvedValueOnce({ data: { ok: true } });

    const res = await api.get("cases");

    expect(res.data).toEqual({ ok: true });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(2);
    expect(axios).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: "cases",
        headers: expect.objectContaining({
          Authorization: "Bearer rotated-token",
        }),
      })
    );
  });

  it("does not trigger refresh on 401 from auth bypass URLs", async () => {
    axios.mockRejectedValueOnce({ response: { status: 401 } });

    await expect(api.post("user/login", new FormData())).rejects.toEqual({
      response: { status: 401 },
    });
    expect(axios.post).not.toHaveBeenCalled();
  });
});
