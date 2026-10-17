import { generateId } from "../utils/idUtils";

const STORAGE_KEY = "palettes";

function normalizePalette(palette, index = 0) {
  return {
    id: palette.id || `legacy-${Date.now()}-${index}`,

    name: palette.name || `Untitled palette ${index + 1}`,

    colors: Array.isArray(palette.colors) ? palette.colors : [],

    source: palette.source || "generator",

    favorite: Boolean(palette.favorite),

    designSystem:
      palette.designSystem && typeof palette.designSystem === "object"
        ? palette.designSystem
        : null,

    createdAt: palette.createdAt || new Date(0).toISOString(),
  };
}

export function loadPalettes() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map(normalizePalette);
  } catch {
    return [];
  }
}

export function savePalettes(palettes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));

    return true;
  } catch {
    return false;
  }
}

export function createPaletteRecord({
  name,
  colors,
  source = "generator",
  favorite = false,
  designSystem = null,
}) {
  return {
    id: generateId(),

    name: name.trim(),

    colors: [...colors],

    source,

    favorite,

    designSystem,

    createdAt: new Date().toISOString(),
  };
}

export function addPalette(data) {
  const palettes = loadPalettes();

  const newPalette = createPaletteRecord(data);

  const saved = savePalettes([...palettes, newPalette]);

  return saved ? newPalette : null;
}

export function updatePalette(paletteId, updates) {
  const palettes = loadPalettes();

  let updatedPalette = null;

  const updatedPalettes = palettes.map((palette) => {
    if (palette.id !== paletteId) {
      return palette;
    }

    updatedPalette = {
      ...palette,
      ...updates,
    };

    return updatedPalette;
  });

  if (!updatedPalette) {
    return null;
  }

  const saved = savePalettes(updatedPalettes);

  return saved ? updatedPalette : null;
}

export function savePaletteDesignSystem(paletteId, roles) {
  return updatePalette(paletteId, {
    designSystem: {
      ...roles,
      updatedAt: new Date().toISOString(),
    },
  });
}
