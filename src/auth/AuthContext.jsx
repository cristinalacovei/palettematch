import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  initializeKeycloak,
  keycloak,
  loginToKeycloak,
  logoutFromKeycloak,
} from "./keycloak";
import { getCurrentUser } from "../services/userApi";

const AuthContext = createContext(null);
const EMPTY_ROLES = [];

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const [authError, setAuthError] = useState("");

  const loadCurrentUser = useCallback(async () => {
    console.log("[AUTH] loadCurrentUser called");

    console.log("[AUTH] authenticated:", keycloak.authenticated);

    if (!keycloak.authenticated) {
      console.log("[AUTH] skipping /api/users/me");

      setCurrentUser(null);
      return;
    }

    try {
      console.log("[AUTH] calling /api/users/me");

      const user = await getCurrentUser();

      console.log("[AUTH] current user:", user);

      setCurrentUser(user);
      setAuthError("");
    } catch (error) {
      console.error("[AUTH] Could not load current user:", error);

      setCurrentUser(null);

      setAuthError("Could not load your PaletteMatch account.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const isAuthenticated = await initializeKeycloak();

        console.log("[AUTH] init result:", isAuthenticated);

        console.log("[AUTH] keycloak.authenticated:", keycloak.authenticated);

        console.log("[AUTH] token parsed:", {
          sub: keycloak.tokenParsed?.sub,
          username: keycloak.tokenParsed?.preferred_username,
          email: keycloak.tokenParsed?.email,
        });

        if (!mounted) {
          return;
        }

        const loggedIn = Boolean(isAuthenticated || keycloak.authenticated);

        setAuthenticated(loggedIn);

        if (loggedIn) {
          console.log("[AUTH] loading current user...");

          await loadCurrentUser();
        } else {
          console.log("[AUTH] user is not authenticated");

          setCurrentUser(null);
        }
      } catch (error) {
        console.error("[AUTH] Keycloak initialization failed:", error);

        if (mounted) {
          setAuthError("Authentication service is unavailable.");
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadCurrentUser]);

  useEffect(() => {
    if (!authenticated) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        await keycloak.updateToken(60);
      } catch (error) {
        console.error("Token refresh failed.", error);

        setAuthenticated(false);

        setCurrentUser(null);
      }
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authenticated]);

  const login = useCallback(() => {
    return loginToKeycloak();
  }, []);

  const logout = useCallback(() => {
    return logoutFromKeycloak();
  }, []);

  const realmRoles = keycloak.tokenParsed?.realm_access?.roles;
  const roles = Array.isArray(realmRoles) ? realmRoles : EMPTY_ROLES;

  const value = useMemo(
    () => ({
      isReady,
      authenticated,
      currentUser,
      authError,
      roles,

      login,
      logout,
      refreshCurrentUser: loadCurrentUser,

      hasRole: (role) => roles.includes(role),
    }),
    [
      isReady,
      authenticated,
      currentUser,
      authError,
      roles,
      login,
      logout,
      loadCurrentUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
