export function resolveAuthMode(value) {
  const mode = value || "keycloak";

  if (mode !== "keycloak" && mode !== "demo") {
    throw new Error(`Unsupported authentication mode "${mode}".`);
  }

  return mode;
}

export const AUTH_MODE = resolveAuthMode(process.env.REACT_APP_AUTH_MODE);
