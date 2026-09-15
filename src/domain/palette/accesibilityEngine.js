import chroma from "chroma-js";

import { HEX_PATTERN, normalizeHex } from "../../utils/colorUtils";

export const DEFAULT_FOREGROUND = "#17181C";
export const DEFAULT_BACKGROUND = "#FFFFFF";

export function calculateContrastRatio(foreground, background) {
  return chroma.contrast(foreground, background);
}

export function getImportedPalette(routeState) {
  const receivedPalette = routeState?.palette;

  if (!receivedPalette || !Array.isArray(receivedPalette.colors)) {
    return null;
  }

  const validColors = receivedPalette.colors
    .filter((color) => {
      if (typeof color !== "string") {
        return false;
      }

      return HEX_PATTERN.test(normalizeHex(color));
    })
    .map((color) => normalizeHex(color));

  const uniqueColors = [...new Set(validColors)];

  if (uniqueColors.length === 0) {
    return null;
  }

  return {
    name: receivedPalette.name || "Imported palette",

    colors: uniqueColors,
  };
}

export function findBestContrastPair(colors) {
  if (!colors || colors.length < 2) {
    return {
      foreground: DEFAULT_FOREGROUND,

      background: DEFAULT_BACKGROUND,
    };
  }

  let bestFirstColor = colors[0];

  let bestSecondColor = colors[1];

  let bestRatio = calculateContrastRatio(colors[0], colors[1]);

  for (let firstIndex = 0; firstIndex < colors.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < colors.length;
      secondIndex += 1
    ) {
      const currentRatio = calculateContrastRatio(
        colors[firstIndex],
        colors[secondIndex],
      );

      if (currentRatio > bestRatio) {
        bestRatio = currentRatio;

        bestFirstColor = colors[firstIndex];

        bestSecondColor = colors[secondIndex];
      }
    }
  }

  const firstLuminance = chroma(bestFirstColor).luminance();

  const secondLuminance = chroma(bestSecondColor).luminance();

  if (firstLuminance <= secondLuminance) {
    return {
      foreground: bestFirstColor,

      background: bestSecondColor,
    };
  }

  return {
    foreground: bestSecondColor,

    background: bestFirstColor,
  };
}

export function getContrastResults(contrastRatio) {
  return [
    {
      title: "Normal text",

      description: "Regular text smaller than 18pt",

      standard: "WCAG AA",

      threshold: "4.5:1",

      passed: contrastRatio >= 4.5,
    },
    {
      title: "Normal text",

      description: "Regular text smaller than 18pt",

      standard: "WCAG AAA",

      threshold: "7:1",

      passed: contrastRatio >= 7,
    },
    {
      title: "Large text",

      description: "18pt or 14pt bold and larger",

      standard: "WCAG AA",

      threshold: "3:1",

      passed: contrastRatio >= 3,
    },
    {
      title: "Large text",

      description: "18pt or 14pt bold and larger",

      standard: "WCAG AAA",

      threshold: "4.5:1",

      passed: contrastRatio >= 4.5,
    },
    {
      title: "UI components",

      description: "Icons, borders and interface controls",

      standard: "WCAG AA",

      threshold: "3:1",

      passed: contrastRatio >= 3,
    },
  ];
}

export function getContrastStatus(contrastRatio) {
  if (contrastRatio >= 7) {
    return {
      label: "Excellent contrast",

      message: "This combination passes every contrast check.",

      tone: "excellent",
    };
  }

  if (contrastRatio >= 4.5) {
    return {
      label: "Good contrast",

      message: "Suitable for normal and large text at WCAG AA.",

      tone: "good",
    };
  }

  if (contrastRatio >= 3) {
    return {
      label: "Limited contrast",

      message: "Use this combination only for large text or UI elements.",

      tone: "limited",
    };
  }

  return {
    label: "Insufficient contrast",

    message: "Increase the difference between these two colors.",

    tone: "poor",
  };
}
