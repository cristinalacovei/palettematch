jest.mock("keycloak-js", () =>
  jest.fn(() => global.mockKeycloakClient),
);

describe("Keycloak browser client", () => {
  let client;
  let auth;

  beforeEach(() => {
    jest.resetModules();
    process.env.REACT_APP_KEYCLOAK_URL = "http://localhost:8180";
    process.env.REACT_APP_KEYCLOAK_REALM = "palettematch";
    process.env.REACT_APP_KEYCLOAK_CLIENT_ID = "palettematch-frontend";
    client = {
      init: jest.fn().mockResolvedValue(false),
      login: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      updateToken: jest.fn().mockResolvedValue(true),
      authenticated: true,
      token: "keycloak-access-token",
    };
    global.mockKeycloakClient = client;
    auth = require("./keycloak");
  });

  afterEach(() => {
    delete global.mockKeycloakClient;
    delete process.env.REACT_APP_KEYCLOAK_URL;
    delete process.env.REACT_APP_KEYCLOAK_REALM;
    delete process.env.REACT_APP_KEYCLOAK_CLIENT_ID;
  });

  it("uses check-sso and PKCE S256 for the existing authorization-code flow", async () => {
    await auth.initializeKeycloak();

    expect(client.init).toHaveBeenCalledWith({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  });

  it("retains the configured client and existing login/logout redirect behavior", async () => {
    expect(auth.keycloak).toBe(client);

    await auth.loginToKeycloak();
    expect(client.login).toHaveBeenCalledWith({
      redirectUri: window.location.href,
    });

    await auth.logoutFromKeycloak();
    expect(client.logout).toHaveBeenCalledWith({
      redirectUri: window.location.origin,
    });
  });
});
