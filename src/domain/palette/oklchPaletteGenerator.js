import { hexToOklch, oklchToHex } from "../color/oklch";

const ACHROMATIC_HUE = 250;
const ACHROMATIC_CHROMA = 0.08;
const LIGHTNESS_OFFSETS = [-0.18, -0.09, 0, 0.09, 0.18];
const CHROMA_MULTIPLIERS = [0.55, 0.8, 1, 0.8, 0.55];

export function createOklchPalette(baseColor) {
  const base = hexToOklch(baseColor);
  const isAchromatic = base.h === null;
  const hue = isAchromatic ? ACHROMATIC_HUE : base.h;
  const chroma = isAchromatic ? ACHROMATIC_CHROMA : base.c;
  const normalizedBaseColor = baseColor.toUpperCase();

  return LIGHTNESS_OFFSETS.map((lightnessOffset, index) => {
    if (lightnessOffset === 0) {
      return normalizedBaseColor;
    }

    return oklchToHex({
      l: Math.min(1, Math.max(0, base.l + lightnessOffset)),
      c: chroma * CHROMA_MULTIPLIERS[index],
      h: hue,
    });
  });
}
