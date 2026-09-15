import ColorThief from "colorthief";

import { rgbToHex } from "../../utils/colorUtils";

export function extractPaletteFromImage(image, colorCount) {
  const colorThief = new ColorThief();
  const extractedColors = colorThief.getPalette(image, colorCount);

  if (!extractedColors || extractedColors.length === 0) {
    throw new Error("No colors could be extracted.");
  }

  return {
    rgbColors: extractedColors,
    hexColors: extractedColors.map(([red, green, blue]) =>
      rgbToHex(red, green, blue),
    ),
  };
}
