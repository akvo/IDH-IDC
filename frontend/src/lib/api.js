import axios from "axios";
import pako from "pako";

export const config = {
  baseURL: "/api/",
  headers: {
    "Content-Type": "application/json",
  },
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

  // Function to send Gzipped data
  const sendCompressedData = async (
    url,
    data,
    method = "POST",
    config = {}
  ) => {
    try {
      const compressedData = pako.gzip(JSON.stringify(data)); // Compress the payload
      return axios({
        url,
        method,
        data: compressedData,
        ...getConfig(),
        ...config,
        headers: {
          ...getConfig().headers,
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "gzip",
        },
      });
    } catch (error) {
      console.error("Compression error:", error);
      throw error;
    }
  };

  return {
    get: (url, config = {}) => axios({ url, ...getConfig(), ...config }),
    post: (url, data, config = {}) =>
      axios({ url, method: "POST", data, ...getConfig(), ...config }),
    put: (url, data, config = {}) =>
      axios({ url, method: "PUT", data, ...getConfig(), ...config }),
    patch: (url, data, config = {}) =>
      axios({ url, method: "PATCH", data, ...getConfig(), ...config }),
    delete: (url, config = {}) =>
      axios({ url, method: "DELETE", ...getConfig(), ...config }),
    sendCompressedData,
    setToken: (token) => {
      api.token = token;
    },
  };
};

const api = API();

export default api;
