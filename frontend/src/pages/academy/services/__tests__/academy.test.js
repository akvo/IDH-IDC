import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { message } from "antd";
import academyService, {
  academyClient,
  isRequestCancelled,
  normaliseError,
  DEFAULT_ERROR_MESSAGE,
} from "../academy";
import api from "../../../../lib/api";

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

  it("getProfile returns user profile", async () => {
    const profile = {
      id: 1,
      user_id: 42,
      first_name: "Kole",
      last_name: "Johnson",
      company_name: "IDH Partner Org",
      company_type: "NGO",
      sector: "Agriculture",
      region_id: null,
      region_name: "West Africa",
      commodities: ["Cocoa", "Coffee"],
    };
    mock.onGet("academy/profile").reply(200, profile);
    await expect(academyService.getProfile()).resolves.toEqual(profile);
  });

  it("getProfile forwards AbortSignal to academyClient", async () => {
    const controller = new AbortController();
    mock.onGet("academy/profile").reply(200, { id: 1 });
    const spy = jest.spyOn(academyClient, "get");
    await academyService.getProfile({ signal: controller.signal });
    expect(spy).toHaveBeenCalledWith("academy/profile", {
      signal: controller.signal,
    });
    spy.mockRestore();
  });

  it("updateProfile puts the payload and returns updated profile", async () => {
    const payload = {
      first_name: "Kole",
      last_name: "Johnson",
      commodities: ["Cocoa"],
    };
    const response = {
      id: 1,
      user_id: 42,
      first_name: "Kole",
      last_name: "Johnson",
      commodities: ["Cocoa"],
    };
    mock.onPut("academy/profile", payload).reply(200, response);
    await expect(academyService.updateProfile(payload)).resolves.toEqual(
      response
    );
  });

  it("getOverview returns the learner overview", async () => {
    const overview = {
      greeting_name: "Wayan Galih",
      continue_chapter_id: null,
      metrics: {
        academy_progress_pct: 0,
        modules_completed: 0,
        total_modules: 6,
        modules_completed_pct: 0,
        chapters_completed: 0,
        total_chapters: 27,
        chapters_completed_pct: 0,
      },
      modules: [],
      recently_opened: [],
    };
    mock.onGet("academy/overview").reply(200, overview);
    await expect(academyService.getOverview()).resolves.toEqual(overview);
  });

  it("updateChapterProgress posts the new status", async () => {
    const response = {
      chapter_id: 7,
      status: "Completed",
      last_opened_at: "2026-11-10T10:00:00Z",
      completed_at: "2026-11-10T10:05:00Z",
      module_id: 1,
      module_progress_pct: 100,
      module_status: "Completed",
      course_progress_pct: 17,
      modules_completed: 1,
      chapters_completed: 5,
    };
    mock
      .onPost("academy/chapters/7/progress", {
        status: "completed",
        mark_opened: false,
      })
      .reply(200, response);
    await expect(
      academyService.updateChapterProgress(7, "completed")
    ).resolves.toEqual(response);
  });

  it("updateChapterProgress can record a chapter view", async () => {
    const response = {
      chapter_id: 7,
      status: "In progress",
      last_opened_at: "2026-11-10T10:00:00Z",
      completed_at: null,
      module_id: 1,
      module_progress_pct: 20,
      module_status: "In progress",
      course_progress_pct: 4,
      modules_completed: 0,
      chapters_completed: 1,
    };
    mock
      .onPost("academy/chapters/7/progress", {
        status: "in_progress",
        mark_opened: true,
      })
      .reply(200, response);
    await expect(
      academyService.updateChapterProgress(7, "in_progress", {
        markOpened: true,
      })
    ).resolves.toEqual(response);
  });

  it("getHistory sends page and page_size", async () => {
    const response = {
      total: 6,
      page: 2,
      page_size: 5,
      total_pages: 2,
      data: [],
    };
    mock
      .onGet("academy/history", { params: { page: 2, page_size: 5 } })
      .reply(200, response);
    await expect(
      academyService.getHistory({ page: 2, pageSize: 5 })
    ).resolves.toEqual(response);
  });

  it("passes an AbortSignal through and reports the cancellation", async () => {
    const controller = new AbortController();
    mock.onGet("academy/overview").reply(200, {});
    const request = academyService.getOverview({ signal: controller.signal });
    controller.abort();
    const error = await request.catch((err) => err);
    expect(isRequestCancelled(error)).toBe(true);
    expect(isRequestCancelled({ status: 500, message: "x" })).toBe(false);
    expect(errorToast).not.toHaveBeenCalled();
  });

  it("getModules returns modules with their chapters", async () => {
    const body = {
      total_modules: 1,
      course_summary_html: null,
      modules: [
        {
          id: 1,
          order_index: 1,
          title: "Module 1",
          description: null,
          estimated_minutes: 15,
          icon_theme: "blue",
          progress_pct: 0,
          status: "Not started",
          tags: [],
          chapters: [],
        },
      ],
    };
    mock.onGet("academy/modules").reply(200, body);
    await expect(academyService.getModules()).resolves.toEqual(body);
  });

  it("getModules sends only the filters that are set", async () => {
    mock
      .onGet("academy/modules", { params: { search: "gap", tag: "benchmark" } })
      .reply(200, { modules: [] });
    await expect(
      academyService.getModules({ search: "gap", tag: "benchmark" })
    ).resolves.toEqual({ modules: [] });

    mock.onGet("academy/modules").reply((req) => [200, req.params]);
    await expect(academyService.getModules({ search: "" })).resolves.toEqual(
      {}
    );
  });

  it("changePassword posts the API field names", async () => {
    mock
      .onPost("academy/settings/change-password", {
        current_password: "old-secret",
        new_password: "a-new-long-secret",
      })
      .reply(200, { message: "Password changed successfully" });
    await expect(
      academyService.changePassword({
        currentPassword: "old-secret",
        newPassword: "a-new-long-secret",
      })
    ).resolves.toEqual({ message: "Password changed successfully" });
  });

  it("deleteAccount keeps the blocking cases of a 409", async () => {
    const detail = {
      message: "Cannot delete account: user owns existing cases.",
      cases: [{ value: 1, label: "Cocoa case" }],
    };
    mock.onDelete("academy/account").reply(409, { detail });
    await expect(academyService.deleteAccount()).rejects.toEqual({
      status: 409,
      message: detail.message,
      detail,
    });
  });

  it("getResources maps filters to the resource params", async () => {
    mock
      .onGet("academy/resources", {
        params: {
          search: "tool",
          resource_type: "Template",
          sort_by: "type",
          sort_order: "desc",
        },
      })
      .reply(200, { total: 0, data: [] });
    await expect(
      academyService.getResources({
        search: "tool",
        type: "Template",
        sortBy: "type",
        sortOrder: "desc",
      })
    ).resolves.toEqual({ total: 0, data: [] });
  });

  it("getGlossary maps the type filter to term_type and drops blanks", async () => {
    mock
      .onGet("academy/glossary", { params: { term_type: "Core" } })
      .reply(200, { total: 1, data: [{ id: 1 }] });
    await expect(
      academyService.getGlossary({ search: "", type: "Core" })
    ).resolves.toEqual({ total: 1, data: [{ id: 1 }] });
  });

  it("getTags and getChapter read their endpoints", async () => {
    mock.onGet("academy/tags").reply(200, [{ id: 1, slug: "gap" }]);
    mock.onGet("academy/chapters/5").reply(200, { id: 5 });
    await expect(academyService.getTags()).resolves.toEqual([
      { id: 1, slug: "gap" },
    ]);
    await expect(academyService.getChapter(5)).resolves.toEqual({ id: 5 });
  });

  it("getHistory defaults to the first page of 10", async () => {
    const response = {
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
      data: [],
    };
    mock
      .onGet("academy/history", { params: { page: 1, page_size: 10 } })
      .reply(200, response);
    await expect(academyService.getHistory()).resolves.toEqual(response);
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
      detail: "Forbidden",
    });
    expect(errorToast).not.toHaveBeenCalled();
  });

  it("drops the stale session token on 401 when refresh fails", async () => {
    api.setToken("expired-token");
    jest
      .spyOn(axios, "post")
      .mockRejectedValueOnce(new Error("No refresh session"));
    mock.onGet("user/me").reply(401, { detail: "Not authenticated" });
    await expect(academyService.getMe()).rejects.toEqual({
      status: 401,
      message: "Not authenticated",
      detail: "Not authenticated",
    });
    expect(api.token).toBeNull();
    expect(errorToast).not.toHaveBeenCalled();
  });

  it("refreshes expired token once on 401 and replays failed request", async () => {
    api.setToken("expired-token");
    jest.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        access_token: "fresh-academy-token",
        user: { id: 1, role: "user", active: true, tools: ["academy"] },
      },
    });
    mock
      .onGet("user/me")
      .replyOnce(401, { detail: "Token expired" })
      .onGet("user/me")
      .replyOnce((req) => [200, { headers: req.headers, id: 1 }]);

    const data = await academyService.getMe();
    expect(data.id).toBe(1);
    expect(data.headers.Authorization).toBe("Bearer fresh-academy-token");
    expect(api.token).toBe("fresh-academy-token");
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
    ).toEqual({ status: 404, message: "Nope", detail: "Nope" });
  });

  it("uses the message of an object detail and keeps the detail", () => {
    const detail = {
      message: "Cannot delete account: user owns existing cases.",
      cases: [{ value: 1, label: "Cocoa case" }],
    };
    expect(
      normaliseError({
        message: "Request failed with status code 409",
        response: { status: 409, data: { detail } },
      })
    ).toEqual({ status: 409, message: detail.message, detail });
  });

  it("uses the first message of a validation error array", () => {
    const detail = [{ msg: "String should have at least 1 character" }];
    expect(
      normaliseError({
        message: "Request failed with status code 422",
        response: { status: 422, data: { detail } },
      })
    ).toEqual({
      status: 422,
      message: "String should have at least 1 character",
      detail,
    });
  });

  it("falls back to the axios message for an unreadable detail", () => {
    expect(
      normaliseError({
        message: "Request failed with status code 422",
        response: { status: 422, data: { detail: [{}] } },
      })
    ).toEqual({
      status: 422,
      message: "Request failed with status code 422",
      detail: [{}],
    });
  });

  it("falls back to the default message", () => {
    expect(normaliseError({})).toEqual({
      status: null,
      message: DEFAULT_ERROR_MESSAGE,
      detail: null,
    });
  });
});
