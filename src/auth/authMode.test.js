import { resolveAuthMode } from "./authMode";

describe("authentication mode configuration", () => {
  it("defaults to Keycloak when no mode is configured", () => {
    expect(resolveAuthMode(undefined)).toBe("keycloak");
    expect(resolveAuthMode("")).toBe("keycloak");
  });

  it("accepts only the supported explicit modes", () => {
    expect(resolveAuthMode("keycloak")).toBe("keycloak");
    expect(resolveAuthMode("demo")).toBe("demo");
    expect(() => resolveAuthMode("disabled")).toThrow(
      'Unsupported authentication mode "disabled".',
    );
  });
});
