import { getUserInitials } from "..";

describe("getUserInitials", () => {
  it("prefers the learner profile first and last name", () => {
    expect(
      getUserInitials({
        fullname: "Someone Else",
        user_profile: { first_name: "kole", last_name: "johnson" },
      })
    ).toBe("KJ");
  });

  it("uses a single profile name when only one is set", () => {
    expect(
      getUserInitials({
        fullname: "Someone Else",
        user_profile: { first_name: "Kole", last_name: "  " },
      })
    ).toBe("K");
  });

  it("falls back to the first and last word of fullname", () => {
    expect(getUserInitials({ fullname: "Ada Mary Lovelace" })).toBe("AL");
    expect(getUserInitials({ fullname: "  Admin  " })).toBe("A");
  });

  it("returns an empty string without any name", () => {
    expect(getUserInitials({ fullname: null, user_profile: null })).toBe("");
    expect(getUserInitials()).toBe("");
  });
});
