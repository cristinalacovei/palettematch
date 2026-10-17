import chroma from "chroma-js";

export const ACHROMATIC_CHROMA_THRESHOLD = 1e-4;

const HEX_PATTERN = /^#[0-9A-F]{6}$/i;
// This module's API input limit; it is not a universal mathematical OKLCH limit.
const MAX_SUPPORTED_CHROMA = 1;
const GAMUT_SEARCH_ITERATIONS = 48;

function validateFiniteNumber(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
}

function validateRange(name, value, minimum, maximum) {
  validateFiniteNumber(name, value);
  if (value < minimum || value > maximum) {
    throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
  }
}

function validateRgbChannel(name, value) {
  validateRange(name, value, 0, 255);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be an integer between 0 and 255.`);
  }
}

function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

function toOklch(color) {
  const [rawLightness, rawChroma, rawHue] = color.oklch();
  const c = Math.max(0, rawChroma);

  return {
    l: Math.min(1, Math.max(0, rawLightness)),
    c,
    // Hue is undefined below this chroma threshold to avoid unstable gray hues.
    h: c <= ACHROMATIC_CHROMA_THRESHOLD ? null : normalizeHue(rawHue),
  };
}

function isInSrgbGamut(lightness, chromaValue, hue) {
  const color = chroma.oklch(lightness, chromaValue, hue);
  const rgb = color.rgb(false);
  return !color.clipped() && rgb.every(Number.isFinite);
}

function mapChromaToSrgbGamut(lightness, requestedChroma, hue) {
  if (isInSrgbGamut(lightness, requestedChroma, hue)) {
    return requestedChroma;
  }

  // Preserve lightness and hue while finding the highest in-gamut chroma.
  let low = 0;
  let high = requestedChroma;

  for (let iteration = 0; iteration < GAMUT_SEARCH_ITERATIONS; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (isInSrgbGamut(lightness, midpoint, hue)) {
      low = midpoint;
    } else {
      high = midpoint;
    }
  }

  return low;
}

function validateOklch(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("OKLCH color must be an object with l, c, and h values.");
  }

  const { l, c, h } = value;
  validateRange("l", l, 0, 1);
  validateFiniteNumber("c", c);
  if (c < 0) {
    throw new RangeError("c must be non-negative.");
  }
  if (c > MAX_SUPPORTED_CHROMA) {
    throw new RangeError(`c must not exceed ${MAX_SUPPORTED_CHROMA}.`);
  }

  if (h === null) {
    if (c > ACHROMATIC_CHROMA_THRESHOLD) {
      throw new RangeError(
        `h may be null only when c is at most ${ACHROMATIC_CHROMA_THRESHOLD}.`,
      );
    }
    return { l, c: 0, h: 0 };
  }

  validateFiniteNumber("h", h);
  return { l, c, h: normalizeHue(h) };
}

export function hexToOklch(hex) {
  if (typeof hex !== "string" || !HEX_PATTERN.test(hex)) {
    throw new TypeError("hex must be a six-digit hexadecimal color starting with #.");
  }

  return toOklch(chroma(hex));
}

export function rgbToOklch(red, green, blue) {
  validateRgbChannel("red", red);
  validateRgbChannel("green", green);
  validateRgbChannel("blue", blue);

  return toOklch(chroma.rgb(red, green, blue));
}

export function oklchToRgb(value) {
  const { l, c, h } = validateOklch(value);
  const mappedChroma = mapChromaToSrgbGamut(l, c, h);
  return chroma.oklch(l, mappedChroma, h)
    .rgb()
    .map((channel) => Math.min(255, Math.max(0, channel)));
}

export function oklchToHex(value) {
  const [red, green, blue] = oklchToRgb(value);
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}
