import chroma from "chroma-js";

import { HEX_PATTERN, normalizeColor } from "../../utils/colorUtils";
import { COLOR_SYSTEM_ROLE_KEYS } from "./colorSystemConstants";

export function getImportedPalette(routeState) {
  const receivedPalette = routeState?.palette;

  if (!receivedPalette || !Array.isArray(receivedPalette.colors)) {
    return null;
  }

  const validColors = receivedPalette.colors
    .filter((color) => typeof color === "string" && HEX_PATTERN.test(color))
    .map(normalizeColor);
  const uniqueColors = [...new Set(validColors)];

  if (uniqueColors.length < 2) {
    return null;
  }

  return {
    id: receivedPalette.id || null,
    name: receivedPalette.name || "Untitled palette",
    colors: uniqueColors,
    designSystem:
      receivedPalette.designSystem &&
      typeof receivedPalette.designSystem === "object"
        ? receivedPalette.designSystem
        : null,
  };
}

function getColorScore(color) {
  const colorValue = chroma(color);
  const saturation = colorValue.get("hsl.s") || 0;
  const luminance = colorValue.luminance();
  const middleLuminanceScore = 1 - Math.abs(luminance - 0.45);

  return saturation * 0.75 + middleLuminanceScore * 0.25;
}

function findStrongestColor(colors) {
  if (colors.length === 0) {
    return null;
  }

  return [...colors].sort(
    (first, second) => getColorScore(second) - getColorScore(first),
  )[0];
}

export function createRoleAssignments(colors) {
  const sortedByLuminance = [...colors].sort(
    (first, second) => chroma(first).luminance() - chroma(second).luminance(),
  );
  const darkestColor = sortedByLuminance[0];
  const lightestColor = sortedByLuminance[sortedByLuminance.length - 1];
  const surfaceColor =
    sortedByLuminance.length >= 3
      ? sortedByLuminance[sortedByLuminance.length - 2]
      : normalizeColor(chroma(lightestColor).darken(0.35));
  const primaryCandidates = colors.filter(
    (color) =>
      color !== darkestColor &&
      color !== lightestColor &&
      color !== surfaceColor,
  );
  const primaryColor =
    findStrongestColor(primaryCandidates) ||
    findStrongestColor(
      colors.filter(
        (color) => color !== darkestColor && color !== lightestColor,
      ),
    ) ||
    darkestColor;
  const accentCandidates = colors.filter(
    (color) =>
      color !== darkestColor &&
      color !== lightestColor &&
      color !== surfaceColor &&
      color !== primaryColor,
  );
  const accentColor =
    findStrongestColor(accentCandidates) ||
    colors.find((color) => color !== primaryColor && color !== darkestColor) ||
    primaryColor;

  return {
    background: lightestColor,
    surface: surfaceColor,
    text: darkestColor,
    primary: primaryColor,
    accent: accentColor,
  };
}

export function getSavedRoleAssignments(designSystem) {
  if (!designSystem || typeof designSystem !== "object") {
    return null;
  }

  const hasValidRoles = COLOR_SYSTEM_ROLE_KEYS.every(
    (roleKey) =>
      typeof designSystem[roleKey] === "string" &&
      HEX_PATTERN.test(designSystem[roleKey]),
  );

  if (!hasValidRoles) {
    return null;
  }

  return COLOR_SYSTEM_ROLE_KEYS.reduce(
    (savedRoles, roleKey) => ({
      ...savedRoles,
      [roleKey]: normalizeColor(designSystem[roleKey]),
    }),
    {},
  );
}

export function getInitialRoleAssignments(palette) {
  return (
    getSavedRoleAssignments(palette.designSystem) ||
    createRoleAssignments(palette.colors)
  );
}

export function getBestTextColor(background, candidates) {
  return [...candidates].sort(
    (first, second) =>
      chroma.contrast(second, background) - chroma.contrast(first, background),
  )[0];
}
