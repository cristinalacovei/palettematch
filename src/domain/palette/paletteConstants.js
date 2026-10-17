export const DEFAULT_BASE_COLOR = "#5B5CE2";
export const DEFAULT_PALETTE_TYPE = "analog";

export const PALETTE_TYPES = [
  {
    value: "analog",
    label: "Analog",
  },
  {
    value: "complement",
    label: "Complementary",
  },
  {
    value: "triad",
    label: "Triadic",
  },
  {
    value: "tetradic",
    label: "Tetradic",
  },
  {
    value: "monochrome",
    label: "Monochromatic",
  },
  {
    value: "split-complement",
    label: "Split complementary",
  },
];

export const PALETTE_DESCRIPTIONS = {
  analog: "Neighboring hues create a calm, naturally cohesive palette.",

  complement: "Opposing hues create contrast and a clear visual hierarchy.",

  triad: "Three evenly spaced hues feel balanced, colorful and energetic.",

  tetradic: "Two complementary pairs offer a broad, expressive color range.",

  monochrome: "One hue in varied lightness levels keeps the system focused.",

  "split-complement":
    "A base hue and two nearby opposites balance energy with control.",
};
