jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

import { hexToOklch } from "../color/oklch";
import { createPalette } from "./paletteGenerator";
import { createOklchPalette } from "./oklchPaletteGenerator";

describe("createOklchPalette", () => {
  it("generates the same deterministic five-color palette for the same base", () => {
    const first = createOklchPalette("#5B5CE2");
    const second = createOklchPalette("#5B5CE2");

    expect(first).toHaveLength(5);
    expect(second).toEqual(first);
  });

  it("returns valid HEX colors and keeps the chromatic base hue approximately constant", () => {
    const baseHue = hexToOklch("#5B5CE2").h;
    const colors = createOklchPalette("#5B5CE2");

    expect(colors).toEqual(
      expect.arrayContaining([expect.stringMatching(/^#[0-9A-F]{6}$/)]),
    );
    expect(colors.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(true);
    expect(colors[2]).toBe("#5B5CE2");

    for (const color of colors) {
      const hue = hexToOklch(color).h;
      if (hue !== null) {
        const difference = Math.abs(hue - baseHue);
        expect(Math.min(difference, 360 - difference)).toBeLessThan(4);
      }
    }
  });

  it("uses the documented blue-violet hue strategy for an achromatic base", () => {
    const colors = createOklchPalette("#808080");

    expect(colors).toHaveLength(5);
    expect(colors[2]).toBe("#808080");
    for (const color of [colors[0], colors[1], colors[3], colors[4]]) {
      const hue = hexToOklch(color).h;
      expect(hue).not.toBeNull();
      const difference = Math.abs(hue - 250);
      expect(Math.min(difference, 360 - difference)).toBeLessThan(4);
    }
  });

  it("leaves the existing harmony generator behavior intact", () => {
    expect(createPalette("#FF0000", "analog")).toEqual([
      "#FF00AA",
      "#FF0055",
      "#FF0000",
      "#FF5500",
      "#FFAA00",
    ]);
  });
});
