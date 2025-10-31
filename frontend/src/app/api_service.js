import { setLoading } from "./redux/loaderSlice";
import { store } from "./redux/store";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const request = async (
  url,
  method,
  body,
  token = null,
  responseType = "json",
  showLoader = true
) => {
  const headers = {};

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : null,
  };

  try {
    if (showLoader) store.dispatch(setLoading(true));
    const response = await fetch(`${API_BASE_URL}${url}`, options);

    let data;
    if (responseType === "blob") {
      data = await response.blob();
    } else {
      data = await response.json();
    }

    if (!response.ok) {
      const error = new Error(
        data.message || data.detail || "An unexpected error occurred."
      );
      error.status = data.status;
      error.statusCode = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  } finally {
    if (showLoader) store.dispatch(setLoading(false));
  }


};

export const apiService = {
  get: (url, token = null, responseType = "json", showLoader = true) =>
    request(url, "GET", null, token, responseType, showLoader),

  post: (url, body, showLoader = true, token = null, responseType = "json") =>
    request(url, "POST", body, token, responseType, showLoader),

  put: (url, body, token = null, responseType = "json", showLoader = true) =>
    request(url, "PUT", body, token, responseType, showLoader),

  delete: (url, token = null, responseType = "json", showLoader = true) =>
    request(url, "DELETE", null, token, responseType, showLoader),
};

