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
import { AUTH_MODE } from "./authMode";
import {
  clearDemoSession,
  expireDemoSession,
  getDemoSession,
  getDemoSessionExpiredEventName,
  hasStoredDemoSession,
  saveDemoSession,
} from "./demoSession";
import { KEYCLOAK_SESSION_EXPIRED_EVENT } from "./sessionEvents";
import { getCurrentUser } from "../services/userApi";
import { loginDemo } from "../services/demoAuthApi";
import { ApiError } from "../services/apiClient";

const AuthContext = createContext(null);
const EMPTY_ROLES = [];

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");

  const loadCurrentUser = useCallback(async () => {
    const hasValidToken =
      AUTH_MODE === "demo"
        ? Boolean(getDemoSession())
        : Boolean(keycloak.authenticated);

    if (!hasValidToken) {
      setCurrentUser(null);
      return false;
    }

    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setAuthError("");
      return true;
    } catch (error) {
      console.error("[AUTH] Could not load current user:", error);
      setCurrentUser(null);
      if (error instanceof ApiError && error.status === 401) {
        if (AUTH_MODE === "demo") {
          expireDemoSession();
        } else {
          setAuthenticated(false);
          setAuthError("Your Keycloak session expired. Please sign in again.");
        }
      } else {
        setAuthError("Could not load your PaletteMatch account. Please try again.");
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (AUTH_MODE === "demo") {
        const hadStoredDemoSession = hasStoredDemoSession();
        const demoSession = getDemoSession();
        if (demoSession) {
          setAuthenticated(true);
          await loadCurrentUser();
        } else if (hadStoredDemoSession) {
          setAuthError("Your demo session expired. Please sign in again.");
        }
        if (mounted) {
          setIsReady(true);
        }
        return;
      }

      try {
        const isAuthenticated = await initializeKeycloak();
        if (!mounted) {
          return;
        }

        const loggedIn = Boolean(isAuthenticated || keycloak.authenticated);
        setAuthenticated(loggedIn);
        if (loggedIn) {
          await loadCurrentUser();
        } else {
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
    if (!authenticated || AUTH_MODE !== "keycloak") {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        await keycloak.updateToken(60);
      } catch (error) {
        console.error("Token refresh failed.", error);
        setAuthenticated(false);
        setCurrentUser(null);
        setAuthError("Your Keycloak session expired. Please sign in again.");
      }
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authenticated]);

  useEffect(() => {
    if (AUTH_MODE !== "keycloak") {
      return undefined;
    }

    const handleExpired = () => {
      setAuthenticated(false);
      setCurrentUser(null);
      setAuthError("Your Keycloak session expired. Please sign in again.");
    };
    window.addEventListener(KEYCLOAK_SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(KEYCLOAK_SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  useEffect(() => {
    if (AUTH_MODE !== "demo") {
      return undefined;
    }

    const handleExpired = () => {
      setAuthenticated(false);
      setCurrentUser(null);
      setAuthError("Your demo session expired. Please sign in again.");
    };
    const eventName = getDemoSessionExpiredEventName();
    window.addEventListener(eventName, handleExpired);
    return () => window.removeEventListener(eventName, handleExpired);
  }, []);

  useEffect(() => {
    if (AUTH_MODE !== "demo" || !authenticated) {
      return undefined;
    }

    const session = getDemoSession();
    if (!session) {
      expireDemoSession();
      return undefined;
    }

    const timeoutId = window.setTimeout(
      expireDemoSession,
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timeoutId);
  }, [authenticated]);

  const login = useCallback(() => {
    if (AUTH_MODE === "demo") {
      return undefined;
    }
    return loginToKeycloak();
  }, []);

  const logout = useCallback(() => {
    if (AUTH_MODE === "demo") {
      clearDemoSession();
      setAuthenticated(false);
      setCurrentUser(null);
      setAuthError("");
      return Promise.resolve();
    }
    return logoutFromKeycloak();
  }, []);

  const loginWithDemoPassword = useCallback(async (password) => {
    setAuthError("");
    try {
      const response = await loginDemo(password);
      saveDemoSession(response.accessToken, response.expiresIn);
      setAuthenticated(true);
      const accountLoaded = await loadCurrentUser();
      if (!accountLoaded) {
        clearDemoSession();
        setAuthenticated(false);
        return false;
      }
      return true;
    } catch (error) {
      clearDemoSession();
      setAuthenticated(false);
      setCurrentUser(null);

      if (error instanceof ApiError && error.status === 401) {
        setAuthError("That demo password was not accepted. Please try again.");
      } else if (error instanceof ApiError) {
        setAuthError(
          `The demo sign-in service returned an error (${error.status}). Please try again later.`,
        );
      } else {
        console.error("Demo sign-in failed.", error);
        setAuthError("The demo sign-in service is unavailable. Please try again later.");
      }
      return false;
    }
  }, [loadCurrentUser]);

  const realmRoles = keycloak.tokenParsed?.realm_access?.roles;
  const roles =
    AUTH_MODE === "keycloak" && Array.isArray(realmRoles)
      ? realmRoles
      : EMPTY_ROLES;

  const value = useMemo(
    () => ({
      isReady,
      authenticated,
      currentUser,
      authError,
      authMode: AUTH_MODE,
      roles,
      login,
      loginWithDemoPassword,
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
      loginWithDemoPassword,
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
