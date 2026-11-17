import { renderHook, act } from "@testing-library/react";
import UserState, { defaultUserState, syncUserState } from "../user";

describe("UserState", () => {
  beforeEach(() => {
    act(() => {
      UserState.update(() => ({ ...defaultUserState }));
    });
  });

  it("should initialize with the correct default state", () => {
    const { result } = renderHook(() => UserState.useState());
    const {
      id,
      fullname,
      email,
      role,
      active,
      organisation_detail,
      business_unit_detail,
      tags_count,
      cases_count,
      case_access,
      tools,
      user_profile,
    } = result.current;

    expect(id).toBe(0);
    expect(fullname).toBe(null);
    expect(email).toBe(null);
    expect(role).toBe(null);
    expect(active).toBe(false);
    expect(tools).toEqual([]);
    expect(user_profile).toBe(null);
    expect(organisation_detail).toEqual({
      id: null,
      name: null,
    });
    expect(business_unit_detail).toEqual([
      {
        id: 0,
        name: null,
        role: null,
      },
    ]);
    expect(tags_count).toBe(0);
    expect(cases_count).toBe(0);
    expect(case_access).toEqual([]);
  });

  it("should updating the state correctly", () => {
    const { result } = renderHook(() => UserState.useState());
    act(() => {
      UserState.update((s) => {
        s.id = 1;
        s.fullname = "John Doe";
        s.email = "admin@akvo.com";
        s.role = "admin";
        s.active = true;
        s.organisation_detail = {
          id: 1,
          name: "Akvo",
        };
        s.business_unit_detail = [
          {
            id: 1,
            name: "Meat Guy",
            role: "admin",
          },
        ];
        s.tags_count = 2;
        s.cases_count = 1;
        s.case_access = [{ case: 1, permission: "edit" }];
        s.internal_user = false;
        s.company = 1;
        s.tools = ["idc", "academy"];
      });
    });
    const {
      id,
      fullname,
      email,
      role,
      active,
      organisation_detail,
      business_unit_detail,
      tags_count,
      cases_count,
      case_access,
      internal_user,
      company,
      tools,
    } = result.current;

    expect(id).toBe(1);
    expect(fullname).toBe("John Doe");
    expect(email).toBe("admin@akvo.com");
    expect(role).toBe("admin");
    expect(active).toBe(true);
    expect(tools).toEqual(["idc", "academy"]);
    expect(organisation_detail).toEqual({
      id: 1,
      name: "Akvo",
    });
    expect(business_unit_detail).toEqual([
      {
        id: 1,
        name: "Meat Guy",
        role: "admin",
      },
    ]);
    expect(tags_count).toBe(2);
    expect(cases_count).toBe(1);
    expect(case_access).toEqual([{ case: 1, permission: "edit" }]);
    expect(internal_user).toBe(false);
    expect(company).toBe(1);
  });

  describe("syncUserState helper", () => {
    it("handles null or undefined payload safely as no-op", () => {
      const { result } = renderHook(() => UserState.useState());
      act(() => {
        syncUserState(null);
        syncUserState();
      });
      expect(result.current.id).toBe(0);
      expect(result.current.fullname).toBe(null);
    });

    it("hydrates UserState from GET /user/me payload including nested user_profile", () => {
      const { result } = renderHook(() => UserState.useState());
      const meData = {
        id: 42,
        fullname: "Kole Johnson",
        email: "kole@example.com",
        role: "user",
        active: true,
        organisation_detail: [{ id: 10, name: "IDH" }],
        business_unit_detail: [{ id: 2, name: "Cocoa Unit", role: "member" }],
        tags_count: 5,
        cases_count: 3,
        case_access: [{ case: 1, permission: "view" }],
        internal_user: false,
        company: 7,
        company_name: "IDH Partner Org",
        user_type: "external_regular",
        tools: ["academy"],
        user_profile: {
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
        },
      };

      act(() => {
        syncUserState(meData);
      });

      expect(result.current.id).toBe(42);
      expect(result.current.fullname).toBe("Kole Johnson");
      expect(result.current.email).toBe("kole@example.com");
      expect(result.current.role).toBe("user");
      expect(result.current.active).toBe(true);
      expect(result.current.company).toBe(7);
      expect(result.current.company_name).toBe("IDH Partner Org");
      expect(result.current.user_type).toBe("external_regular");
      expect(result.current.tools).toEqual(["academy"]);
      expect(result.current.isExternalRegular).toBe(true);
      expect(result.current.isCaseCreator).toBe(false);
      expect(result.current.user_profile).toEqual(meData.user_profile);
      expect(result.current.organisation_detail).toEqual(
        meData.organisation_detail
      );
      expect(result.current.business_unit_detail).toEqual(
        meData.business_unit_detail
      );
      expect(result.current.case_access).toEqual(meData.case_access);
    });

    it("computes isCaseCreator accurately for admins, internal users, and advanced users", () => {
      const { result } = renderHook(() => UserState.useState());

      act(() => {
        syncUserState({ role: "admin", user_type: "standard" });
      });
      expect(result.current.isCaseCreator).toBe(true);
      expect(result.current.isExternalRegular).toBe(false);

      act(() => {
        syncUserState({
          role: "user",
          internal_user: true,
          user_type: "standard",
        });
      });
      expect(result.current.isCaseCreator).toBe(true);

      act(() => {
        syncUserState({
          role: "user",
          internal_user: false,
          user_type: "external_advanced",
        });
      });
      expect(result.current.isCaseCreator).toBe(true);

      act(() => {
        syncUserState({
          role: "user",
          internal_user: false,
          user_type: "external_regular",
        });
      });
      expect(result.current.isCaseCreator).toBe(false);
      expect(result.current.isExternalRegular).toBe(true);
    });

    it("falls back to default empty values when optional arrays and strings are missing", () => {
      const { result } = renderHook(() => UserState.useState());

      act(() => {
        syncUserState({
          id: 99,
          fullname: "Minimal User",
        });
      });

      expect(result.current.id).toBe(99);
      expect(result.current.fullname).toBe("Minimal User");
      expect(result.current.organisation_detail).toEqual([]);
      expect(result.current.business_unit_detail).toEqual([]);
      expect(result.current.case_access).toEqual([]);
      expect(result.current.company_name).toBe(null);
      expect(result.current.user_profile).toBe(null);
      expect(result.current.tools).toEqual([]);
      expect(result.current.isExternalRegular).toBe(false);
      expect(result.current.isCaseCreator).toBe(false);
    });
  });
});
