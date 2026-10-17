import React from "react";
import { act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { initializeKeycloak, keycloak, loginToKeycloak, logoutFromKeycloak } from "./keycloak";
import { getCurrentUser } from "../services/userApi";

jest.mock("./keycloak", () => ({
  initializeKeycloak: jest.fn(),
  keycloak: {
    authenticated: false,
    tokenParsed: { realm_access: { roles: ["USER"] } },
    updateToken: jest.fn(),
  },
  loginToKeycloak: jest.fn(),
  logoutFromKeycloak: jest.fn(),
  getValidAccessToken: jest.fn(),
}));

jest.mock("./authMode", () => ({ AUTH_MODE: "keycloak" }));

jest.mock("../services/userApi", () => ({
  getCurrentUser: jest.fn(),
}));

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <span>{auth.isReady ? "ready" : "loading"}</span>
      <span>{auth.authenticated ? "authenticated" : "anonymous"}</span>
      <span>{auth.currentUser?.username || ""}</span>
      <span>{auth.roles.join(",")}</span>
      <span role="alert">{auth.authError}</span>
      <button type="button" onClick={auth.login}>Login</button>
      <button type="button" onClick={auth.logout}>Logout</button>
    </div>
  );
}

describe("AuthProvider in Keycloak mode", () => {
  beforeEach(() => {
    process.env.REACT_APP_AUTH_MODE = "keycloak";
    keycloak.authenticated = false;
    keycloak.tokenParsed = { realm_access: { roles: ["USER"] } };
    initializeKeycloak.mockResolvedValue(false);
    getCurrentUser.mockResolvedValue({
      username: "cristina",
      email: "cristina@example.com",
    });
    loginToKeycloak.mockResolvedValue(undefined);
    logoutFromKeycloak.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes Keycloak and keeps anonymous state when check-sso finds no session", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("ready")).toBeInTheDocument();
    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(initializeKeycloak).toHaveBeenCalledTimes(1);
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("loads the current account and retains realm roles for an existing Keycloak session", async () => {
    keycloak.authenticated = true;
    initializeKeycloak.mockResolvedValue(true);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("cristina")).toBeInTheDocument();
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("USER")).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("delegates login and logout to the existing Keycloak client", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("ready");

    await act(async () => {
      screen.getByRole("button", { name: "Login" }).click();
      screen.getByRole("button", { name: "Logout" }).click();
    });

    expect(loginToKeycloak).toHaveBeenCalledTimes(1);
    expect(logoutFromKeycloak).toHaveBeenCalledTimes(1);
  });

  it("clears the authenticated state and explains a rejected Keycloak session", async () => {
    keycloak.authenticated = true;
    initializeKeycloak.mockResolvedValue(true);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("cristina");

    await act(async () => {
      window.dispatchEvent(
        new Event("palettematch:keycloak-session-expired"),
      );
    });

    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your Keycloak session expired. Please sign in again.",
    );
  });
});
