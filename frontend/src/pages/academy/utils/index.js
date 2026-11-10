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
