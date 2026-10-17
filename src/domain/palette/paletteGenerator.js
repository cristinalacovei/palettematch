import chroma from "chroma-js";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalizeColors(colors) {
  return colors.map((color) => chroma(color).hex().toUpperCase());
}

function varyColor(color) {
  const [rawHue, rawSaturation, rawLightness] = chroma(color).hsl();

  const hue = Number.isFinite(rawHue) ? rawHue + (Math.random() - 0.5) * 8 : 0;

  const saturation =
    rawSaturation < 0.03
      ? 0
      : clamp(rawSaturation * (0.88 + Math.random() * 0.24), 0.05, 1);

  const lightness = clamp(
    rawLightness + (Math.random() - 0.5) * 0.12,
    0.08,
    0.92,
  );

  return chroma.hsl(hue, saturation, lightness).hex().toUpperCase();
}

function addVariations(colors, baseColor) {
  const normalizedBaseColor = chroma(baseColor).hex().toUpperCase();

  return colors.map((color) => {
    const normalizedColor = chroma(color).hex().toUpperCase();

    if (normalizedColor === normalizedBaseColor) {
      return normalizedColor;
    }

    return varyColor(normalizedColor);
  });
}

export function createPalette(baseColor, type, shouldAddVariations = false) {
  const base = chroma(baseColor);

  const hueValue = base.get("hsl.h");
  const hue = Number.isFinite(hueValue) ? hueValue : 0;

  let generatedColors = [];

  switch (type) {
    case "analog":
      generatedColors = [-40, -20, 0, 20, 40].map((offset) =>
        base.set("hsl.h", hue + offset),
      );
      break;

    case "complement": {
      const oppositeColor = base.set("hsl.h", (hue + 180) % 360);

      generatedColors = [
        base.brighten(1.15),
        base,
        chroma.mix(base, oppositeColor, 0.5, "lab"),
        oppositeColor,
        oppositeColor.darken(1.1),
      ];

      break;
    }

    case "triad":
      generatedColors = [
        base.brighten(0.8),
        base,
        base.set("hsl.h", (hue + 120) % 360),
        base.set("hsl.h", (hue + 240) % 360),
        base.set("hsl.h", (hue + 240) % 360).darken(0.9),
      ];
      break;

    case "tetradic":
      generatedColors = [
        base,
        base.set("hsl.h", (hue + 90) % 360),
        base.set("hsl.h", (hue + 180) % 360),
        base.set("hsl.h", (hue + 270) % 360),
      ];
      break;

    case "monochrome":
      generatedColors = chroma
        .scale([base.brighten(2.2), base, base.darken(2.2)])
        .mode("lab")
        .colors(5);
      break;

    case "split-complement":
      generatedColors = [
        base.brighten(0.8),
        base,
        base.set("hsl.h", (hue + 150) % 360),
        base.set("hsl.h", (hue + 210) % 360),
        base.set("hsl.h", (hue + 210) % 360).darken(0.9),
      ];
      break;

    default:
      generatedColors = [base];
  }

  const normalizedColors = normalizeColors(generatedColors);

  if (shouldAddVariations) {
    return addVariations(normalizedColors, baseColor);
  }

  return normalizedColors;
}
