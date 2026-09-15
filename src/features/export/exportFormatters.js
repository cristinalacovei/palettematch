export const DESIGN_ROLE_KEYS = [
  "background",
  "surface",
  "text",
  "primary",
  "accent",
];

export const EXPORT_FORMATS = {
  css: {
    label: "CSS",
    description: "CSS custom properties",
    extension: "css",
  },
  scss: {
    label: "SCSS",
    description: "Sass variables",
    extension: "scss",
  },
  json: {
    label: "JSON",
    description: "Structured color data",
    extension: "json",
  },
  tailwind: {
    label: "Tailwind",
    description: "Tailwind configuration",
    extension: "js",
  },
};

export function normalizeDesignSystem(designSystem) {
  if (!designSystem || typeof designSystem !== "object") return null;

  const hasAllRoles = DESIGN_ROLE_KEYS.every(
    (role) => typeof designSystem[role] === "string",
  );
  if (!hasAllRoles) return null;

  return DESIGN_ROLE_KEYS.reduce(
    (normalizedRoles, role) => ({
      ...normalizedRoles,
      [role]: designSystem[role].toUpperCase(),
    }),
    {},
  );
}

export function normalizeExportColors(colors) {
  return colors
    .filter((color) => typeof color === "string")
    .map((color) => color.toUpperCase());
}

export function formatPaletteAsCss(colors, designSystem) {
  const variables = designSystem
    ? DESIGN_ROLE_KEYS.map(
        (role) => `  --color-${role}: ${designSystem[role]};`,
      ).join("\n")
    : colors
        .map((color, index) => `  --palette-${index + 1}: ${color};`)
        .join("\n");

  return `:root {\n${variables}\n}`;
}

export function formatPaletteAsScss(colors, designSystem) {
  if (designSystem) {
    return DESIGN_ROLE_KEYS.map(
      (role) => `$color-${role}: ${designSystem[role]};`,
    ).join("\n");
  }

  return colors
    .map((color, index) => `$palette-${index + 1}: ${color};`)
    .join("\n");
}

export function formatPaletteAsJson(colors, paletteName, designSystem) {
  if (designSystem) {
    return JSON.stringify(
      {
        name: paletteName,
        type: "design-system",
        roles: designSystem,
        palette: colors,
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      name: paletteName,
      type: "color-palette",
      colors: colors.map((color, index) => ({
        name: `Color ${String(index + 1).padStart(2, "0")}`,
        value: color,
      })),
    },
    null,
    2,
  );
}

export function formatPaletteAsTailwind(colors, designSystem) {
  if (designSystem) {
    const roleEntries = DESIGN_ROLE_KEYS.map(
      (role) => `        ${role}: "${designSystem[role]}",`,
    ).join("\n");

    return `module.exports = {
  theme: {
    extend: {
      colors: {
${roleEntries}
      },
    },
  },
};`;
  }

  const colorEntries = colors
    .map((color, index) => `          "${index + 1}": "${color}",`)
    .join("\n");

  return `module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
${colorEntries}
        },
      },
    },
  },
};`;
}

export function formatExportContent(
  formatKey,
  colors,
  paletteName,
  designSystem,
) {
  if (formatKey === "scss") return formatPaletteAsScss(colors, designSystem);
  if (formatKey === "json") {
    return formatPaletteAsJson(colors, paletteName, designSystem);
  }
  if (formatKey === "tailwind") {
    return formatPaletteAsTailwind(colors, designSystem);
  }
  return formatPaletteAsCss(colors, designSystem);
}

export function createSafeFileName(name) {
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || "palette";
}
