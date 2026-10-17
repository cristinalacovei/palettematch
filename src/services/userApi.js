import { apiRequest } from "./apiClient";

export function getCurrentUser() {
  return apiRequest("/api/users/me");
}
