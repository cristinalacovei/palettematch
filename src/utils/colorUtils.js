import chroma from "chroma-js";

export const HEX_PATTERN = /^#[0-9A-F]{6}$/i;

export function normalizeHex(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const valueWithHash = trimmedValue.startsWith("#")
    ? trimmedValue
    : `#${trimmedValue}`;

  return valueWithHash.toUpperCase();
}

export function isValidHex(value) {
  return HEX_PATTERN.test(normalizeHex(value));
}

export function normalizeColor(color) {
  return chroma(color).hex().toUpperCase();
}

export function rgbToHex(red, green, blue) {
  return (
    "#" +
    [red, green, blue]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
