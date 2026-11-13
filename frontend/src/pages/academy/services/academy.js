import axios from "axios";
import { message } from "antd";
import api, { config } from "../../../lib/api";

export const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
// Shared key so a burst of failing requests shows a single toast
const GLOBAL_ERROR_KEY = "academy-api-error";

export const academyClient = axios.create({
  baseURL: config.baseURL,
  headers: config.headers,
});

// Attach the session token set by App via api.setToken
academyClient.interceptors.request.use((request) => {
  if (api.token) {
    request.headers.Authorization = `Bearer ${api.token}`;
  }
  return request;
});

// Normalise errors to { status, message } so pages can render them directly
export const normaliseError = (error) => {
  const status = error?.response?.status ?? null;
  const detail = error?.response?.data?.detail;
  return {
    status,
    message:
      typeof detail === "string"
        ? detail
        : error?.message || DEFAULT_ERROR_MESSAGE,
  };
};

academyClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Deliberately cancelled requests are not failures
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    const normalised = normaliseError(error);
    // Expired or revoked session: stop sending the stale token
    if (normalised.status === 401) {
      api.setToken(null);
    }
    // Network failures and server errors are surfaced globally;
    // 4xx errors are left to the calling page to handle.
    if (!normalised.status || normalised.status >= 500) {
      message.error({ content: DEFAULT_ERROR_MESSAGE, key: GLOBAL_ERROR_KEY });
    }
    return Promise.reject(normalised);
  }
);

// Cancelled requests reject with axios' Cancel, not a normalised error
export const isRequestCancelled = (error) => axios.isCancel(error);

// Query params for the resources/glossary lists; the type filter has a
// different name per endpoint and blank values are not sent
const listParams = ({ search, type, sortBy, sortOrder }, typeParam) => {
  const params = {};
  if (search) {
    params.search = search;
  }
  if (type) {
    params[typeParam] = type;
  }
  if (sortBy) {
    params.sort_by = sortBy;
  }
  if (sortOrder) {
    params.sort_order = sortOrder;
  }
  return params;
};

const academyService = {
  // Used to refresh UserState after the learner edits their profile
  getMe: () => academyClient.get("user/me").then((res) => res.data),
  // Reads accept an AbortSignal so callers can cancel superseded requests
  getOverview: ({ signal } = {}) =>
    academyClient.get("academy/overview", { signal }).then((res) => res.data),
  // Topic tags with module and chapter counts
  getTags: ({ signal } = {}) =>
    academyClient.get("academy/tags", { signal }).then((res) => res.data),
  // Modules with their nested chapters, in curriculum order. `search` and
  // `tag` (slug) filter server-side; blank filters are not sent.
  getModules: ({ search, tag, signal } = {}) => {
    const params = {};
    if (search) {
      params.search = search;
    }
    if (tag) {
      params.tag = tag;
    }
    return academyClient
      .get("academy/modules", { params, signal })
      .then((res) => res.data);
  },
  // Technical resources: { total, data: [{ id, name, type, url, ... }] }.
  // `type` is Guidance | Organisation | Template | Tool.
  getResources: ({ search, type, sortBy, sortOrder, signal } = {}) =>
    academyClient
      .get("academy/resources", {
        params: listParams(
          { search, type, sortBy, sortOrder },
          "resource_type"
        ),
        signal,
      })
      .then((res) => res.data),
  // Glossary: { total, data: [{ id, term, type, definition, ... }] }.
  // `type` is Core | Finance | Additional.
  getGlossary: ({ search, type, sortBy, sortOrder, signal } = {}) =>
    academyClient
      .get("academy/glossary", {
        params: listParams({ search, type, sortBy, sortOrder }, "term_type"),
        signal,
      })
      .then((res) => res.data),
  // Chapter content with prev/next chapter ids; does not record the view
  getChapter: (chapterId, { signal } = {}) =>
    academyClient
      .get(`academy/chapters/${chapterId}`, { signal })
      .then((res) => res.data),
  // status: "not_started" | "in_progress" | "completed". The API always
  // writes `status`, so send the chapter's current one when only recording a
  // view (`markOpened` sets last_opened_at for Recently opened / history)
  updateChapterProgress: (chapterId, status, { markOpened = false } = {}) =>
    academyClient
      .post(`academy/chapters/${chapterId}/progress`, {
        status,
        mark_opened: markOpened,
      })
      .then((res) => res.data),
  getHistory: ({ page = 1, pageSize = 10, signal } = {}) =>
    academyClient
      .get("academy/history", {
        params: { page, page_size: pageSize },
        signal,
      })
      .then((res) => res.data),
};

export default academyService;
