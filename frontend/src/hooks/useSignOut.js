import { useCallback } from "react";
import { useCookies } from "react-cookie";
import { UserState } from "../store";
import { defaultUserState } from "../store/user";
import api from "../lib/api";

const useSignOut = () => {
  const [, , removeCookie] = useCookies(["AUTH_TOKEN"]);

  const signOut = useCallback(() => {
    removeCookie("AUTH_TOKEN");

    // Drop the in-memory bearer token too, or clients that read api.token
    // keep sending the previous user's token until a full reload
    api.setToken(null);
    UserState.replace(defaultUserState);
  }, [removeCookie]);

  return signOut;
};

export default useSignOut;
