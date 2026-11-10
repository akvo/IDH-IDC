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
    // Network failures and server errors are surfaced globally;
    // 4xx errors are left to the calling page to handle.
    if (!normalised.status || normalised.status >= 500) {
      message.error({ content: DEFAULT_ERROR_MESSAGE, key: GLOBAL_ERROR_KEY });
    }
    return Promise.reject(normalised);
  }
);

const academyService = {
  // Used to refresh UserState after the learner edits their profile
  getMe: () => academyClient.get("user/me").then((res) => res.data),
};

export default academyService;
