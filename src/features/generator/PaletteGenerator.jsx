import React, { useRef, useState } from "react";
import { Check, Lock } from "lucide-react";

import {
  DEFAULT_BASE_COLOR,
  DEFAULT_PALETTE_TYPE,
  PALETTE_TYPES,
} from "../../domain/palette/paletteConstants";
import { createPalette } from "../../domain/palette/paletteGenerator";
import { addPalette } from "../../services/paletteStorage";
import ColorEditor from "../../components/ColorEditor.jsx";
import GeneratorControls from "./GeneratorControls";
import PalettePreview from "./PalettePreview";
import PaletteToolbar from "./PaletteToolbar";
import SavePaletteForm from "./SavePaletteForm";
import "./PaletteGenerator.css";

function PaletteGenerator() {
  const initialColors = createPalette(DEFAULT_BASE_COLOR, DEFAULT_PALETTE_TYPE);
  const [baseColor, setBaseColor] = useState(DEFAULT_BASE_COLOR);
  const [type, setType] = useState(DEFAULT_PALETTE_TYPE);
  const [colors, setColors] = useState(initialColors);
  const [lockedColors, setLockedColors] = useState(() =>
    initialColors.map(() => false),
  );
  const [editingColorIndex, setEditingColorIndex] = useState(null);
  const [paletteName, setPaletteName] = useState("");
  const [notice, setNotice] = useState("");
  const saveInputRef = useRef(null);

  const lockedCount = lockedColors.filter(Boolean).length;
  const editingColor =
    editingColorIndex !== null ? colors[editingColorIndex] : null;
  const selectedPaletteType = PALETTE_TYPES.find((item) => item.value === type);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const toggleColorLock = (colorIndex) => {
    setLockedColors((currentLocks) =>
      currentLocks.map((isLocked, index) =>
        index === colorIndex ? !isLocked : isLocked,
      ),
    );
  };

  const closeColorEditor = () => setEditingColorIndex(null);

  const updateIndividualColor = (colorIndex, newColor) => {
    setColors((currentColors) =>
      currentColors.map((currentColor, index) =>
        index === colorIndex ? newColor : currentColor,
      ),
    );
  };

  const handleTypeChange = (event) => {
    setType(event.target.value);
    setLockedColors(colors.map(() => false));
    closeColorEditor();
  };

  const unlockAllColors = () => {
    setLockedColors(colors.map(() => false));
    showNotice("All colors unlocked");
  };

  const generatePalette = () => {
    const allColorsAreLocked =
      colors.length > 0 && lockedColors.slice(0, colors.length).every(Boolean);

    if (allColorsAreLocked) {
      showNotice("Unlock at least one color to regenerate");
      return;
    }

    const newlyGeneratedColors = createPalette(baseColor, type, true);
    const mergedColors = newlyGeneratedColors.map((newColor, index) =>
      lockedColors[index] && colors[index] ? colors[index] : newColor,
    );
    const updatedLocks = newlyGeneratedColors.map((_, index) =>
      Boolean(lockedColors[index] && colors[index]),
    );

    setColors(mergedColors);
    setLockedColors(updatedLocks);
    closeColorEditor();
    showNotice(
      lockedCount > 0
        ? `${lockedCount} ${
            lockedCount === 1 ? "color preserved" : "colors preserved"
          }`
        : "New palette generated",
    );
  };

  const saveCurrentPalette = () => {
    const trimmedName = paletteName.trim();

    if (!trimmedName) {
      saveInputRef.current?.focus();
      return;
    }

    const savedPalette = addPalette({
      name: trimmedName,
      colors,
      source: "generator",
    });

    if (!savedPalette) {
      showNotice("The palette could not be saved");
      return;
    }

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
          <GeneratorControls
            baseColor={baseColor}
            type={type}
            onBaseColorChange={setBaseColor}
            onTypeChange={handleTypeChange}
            onGenerate={generatePalette}
          />

          <div className="palette-canvas">
            <PaletteToolbar
              paletteTypeLabel={selectedPaletteType?.label}
              lockedCount={lockedCount}
              onUnlockAll={unlockAllColors}
              onCopyPalette={copyPalette}
            />

            <PalettePreview
              colors={colors}
              lockedColors={lockedColors}
              onToggleLock={toggleColorLock}
              onEditColor={setEditingColorIndex}
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

            <SavePaletteForm
              name={paletteName}
              inputRef={saveInputRef}
              onNameChange={setPaletteName}
              onSave={saveCurrentPalette}
            />
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
