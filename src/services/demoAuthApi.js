import { apiRequest } from "./apiClient";

export async function loginDemo(password) {
  const response = await apiRequest("/api/auth/demo/login", {
    authenticated: false,
    method: "POST",
    body: { password },
  });

  if (
    !response ||
    typeof response.accessToken !== "string" ||
    response.tokenType !== "Bearer" ||
    !Number.isFinite(response.expiresIn) ||
    response.expiresIn <= 0
  ) {
    throw new Error("The demo login service returned an invalid response.");
  }

  return response;
}
