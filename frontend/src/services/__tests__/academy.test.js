import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { message } from "antd";
import academyService, {
  academyClient,
  normaliseError,
  DEFAULT_ERROR_MESSAGE,
} from "../academy";
import api from "../../lib/api";

describe("academy service", () => {
  let mock;
  let errorToast;

  beforeEach(() => {
    mock = new MockAdapter(academyClient);
    errorToast = jest.spyOn(message, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
    api.setToken(null);
  });

  it("getMe returns the current user", async () => {
    const user = { id: 1, fullname: "Kole Johnson", user_profile: null };
    mock.onGet("user/me").reply(200, user);
    await expect(academyService.getMe()).resolves.toEqual(user);
  });

  it("sends the session token as a bearer header", async () => {
    api.setToken("abc123");
    mock.onGet("user/me").reply((req) => [200, req.headers]);
    const headers = await academyService.getMe();
    expect(headers.Authorization).toBe("Bearer abc123");
  });

  it("omits the Authorization header without a session", async () => {
    mock.onGet("user/me").reply((req) => [200, req.headers]);
    const headers = await academyService.getMe();
    expect(headers.Authorization).toBeUndefined();
  });

  it("rejects 4xx errors with the API detail and no global toast", async () => {
    mock.onGet("user/me").reply(403, { detail: "Forbidden" });
    await expect(academyService.getMe()).rejects.toEqual({
      status: 403,
      message: "Forbidden",
    });
    expect(errorToast).not.toHaveBeenCalled();
  });

  it("shows one deduplicated global toast for server errors", async () => {
    mock.onGet("user/me").reply(500);
    await expect(academyService.getMe()).rejects.toMatchObject({
      status: 500,
    });
    expect(errorToast).toHaveBeenCalledWith({
      content: DEFAULT_ERROR_MESSAGE,
      key: "academy-api-error",
    });
  });

  it("shows a global toast for network failures", async () => {
    mock.onGet("user/me").networkError();
    await expect(academyService.getMe()).rejects.toMatchObject({
      status: null,
    });
    expect(errorToast).toHaveBeenCalledTimes(1);
  });

  it("passes cancelled requests through without a toast", async () => {
    const source = axios.CancelToken.source();
    mock.onGet("user/me").reply(200, {});
    source.cancel("navigated away");
    const error = await academyClient
      .get("user/me", { cancelToken: source.token })
      .catch((e) => e);
    expect(axios.isCancel(error)).toBe(true);
    expect(errorToast).not.toHaveBeenCalled();
  });
});

describe("normaliseError", () => {
  it("uses a string API detail", () => {
    expect(
      normaliseError({ response: { status: 404, data: { detail: "Nope" } } })
    ).toEqual({ status: 404, message: "Nope" });
  });

  it("falls back to the axios message for validation error arrays", () => {
    expect(
      normaliseError({
        message: "Request failed with status code 422",
        response: { status: 422, data: { detail: [{ msg: "bad" }] } },
      })
    ).toEqual({
      status: 422,
      message: "Request failed with status code 422",
    });
  });

  it("falls back to the default message", () => {
    expect(normaliseError({})).toEqual({
      status: null,
      message: DEFAULT_ERROR_MESSAGE,
    });
  });
});
