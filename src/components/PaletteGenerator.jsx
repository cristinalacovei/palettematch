import React, { useRef, useState } from "react";
import chroma from "chroma-js";
import {
  Check,
  ChevronDown,
  Copy,
  Lock,
  RefreshCw,
  Save,
  Unlock,
} from "lucide-react";
import { ChromePicker } from "react-color";
import PalettePreview from "./PalettePreview";
import ColorEditor from "./ColorEditor.jsx";
import "./PaletteGenerator.css";

const PALETTE_TYPES = [
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

const PALETTE_DESCRIPTIONS = {
  analog: "Neighboring hues create a calm, naturally cohesive palette.",

  complement: "Opposing hues create contrast and a clear visual hierarchy.",

  triad: "Three evenly spaced hues feel balanced, colorful and energetic.",

  tetradic: "Two complementary pairs offer a broad, expressive color range.",

  monochrome: "One hue in varied lightness levels keeps the system focused.",

  "split-complement":
    "A base hue and two nearby opposites balance energy with control.",
};

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

function createPalette(baseColor, type, shouldAddVariations = false) {
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

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function PaletteGenerator() {
  const initialColors = createPalette("#5B5CE2", "analog");

  const [baseColor, setBaseColor] = useState("#5B5CE2");

  const [type, setType] = useState("analog");

  const [colors, setColors] = useState(initialColors);

  const [lockedColors, setLockedColors] = useState(() =>
    initialColors.map(() => false),
  );

  const [editingColorIndex, setEditingColorIndex] = useState(null);

  const [paletteName, setPaletteName] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);

  const [notice, setNotice] = useState("");

  const saveInputRef = useRef(null);

  const lockedCount = lockedColors.filter(Boolean).length;

  const editingColor =
    editingColorIndex !== null ? colors[editingColorIndex] : null;

  const selectedPaletteType = PALETTE_TYPES.find((item) => item.value === type);

  const showNotice = (message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 1800);
  };

  const toggleColorLock = (colorIndex) => {
    setLockedColors((currentLocks) =>
      currentLocks.map((isLocked, index) =>
        index === colorIndex ? !isLocked : isLocked,
      ),
    );
  };

  const unlockAllColors = () => {
    setLockedColors(colors.map(() => false));

    showNotice("All colors unlocked");
  };

  const openColorEditor = (colorIndex) => {
    setEditingColorIndex(colorIndex);
  };

  const closeColorEditor = () => {
    setEditingColorIndex(null);
  };

  const updateIndividualColor = (colorIndex, newColor) => {
    setColors((currentColors) =>
      currentColors.map((currentColor, index) =>
        index === colorIndex ? newColor : currentColor,
      ),
    );
  };

  const handleTypeChange = (event) => {
    const newType = event.target.value;

    setType(newType);

    setLockedColors(colors.map(() => false));

    closeColorEditor();
  };

  const generatePalette = () => {
    const allColorsAreLocked =
      colors.length > 0 && lockedColors.slice(0, colors.length).every(Boolean);

    if (allColorsAreLocked) {
      showNotice("Unlock at least one color to regenerate");

      return;
    }

    const newlyGeneratedColors = createPalette(baseColor, type, true);

    const mergedColors = newlyGeneratedColors.map((newColor, index) => {
      const shouldKeepCurrentColor = lockedColors[index] && colors[index];

      return shouldKeepCurrentColor ? colors[index] : newColor;
    });

    const updatedLocks = newlyGeneratedColors.map((_, index) =>
      Boolean(lockedColors[index] && colors[index]),
    );

    setColors(mergedColors);
    setLockedColors(updatedLocks);
    closeColorEditor();

    if (lockedCount > 0) {
      showNotice(
        `${lockedCount} ${
          lockedCount === 1 ? "color preserved" : "colors preserved"
        }`,
      );
    } else {
      showNotice("New palette generated");
    }
  };

  const saveCurrentPalette = () => {
    if (!paletteName.trim()) {
      saveInputRef.current?.focus();
      return;
    }

    let savedPalettes = [];

    try {
      savedPalettes = JSON.parse(localStorage.getItem("palettes") || "[]");
    } catch {
      savedPalettes = [];
    }

    const newPalette = {
      id: generateId(),
      name: paletteName.trim(),
      colors,
      source: "generator",
      favorite: false,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "palettes",
      JSON.stringify([...savedPalettes, newPalette]),
    );

    setPaletteName("");

    showNotice("Saved to your library");
  };

  const copyPalette = async () => {
    try {
      await navigator.clipboard.writeText(colors.join(", "));

      showNotice("All color values copied");
    } catch {
      showNotice("Copy is not available in this browser");
    }
  };

  return (
    <>
      <main className="workspace-page">
        <div className="workspace-heading">
          <div>
            <span className="workspace-kicker">Palette generator</span>

            <h1>Create a color system</h1>

            <p>
              Generate a harmony, lock the colors you want to preserve and edit
              each value individually.
            </p>
          </div>

          <span className="workspace-status">
            <span />
            Stored locally
          </span>
        </div>

        <section className="generator-shell">
          <aside className="control-panel">
            <div className="control-panel__header">
              <span>Controls</span>
              <span>01</span>
            </div>

            <div className="form-field">
              <label>Base color</label>

              <button
                className="color-value-control"
                type="button"
                onClick={() => setPickerOpen((currentValue) => !currentValue)}
                aria-expanded={pickerOpen}
              >
                <span
                  className="color-value-control__swatch"
                  style={{
                    backgroundColor: baseColor,
                  }}
                />

                <code>{baseColor.toUpperCase()}</code>

                <ChevronDown size={16} aria-hidden="true" />
              </button>

              {pickerOpen && (
                <div className="picker-popover">
                  <ChromePicker
                    color={baseColor}
                    onChange={(color) => setBaseColor(color.hex.toUpperCase())}
                    disableAlpha
                  />
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="harmony">Color harmony</label>

              <div className="select-control">
                <select id="harmony" value={type} onChange={handleTypeChange}>
                  {PALETTE_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <ChevronDown size={16} aria-hidden="true" />
              </div>

              <p>{PALETTE_DESCRIPTIONS[type]}</p>
            </div>

            <button
              className="generate-button"
              type="button"
              onClick={generatePalette}
            >
              <RefreshCw size={17} aria-hidden="true" />
              Generate palette
            </button>

            <p className="control-note">
              Lock a color to preserve it or use Edit to change its HEX, RGB and
              HSL values.
            </p>
          </aside>

          <div className="palette-canvas">
            <div className="palette-toolbar">
              <div>
                <span className="palette-toolbar__label">
                  Generated palette
                </span>

                <strong>{selectedPaletteType?.label}</strong>
              </div>

              <div className="palette-toolbar__actions">
                {lockedCount > 0 && (
                  <button type="button" onClick={unlockAllColors}>
                    <Unlock size={16} aria-hidden="true" />
                    Unlock all
                  </button>
                )}

                <button type="button" onClick={copyPalette}>
                  <Copy size={16} aria-hidden="true" />
                  Copy values
                </button>
              </div>
            </div>

            <PalettePreview
              colors={colors}
              lockedColors={lockedColors}
              onToggleLock={toggleColorLock}
              onEditColor={openColorEditor}
            />

            <div className="lock-hint">
              <div>
                <span className="lock-hint__icon">
                  <Lock size={15} aria-hidden="true" />
                </span>

                <span>
                  Lock colors before regenerating or edit their values directly.
                </span>
              </div>

              <strong>
                {lockedCount}{" "}
                {lockedCount === 1 ? "color locked" : "colors locked"}
              </strong>
            </div>

            <div className="save-bar">
              <div>
                <label htmlFor="palette-name">Save this direction</label>

                <span>Give it a name you will recognize later.</span>
              </div>

              <div className="save-bar__form">
                <input
                  id="palette-name"
                  ref={saveInputRef}
                  type="text"
                  placeholder="e.g. Midnight product"
                  value={paletteName}
                  onChange={(event) => setPaletteName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      saveCurrentPalette();
                    }
                  }}
                />

                <button type="button" onClick={saveCurrentPalette}>
                  <Save size={16} aria-hidden="true" />
                  Save palette
                </button>
              </div>
            </div>
          </div>
        </section>

        <div
          className={`toast ${notice ? "toast--visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          <Check size={16} aria-hidden="true" />
          {notice}
        </div>
      </main>

      {editingColorIndex !== null && editingColor && (
        <ColorEditor
          color={editingColor}
          colorIndex={editingColorIndex}
          onChange={updateIndividualColor}
          onClose={closeColorEditor}
        />
      )}
    </>
  );
}

export default PaletteGenerator;
