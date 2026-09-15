import React, { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";

import { HEX_PATTERN, normalizeHex } from "../../utils/colorUtils";
import {
  calculateContrastRatio,
  findBestContrastPair,
  getContrastResults,
  getContrastStatus,
  getImportedPalette,
} from "../../domain/palette/accesibilityEngine";
import ColorPairControls from "./ColorPairControls";
import ImportedPaletteSelector from "./ImportedPaletteSelector";
import ContrastSummary from "./ContrastSummary";
import ContrastResults from "./ContrastResults";
import AccessibilityPreview from "./AccessibilityPreview";
import "./AccessibilityChecker.css";

function AccessibilityChecker() {
  const location = useLocation();
  const importedPalette = useMemo(
    () => getImportedPalette(location.state),
    [location.state],
  );
  const initialPair = useMemo(
    () => findBestContrastPair(importedPalette?.colors || []),
    [importedPalette],
  );
  const [foreground, setForeground] = useState(initialPair.foreground);
  const [background, setBackground] = useState(initialPair.background);
  const [foregroundInput, setForegroundInput] = useState(initialPair.foreground);
  const [backgroundInput, setBackgroundInput] = useState(initialPair.background);
  const [activePaletteRole, setActivePaletteRole] = useState("foreground");

  const contrastRatio = useMemo(
    () => calculateContrastRatio(foreground, background),
    [foreground, background],
  );
  const roundedRatio = contrastRatio.toFixed(2);
  const foregroundHasError = !HEX_PATTERN.test(foregroundInput);
  const backgroundHasError = !HEX_PATTERN.test(backgroundInput);
  const results = useMemo(
    () => getContrastResults(contrastRatio),
    [contrastRatio],
  );
  const passedChecks = results.filter((result) => result.passed).length;
  const contrastStatus = useMemo(
    () => getContrastStatus(contrastRatio),
    [contrastRatio],
  );

  const handleTextColorChange = (type, value) => {
    const normalizedValue = normalizeHex(value);
    const isForeground = type === "foreground";

    if (isForeground) {
      setForegroundInput(normalizedValue);
      if (HEX_PATTERN.test(normalizedValue)) setForeground(normalizedValue);
    } else {
      setBackgroundInput(normalizedValue);
      if (HEX_PATTERN.test(normalizedValue)) setBackground(normalizedValue);
    }
  };

  const handlePickerColorChange = (type, value) => {
    const normalizedValue = value.toUpperCase();

    if (type === "foreground") {
      setForeground(normalizedValue);
      setForegroundInput(normalizedValue);
    } else {
      setBackground(normalizedValue);
      setBackgroundInput(normalizedValue);
    }
  };

  const handleInputBlur = (type) => {
    if (type === "foreground" && foregroundHasError) {
      setForegroundInput(foreground);
    }
    if (type === "background" && backgroundHasError) {
      setBackgroundInput(background);
    }
  };

  const handleSwapColors = () => {
    setForeground(background);
    setForegroundInput(background);
    setBackground(foreground);
    setBackgroundInput(foreground);
  };

  const applyImportedColor = (color) => {
    if (activePaletteRole === "foreground") {
      setForeground(color);
      setForegroundInput(color);
    } else {
      setBackground(color);
      setBackgroundInput(color);
    }
  };

  return (
    <main className="accessibility-page">
      <section className="accessibility-page__intro">
        <div>
          <span className="accessibility-page__eyebrow">
            Accessibility checker
          </span>
          <h1>Build color combinations everyone can read.</h1>
          <p>
            Compare two colors, check their WCAG contrast score and preview them
            in a real interface.
          </p>
        </div>
        <div className="accessibility-page__local-badge">
          <ShieldCheck size={16} aria-hidden="true" />
          WCAG contrast
        </div>
      </section>

      <section className="accessibility-workspace">
        <aside className="accessibility-controls">
          <div className="accessibility-section-heading">
            <span>Colors</span>
            <strong>01</strong>
          </div>

          {importedPalette && (
            <ImportedPaletteSelector
              palette={importedPalette}
              activeRole={activePaletteRole}
              foreground={foreground}
              background={background}
              onRoleChange={setActivePaletteRole}
              onColorSelect={applyImportedColor}
            />
          )}

          <ColorPairControls
            foreground={foreground}
            background={background}
            foregroundInput={foregroundInput}
            backgroundInput={backgroundInput}
            foregroundHasError={foregroundHasError}
            backgroundHasError={backgroundHasError}
            onTextColorChange={handleTextColorChange}
            onPickerColorChange={handlePickerColorChange}
            onInputFocus={setActivePaletteRole}
            onInputBlur={handleInputBlur}
            onSwap={handleSwapColors}
          />

          <ContrastSummary
            roundedRatio={roundedRatio}
            passedChecks={passedChecks}
            totalChecks={results.length}
            status={contrastStatus}
          />
        </aside>

        <div className="accessibility-results">
          <AccessibilityPreview
            foreground={foreground}
            background={background}
          />
          <ContrastResults results={results} passedChecks={passedChecks} />
        </div>
      </section>
    </main>
  );
}

export default AccessibilityChecker;
