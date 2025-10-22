const axios = require("axios");
const cacheService = require("../services/cacheService");

/**
 * Axios instance with interceptors for request deduplication, retry logic, and error logging.
 */

const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const pendingRequests = new Map();

axiosInstance.interceptors.request.use(
  (config) => {
    const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;

    if (pendingRequests.has(requestKey)) {
      const existingRequest = pendingRequests.get(requestKey);
      config.cancelToken = existingRequest.cancelToken;
      return existingRequest.config;
    }

    config.requestKey = requestKey;
    config.requestStartTime = Date.now();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config;

    if (config.requestKey) {
      pendingRequests.delete(config.requestKey);
    }

    return response;
  },
  async (error) => {
    const config = error.config;

    if (config?.requestKey) {
      pendingRequests.delete(config.requestKey);
    }

    if (!config || !config.retry) {
      config.retry = 0;
    }

    config.retry += 1;
    const maxRetries = config.maxRetries || 3;
    const retryDelay = config.retryDelay || 1000;

    if (
      config.retry < maxRetries &&
      (!error.response ||
        (error.response.status >= 500 && error.response.status <= 599))
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * config.retry),
      );

      return axiosInstance(config);
    }

    return Promise.reject(error);
  },
);

async function cachedGet(url, config = {}, cacheTTL = 60) {
  const cacheKey = `http:${url}:${JSON.stringify(config.params || {})}`;

  const cached = cacheService.get("users", cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const response = await axiosInstance.get(url, config);

  if (response.data) {
    cacheService.set("users", cacheKey, response.data, cacheTTL);
  }

  return { ...response, fromCache: false };
}

module.exports = {
  axiosInstance,
  cachedGet,
};
