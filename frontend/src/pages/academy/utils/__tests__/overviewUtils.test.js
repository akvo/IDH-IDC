import { getGreeting, getFirstName, getChapterPath, getModulePath } from "..";

const at = (hour) => new Date(2026, 10, 11, hour, 0, 0);

describe("getGreeting", () => {
  it.each([
    [0, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [17, "Good afternoon"],
    [18, "Good evening"],
    [23, "Good evening"],
  ])("at %i:00 says %s", (hour, greeting) => {
    expect(getGreeting(at(hour))).toBe(greeting);
  });

  it("defaults to the current time", () => {
    expect(getGreeting()).toMatch(/^Good (morning|afternoon|evening)$/);
  });
});

describe("getFirstName", () => {
  it("returns the first word of the name", () => {
    expect(getFirstName("  Wayan   Galih ")).toBe("Wayan");
    expect(getFirstName("Kole")).toBe("Kole");
  });

  it("returns an empty string for blank names", () => {
    expect(getFirstName("   ")).toBe("");
    expect(getFirstName()).toBe("");
  });
});

describe("course links", () => {
  it("builds chapter and module links on Course Overview", () => {
    expect(getChapterPath(5)).toBe("/academy/courses?chapter=5");
    expect(getModulePath(2)).toBe("/academy/courses?module=2");
  });
});
