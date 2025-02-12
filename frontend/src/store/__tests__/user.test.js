import { renderHook, act } from "@testing-library/react";
import UserState from "../user";

describe("UserState", () => {
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
    } = result.current;

    expect(id).toBe(0);
    expect(fullname).toBe(null);
    expect(email).toBe(null);
    expect(role).toBe(null);
    expect(active).toBe(false);
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
    } = result.current;

    expect(id).toBe(1);
    expect(fullname).toBe("John Doe");
    expect(email).toBe("admin@akvo.com");
    expect(role).toBe("admin");
    expect(active).toBe(true);
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
});
