import { useCallback } from "react";
import { useCookies } from "react-cookie";
import { UserState } from "../store";

const useSignOut = () => {
  const [, , removeCookie] = useCookies(["AUTH_TOKEN"]);

  const signOut = useCallback(() => {
    removeCookie("AUTH_TOKEN");

    UserState.update((s) => {
      s.id = 0;
      s.fullname = null;
      s.email = null;
      s.role = null;
      s.active = false;
      s.organisation_detail = {
        id: 0,
        name: null,
      };
      s.business_unit_detail = [
        {
          id: 0,
          name: null,
          role: null,
        },
      ];
      s.tags_count = 0;
      s.cases_count = 0;
      s.case_access = [];
      s.internal_user = false;
      s.company = null;
    });
  }, [removeCookie]);

  return signOut;
};

export default useSignOut;
