jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

import {
  ACHROMATIC_CHROMA_THRESHOLD,
  hexToOklch,
  oklchToHex,
  oklchToRgb,
  rgbToOklch,
} from "./oklch";

function expectNear(actual, expected, tolerance) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

function expectRgbChannelsNear(actual, expected, tolerance = 1) {
  actual.forEach((channel, index) => {
    expect(Math.abs(channel - expected[index])).toBeLessThanOrEqual(tolerance);
  });
}

describe("OKLCH conversion", () => {
  it.each([
    ["#000000", 0, 0, null],
    ["#FFFFFF", 1, 0, null],
  ])("converts achromatic %s and marks hue as undefined", (hex, l, c, h) => {
    const result = hexToOklch(hex);

    expectNear(result.l, l, 1e-4);
    expectNear(result.c, c, 1e-4);
    expect(result.h).toBe(h);
  });

  it.each([
    ["#FF0000", 0.6279553606, 0.2576833077, 29.2338851923],
    ["#00FF00", 0.8664396115, 0.2948272403, 142.4953388878],
    ["#0000FF", 0.4520137184, 0.3132143717, 264.0520206381],
    ["#804020", 0.4466302816, 0.0990546541, 45.4397884978],
  ])("matches independently calculated OKLCH reference for %s", (hex, l, c, h) => {
    const result = hexToOklch(hex);

    expectNear(result.l, l, 1e-4);
    expectNear(result.c, c, 1e-4);
    expectNear(result.h, h, 0.1);
  });

  it("uses the documented chroma threshold for hue-less colors", () => {
    expect(ACHROMATIC_CHROMA_THRESHOLD).toBe(1e-4);
    const gray = rgbToOklch(128, 128, 128);
    expect(gray.c).toBeLessThanOrEqual(ACHROMATIC_CHROMA_THRESHOLD);
    expect(gray.h).toBeNull();

    expect(() =>
      oklchToRgb({
        l: 0.5,
        c: ACHROMATIC_CHROMA_THRESHOLD + 1e-8,
        h: null,
      }),
    ).toThrow(RangeError);
    expect(
      oklchToRgb({
        l: 0.5,
        c: ACHROMATIC_CHROMA_THRESHOLD,
        h: null,
      }),
    ).toEqual(oklchToRgb({ l: 0.5, c: 0, h: null }));
  });

  it("accepts the maximum supported chroma input and rejects values above it", () => {
    const rgb = oklchToRgb({ l: 0.5, c: 1, h: 30 });

    expect(rgb).toHaveLength(3);
    rgb.forEach((channel) => {
      expect(Number.isInteger(channel)).toBe(true);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    });
    expect(() => oklchToRgb({ l: 0.5, c: 1 + Number.EPSILON, h: 30 })).toThrow(
      RangeError,
    );
  });

  it.each([
    [0, 0],
    [359, 359],
    [360, 0],
    [-1, 359],
    [721, 1],
  ])("normalizes hue %s to %s degrees", (hue, normalizedHue) => {
    expect(oklchToRgb({ l: 0.6, c: 0.1, h: hue })).toEqual(
      oklchToRgb({ l: 0.6, c: 0.1, h: normalizedHue }),
    );
  });

  it.each(["#1267AB", "#804020", "#12A0F0", "#FF0000", "#808080"])(
    "round-trips representative HEX color %s exactly",
    (hex) => {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    },
  );

  it.each([
    [12, 103, 171],
    [128, 64, 32],
    [18, 160, 240],
    [128, 128, 128],
  ])("round-trips RGB values %j within one integer channel level", (red, green, blue) => {
    expectRgbChannelsNear(
      oklchToRgb(rgbToOklch(red, green, blue)),
      [red, green, blue],
    );
  });

  it("maps out-of-gamut colors by reducing chroma at fixed lightness and hue", () => {
    const requested = { l: 0.7, c: 0.5, h: 30 };
    const result = oklchToRgb(requested);
    const mappedHex = oklchToHex(requested);

    expect(result).toEqual([255, 101, 81]);
    expect(mappedHex).toBe("#FF6551");
    expect(result).toHaveLength(3);
    result.forEach((channel) => {
      expect(Number.isInteger(channel)).toBe(true);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    });

    const mapped = rgbToOklch(...result);
    expectNear(mapped.l, requested.l, 0.001);
    expect(mapped.c).toBeLessThan(requested.c);
    expectNear(mapped.h, requested.h, 0.5);
  });

  it("rejects invalid HEX, RGB, and OKLCH inputs explicitly", () => {
    expect(() => hexToOklch("#FFF")).toThrow(TypeError);
    expect(() => hexToOklch("112233")).toThrow(TypeError);
    expect(() => rgbToOklch(256, 0, 0)).toThrow(RangeError);
    expect(() => rgbToOklch(Number.NaN, 0, 0)).toThrow(TypeError);
    expect(() => rgbToOklch(0, Number.POSITIVE_INFINITY, 0)).toThrow(TypeError);
    expect(() => rgbToOklch(12.5, 0, 0)).toThrow(RangeError);
    expect(() => rgbToOklch(0, 12.5, 0)).toThrow(RangeError);
    expect(() => rgbToOklch(0, 0, 12.5)).toThrow(RangeError);
    expect(() => oklchToRgb({ l: -0.1, c: 0, h: 0 })).toThrow(RangeError);
    expect(() => oklchToRgb({ l: 0.5, c: -0.1, h: 0 })).toThrow(RangeError);
    expect(() => oklchToRgb({ l: 0.5, c: Number.MAX_VALUE, h: 0 })).toThrow(
      RangeError,
    );
    expect(() => oklchToRgb({ l: 0.5, c: 0.1, h: Number.NaN })).toThrow(TypeError);
    expect(() => oklchToRgb({ l: 0.5, c: 0.1, h: Number.POSITIVE_INFINITY })).toThrow(
      TypeError,
    );
    expect(() => oklchToRgb(null)).toThrow(TypeError);
  });
});
