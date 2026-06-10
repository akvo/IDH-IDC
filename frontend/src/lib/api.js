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

  const download = async (
    url = "",
    options = {
      filename: null,
      params: {},
    }
  ) => {
    const response = await axios({
      url,
      method: "GET",
      ...getConfig(),
      params: options?.params,
      responseType: "blob",
    });

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
    upload: (url, file, config = {}) => {
      const formData = new FormData();
      formData.append("file", file);
      return axios({
        url,
        method: "POST",
        data: formData,
        ...getConfig(),
        ...config,
        headers: {
          ...getConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
    },
    download: download,
    setToken: (token) => {
      api.token = token;
    },
  };
};

const api = API();

export default api;
