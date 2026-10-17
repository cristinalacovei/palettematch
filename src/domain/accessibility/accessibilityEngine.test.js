jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

import {
  getImportedPalette,
  getPaletteContrastPairs,
} from "./accessibilityEngine";

describe("palette contrast analysis", () => {
  const fiveColors = ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF"];

  it("creates one result for every unique color pair and reuses WCAG checks", () => {
    const pairs = getPaletteContrastPairs(fiveColors);

    expect(pairs).toHaveLength(10);
    expect(pairs[0]).toMatchObject({
      foreground: "#000000",
      background: "#FFFFFF",
      ratio: 21,
    });
    expect(pairs[0].checks.map(({ title, standard, passed }) => ({
      title,
      standard,
      passed,
    }))).toEqual([
      { title: "Normal text", standard: "WCAG AA", passed: true },
      { title: "Normal text", standard: "WCAG AAA", passed: true },
      { title: "Large text", standard: "WCAG AA", passed: true },
      { title: "Large text", standard: "WCAG AAA", passed: true },
    ]);
  });

  it("normalizes valid colors and skips missing or malformed HEX values", () => {
    const imported = getImportedPalette({
      palette: {
        name: "Partial",
        colors: ["#112233", "445566", null, "#xyzxyz"],
      },
    });

    expect(imported).toMatchObject({
      name: "Partial",
      colors: ["#112233", "#445566"],
      invalidColorCount: 2,
      missingColorCount: 1,
    });
    expect(getPaletteContrastPairs(imported.colors)).toHaveLength(1);
    expect(getPaletteContrastPairs(["bad", null, undefined])).toEqual([]);
    expect(getImportedPalette({ palette: { colors: [] } })).toMatchObject({
      colors: [],
      missingColorCount: 5,
    });
  });

  it("does not generate duplicate pairs for repeated palette colors", () => {
    expect(
      getPaletteContrastPairs(["#FFFFFF", "#FFFFFF", "#000000"]),
    ).toHaveLength(1);
  });
});
