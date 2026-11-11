import { routePath } from "../../../components/route/paths";

// Figma --color-primary-brand-100 (mirrors $academy-primary in SCSS)
export const ACADEMY_PRIMARY_COLOR = "#005EA3";

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

// The chapter reader lives on Course Overview (FE-04/05); keep its URL
// shape in one place so links survive if the reader moves to a nested route
export const getChapterPath = (chapterId) =>
  `${routePath.academy.courses}?chapter=${encodeURIComponent(chapterId)}`;

export const getModulePath = (moduleId) =>
  `${routePath.academy.courses}?module=${encodeURIComponent(moduleId)}`;
