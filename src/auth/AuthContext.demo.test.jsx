process.env.REACT_APP_AUTH_MODE = "demo";

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ApiError } from "../services/apiClient";
import { getPalettes } from "../services/paletteApi";
import { getDemoSessionExpiredEventName } from "./demoSession";

jest.mock("./keycloak", () => ({
  initializeKeycloak: jest.fn(),
  keycloak: {
    authenticated: false,
    tokenParsed: null,
    updateToken: jest.fn(),
  },
  loginToKeycloak: jest.fn(),
  logoutFromKeycloak: jest.fn(),
  getValidAccessToken: jest.fn(),
}));

jest.mock("./authMode", () => ({ AUTH_MODE: "demo" }));

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <span>{auth.isReady ? "ready" : "loading"}</span>
      <span>{auth.authenticated ? "authenticated" : "anonymous"}</span>
      <span>{auth.currentUser?.username || ""}</span>
      <span>{auth.roles.length}</span>
      <span role="alert">{auth.authError}</span>
      <button type="button" onClick={() => auth.loginWithDemoPassword("valid-demo-password")}>
        Sign in
      </button>
      <button type="button" onClick={auth.logout}>Logout</button>
    </div>
  );
}

function jsonResponse(body, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

describe("AuthProvider in demo mode", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    window.sessionStorage.clear();
  });

  it("uses the backend login contract and attaches its bearer token to current-user requests", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse({
        accessToken: "signed.demo.access.token",
        tokenType: "Bearer",
        expiresIn: 900,
      }))
      .mockResolvedValueOnce(jsonResponse({
        id: "server-user-id",
        username: "Demo visitor",
        email: "visitor@demo.invalid",
      }));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("ready");

    await act(async () => {
      screen.getByRole("button", { name: "Sign in" }).click();
    });

    expect(await screen.findByText("Demo visitor")).toBeInTheDocument();
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8080/api/auth/demo/login",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "valid-demo-password" }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8080/api/users/me",
      expect.objectContaining({
        headers: { Authorization: "Bearer signed.demo.access.token" },
      }),
    );
    expect(window.sessionStorage.getItem("palettematch.demo.accessToken"))
      .toBe("signed.demo.access.token");
  });

  it("shows invalid-credential errors and does not retain a token", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(
      { code: "INVALID_CREDENTIALS", message: "Invalid demo credentials." },
      401,
    ));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("ready");

    await act(async () => {
      screen.getByRole("button", { name: "Sign in" }).click();
    });

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("That demo password was not accepted.");
    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("palettematch.demo.accessToken")).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("reports non-credential API failures clearly", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(
      { message: "Temporarily unavailable." },
      503,
    ));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("ready");

    await act(async () => {
      screen.getByRole("button", { name: "Sign in" }).click();
    });

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("demo sign-in service returned an error (503)");
  });

  it("clears the session on logout and reports token expiry", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse({
        accessToken: "signed.demo.access.token",
        tokenType: "Bearer",
        expiresIn: 900,
      }))
      .mockResolvedValueOnce(jsonResponse({
        id: "server-user-id",
        username: "Demo visitor",
        email: "visitor@demo.invalid",
      }));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("ready");
    await act(async () => {
      screen.getByRole("button", { name: "Sign in" }).click();
    });
    await screen.findByText("Demo visitor");

    await act(async () => {
      screen.getByRole("button", { name: "Logout" }).click();
    });
    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("palettematch.demo.accessToken")).toBeNull();

    await act(async () => {
      window.dispatchEvent(new Event(getDemoSessionExpiredEventName()));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your demo session expired. Please sign in again.",
    );
  });

  it("expires demo authentication when a protected request returns unauthorized", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse({
        accessToken: "signed.demo.access.token",
        tokenType: "Bearer",
        expiresIn: 900,
      }))
      .mockResolvedValueOnce(jsonResponse({
        id: "server-user-id",
        username: "Demo visitor",
        email: "visitor@demo.invalid",
      }))
      .mockResolvedValueOnce(jsonResponse(
        { message: "Unauthorized" },
        401,
      ));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await screen.findByText("ready");
    await act(async () => {
      screen.getByRole("button", { name: "Sign in" }).click();
    });
    await screen.findByText("Demo visitor");

    await act(async () => {
      await expect(getPalettes()).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Your demo session expired.");
  });
});
