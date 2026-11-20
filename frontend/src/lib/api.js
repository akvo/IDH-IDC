import axios from "axios";
import pako from "pako";
import {
  isAuthBypassUrl,
  refreshAccessToken,
  registerTokenSetter,
} from "./authRefresh";

export const config = {
  baseURL: "/api/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

const API = () => {
  const getConfig = () => {
    return api?.token
      ? {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${api.token}`,
          },
        }
      : config;
  };

  const requestWithRefresh = async (url, makeRequest) => {
    try {
      return await makeRequest(getConfig());
    } catch (error) {
      if (error?.response?.status === 401 && !isAuthBypassUrl(url)) {
        try {
          await refreshAccessToken();
        } catch {
          throw error;
        }
        return makeRequest(getConfig());
      }
      throw error;
    }
  };

  // Function to send Gzipped data
  const sendCompressedData = async (
    url,
    data,
    method = "POST",
    customConfig = {}
  ) => {
    try {
      return await requestWithRefresh(url, (reqConfig) => {
        const compressedData = pako.gzip(JSON.stringify(data)); // Compress the payload
        return axios({
          url,
          method,
          data: compressedData,
          ...reqConfig,
          ...customConfig,
          headers: {
            ...reqConfig.headers,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "gzip",
          },
        });
      });
    } catch (error) {
      console.error("Compression error:", error);
      throw error;
    }
  };

  const download = async (
    url = "",
    options = {
      filename: null,
      params: {},
    }
  ) => {
    const response = await requestWithRefresh(url, (reqConfig) =>
      axios({
        url,
        method: "GET",
        ...reqConfig,
        params: options?.params,
        responseType: "blob",
      })
    );

    // Try to extract filename from Content-Disposition
    let filename = options?.filename || "download";

    const disposition = response.headers["content-disposition"];
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/);
      if (match?.[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });

    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return true;
  };

  return {
    get: (url, customConfig = {}) =>
      requestWithRefresh(url, (reqConfig) =>
        axios({ url, ...reqConfig, ...customConfig })
      ),
    post: (url, data, customConfig = {}) =>
      requestWithRefresh(url, (reqConfig) =>
        axios({ url, method: "POST", data, ...reqConfig, ...customConfig })
      ),
    put: (url, data, customConfig = {}) =>
      requestWithRefresh(url, (reqConfig) =>
        axios({ url, method: "PUT", data, ...reqConfig, ...customConfig })
      ),
    patch: (url, data, customConfig = {}) =>
      requestWithRefresh(url, (reqConfig) =>
        axios({ url, method: "PATCH", data, ...reqConfig, ...customConfig })
      ),
    delete: (url, customConfig = {}) =>
      requestWithRefresh(url, (reqConfig) =>
        axios({ url, method: "DELETE", ...reqConfig, ...customConfig })
      ),
    sendCompressedData,
    upload: (url, file, customConfig = {}) =>
      requestWithRefresh(url, (reqConfig) => {
        const formData = new FormData();
        formData.append("file", file);
        return axios({
          url,
          method: "POST",
          data: formData,
          ...reqConfig,
          ...customConfig,
          headers: {
            ...reqConfig.headers,
            "Content-Type": "multipart/form-data",
          },
        });
      }),
    download: download,
    setToken: (token) => {
      api.token = token;
    },
  };
};

const api = API();
registerTokenSetter((token) => api.setToken(token));

export default api;
