import { createContext, useContext } from "react";
import axios from "axios";
import UserState, { defaultUserState, syncUserState } from "../store/user";

export const AuthInitContext = createContext(false);

export const useAuthInitializing = () => useContext(AuthInitContext);

let tokenSetter = null;
let refreshPromise = null;

export const registerTokenSetter = (setter) => {
  tokenSetter = typeof setter === "function" ? setter : null;
};

export const isAuthBypassUrl = (url = "") =>
  /(^|\/)user\/(login|refresh|logout)(\?|$)/.test(String(url));

export const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post("/api/user/refresh", null, { withCredentials: true })
    .then((res) => {
      const data = res?.data || {};
      const accessToken = data.access_token || null;
      if (!accessToken) {
        throw new Error("Missing access token in refresh response");
      }
      if (tokenSetter) {
        tokenSetter(accessToken);
      }
      if (data.user) {
        syncUserState(data.user);
      } else {
        UserState.update((s) => {
          s.isAuthenticated = true;
          s.authInitializing = false;
        });
      }
      return accessToken;
    })
    .catch((err) => {
      if (tokenSetter) {
        tokenSetter(null);
      }
      UserState.replace({ ...defaultUserState, authInitializing: false });
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};
