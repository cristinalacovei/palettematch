import { apiRequest } from "./apiClient";
import { getValidAccessToken } from "../auth/keycloak";

jest.mock("../auth/authMode", () => ({ AUTH_MODE: "keycloak" }));
jest.mock("../auth/keycloak", () => ({
  getValidAccessToken: jest.fn(),
  keycloak: { authenticated: false, tokenParsed: null },
  initializeKeycloak: jest.fn(),
  loginToKeycloak: jest.fn(),
  logoutFromKeycloak: jest.fn(),
}));

describe("apiClient in Keycloak mode", () => {
  beforeEach(() => {
    getValidAccessToken.mockResolvedValue("keycloak-access-token");
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ status: "ok" }),
    });
  });

  afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
  });

  it("continues attaching the refreshed Keycloak bearer token", async () => {
    await apiRequest("/api/palettes");

    expect(getValidAccessToken).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/palettes",
      expect.objectContaining({
        headers: { Authorization: "Bearer keycloak-access-token" },
      }),
    );
  });
});
