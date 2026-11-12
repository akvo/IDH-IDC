import DOMPurify from "dompurify";
import { routePath } from "../../../components/route/paths";

// Figma --color-primary-brand-100 (mirrors $academy-primary in SCSS)
export const ACADEMY_PRIMARY_COLOR = "#005EA3";

// Academy brand colour and Inter font for antd, mirrored from the SCSS tokens
// so antd components and portals match. Shared by every Academy page frame.
export const ACADEMY_THEME = {
  token: {
    colorPrimary: ACADEMY_PRIMARY_COLOR,
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

// "Kole Johnson" -> "KJ"; prefers the learner profile name over fullname
export const getUserInitials = ({ fullname, user_profile } = {}) => {
  const profileNames = [user_profile?.first_name, user_profile?.last_name]
    .map((name) => name?.trim())
    .filter(Boolean);
  const parts = profileNames.length
    ? profileNames
    : (fullname || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "";
  }
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

// Time-of-day greeting for the learner's local clock
export const getGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
};

// "Wayan Galih" -> "Wayan"
export const getFirstName = (name = "") => name.trim().split(/\s+/)[0] || "";

// Display statuses as returned by the academy API
export const PROGRESS_STATUS = {
  completed: "Completed",
  inProgress: "In progress",
  notStarted: "Not started",
};

// Statuses accepted by POST /academy/chapters/{id}/progress
export const CHAPTER_API_STATUS = {
  completed: "completed",
  inProgress: "in_progress",
};

// The chapter reader lives on Course Overview (FE-04/05); keep its URL
// shape in one place so links survive if the reader moves to a nested route
export const getChapterPath = (chapterId) =>
  `${routePath.academy.courses}?chapter=${encodeURIComponent(chapterId)}`;

// Module learning page; `chapterId` opens a specific chapter step
export const getModulePath = (moduleId, chapterId) => {
  const path = `${routePath.academy.modules}/${encodeURIComponent(moduleId)}`;
  return chapterId ? `${path}?chapter=${encodeURIComponent(chapterId)}` : path;
};

// Academy HTML (course summary, chapter content) comes from the API as
// authored markup; strip scripts, handlers and other unsafe markup before
// rendering it
export const sanitizeHtml = (html) => DOMPurify.sanitize(html || "");
