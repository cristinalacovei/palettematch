import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8180",

  realm: process.env.REACT_APP_KEYCLOAK_REALM || "palettematch",

  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || "palettematch-frontend",
});

let initializationPromise = null;

export function initializeKeycloak() {
  if (!initializationPromise) {
    initializationPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }

  return initializationPromise;
}

export async function loginToKeycloak() {
  await initializeKeycloak();

  return keycloak.login({
    redirectUri: window.location.href,
  });
}

export async function logoutFromKeycloak() {
  await initializeKeycloak();

  return keycloak.logout({
    redirectUri: window.location.origin,
  });
}

export async function getValidAccessToken() {
  await initializeKeycloak();

  if (!keycloak.authenticated) {
    return null;
  }

  try {
    await keycloak.updateToken(30);

    return keycloak.token;
  } catch (error) {
    console.error("Could not refresh the Keycloak access token.", error);

    return null;
  }
}
