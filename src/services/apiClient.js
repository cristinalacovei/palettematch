import { AUTH_MODE } from "../auth/authMode";
import { expireDemoSession, getDemoSession } from "../auth/demoSession";
import { KEYCLOAK_SESSION_EXPIRED_EVENT } from "../auth/sessionEvents";
import { getValidAccessToken } from "../auth/keycloak";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8080");

export class ApiError extends Error {
  constructor(message, status, responseBody = null) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL && process.env.NODE_ENV === "production") {
    throw new ApiError(
      "REACT_APP_API_BASE_URL must be configured for the production frontend.",
      0,
    );
  }

  const {
    authenticated = true,
    headers = {},
    body,
    ...requestOptions
  } = options;

  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] =
      requestHeaders["Content-Type"] || "application/json";
  }

  if (authenticated) {
    const token =
      AUTH_MODE === "demo"
        ? getDemoSession()?.accessToken || null
        : await getValidAccessToken();

    if (!token) {
      throw new ApiError("Authentication is required.", 401);
    }

    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      if (AUTH_MODE === "demo") {
        expireDemoSession();
      } else {
        window.dispatchEvent(new Event(KEYCLOAK_SESSION_EXPIRED_EVENT));
      }
    }

    const message =
      responseBody?.message || `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status, responseBody);
  }

  return responseBody;
}
