const TOKEN_KEY = "palettematch.demo.accessToken";
const EXPIRATION_KEY = "palettematch.demo.expiresAt";
const DEMO_SESSION_EXPIRED_EVENT = "palettematch:demo-session-expired";

export function saveDemoSession(accessToken, expiresIn) {
  if (
    typeof accessToken !== "string" ||
    accessToken.length === 0 ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0
  ) {
    throw new Error("The demo login response did not contain a valid token.");
  }

  const expiresAt = Date.now() + expiresIn * 1000;
  window.sessionStorage.setItem(TOKEN_KEY, accessToken);
  window.sessionStorage.setItem(EXPIRATION_KEY, String(expiresAt));
  return expiresAt;
}

export function getDemoSession() {
  const accessToken = window.sessionStorage.getItem(TOKEN_KEY);
  const expiresAtValue = window.sessionStorage.getItem(EXPIRATION_KEY);
  const expiresAt = Number(expiresAtValue);

  if (!accessToken) {
    clearDemoSession();
    return null;
  }

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    expireDemoSession();
    return null;
  }

  return { accessToken, expiresAt };
}

export function hasStoredDemoSession() {
  return window.sessionStorage.getItem(TOKEN_KEY) !== null;
}

export function clearDemoSession() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(EXPIRATION_KEY);
}

export function expireDemoSession() {
  clearDemoSession();
  window.dispatchEvent(new Event(DEMO_SESSION_EXPIRED_EVENT));
}

export function getDemoSessionExpiredEventName() {
  return DEMO_SESSION_EXPIRED_EVENT;
}
