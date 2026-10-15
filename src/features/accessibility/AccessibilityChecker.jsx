import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { HEX_PATTERN, normalizeHex } from "../../utils/colorUtils";
import {
  calculateContrastRatio,
  findBestContrastPair,
  getContrastResults,
  getContrastStatus,
  getImportedPalette,
} from "../../domain/accessibility/accessibilityEngine";
import ColorPairControls from "./ColorPairControls";
import ImportedPaletteSelector from "./ImportedPaletteSelector";
import ContrastSummary from "./ContrastSummary";
import ContrastResults from "./ContrastResults";
import AccessibilityPreview from "./AccessibilityPreview";
import PaletteContrastAnalysis from "./PaletteContrastAnalysis";
import { getPalettes } from "../../services/paletteApi";
import { loadPalettes } from "../../services/paletteStorage";
import "./AccessibilityChecker.css";

function AccessibilityChecker() {
  const location = useLocation();
  const routePalette = useMemo(
    () => getImportedPalette(location.state),
    [location.state],
  );
  const { authenticated, isReady } = useAuth();
  const [savedPalettes, setSavedPalettes] = useState([]);
  const [palettesLoading, setPalettesLoading] = useState(true);
  const [palettesError, setPalettesError] = useState("");
  const [mode, setMode] = useState(routePalette ? "palette" : "two-colors");
  const [selectedPaletteId, setSelectedPaletteId] = useState(() =>
    routePalette
      ? location.state?.palette?.id || "__route_palette__"
      : "",
  );
  const previousRouteState = useRef(location.state);

  useEffect(() => {
    if (!isReady) return undefined;

    let cancelled = false;
    async function loadSavedPalettes() {
      setPalettesLoading(true);
      setPalettesError("");

      try {
        const palettes = authenticated ? await getPalettes() : loadPalettes();
        if (!cancelled) {
          setSavedPalettes(Array.isArray(palettes) ? palettes : []);
        }
      } catch (error) {
        console.error("Could not load palettes for accessibility analysis.", error);
        if (!cancelled) {
          setPalettesError("Saved palettes could not be loaded.");
          setSavedPalettes([]);
        }
      } finally {
        if (!cancelled) setPalettesLoading(false);
      }
    }

    loadSavedPalettes();
    return () => {
      cancelled = true;
    };
  }, [authenticated, isReady]);

  useEffect(() => {
    if (previousRouteState.current === location.state) return;
    previousRouteState.current = location.state;

    if (routePalette) {
      setMode("palette");
      setSelectedPaletteId(location.state?.palette?.id || "__route_palette__");
    } else {
      setSelectedPaletteId("");
      setMode("two-colors");
    }
  }, [location.state, routePalette]);

  const selectedPalette = useMemo(() => {
    if (selectedPaletteId === "__route_palette__") return routePalette;
    const savedPalette = savedPalettes.find(
      (palette) => String(palette.id) === selectedPaletteId,
    );
    if (savedPalette) {
      return getImportedPalette({ palette: savedPalette });
    }
    if (
      routePalette &&
      String(location.state?.palette?.id) === selectedPaletteId
    ) {
      return routePalette;
    }
    return null;
  }, [location.state, routePalette, savedPalettes, selectedPaletteId]);

  const initialPair = useMemo(
    () => findBestContrastPair(selectedPalette?.colors || []),
    [selectedPalette],
  );
  const [foreground, setForeground] = useState(initialPair.foreground);
  const [background, setBackground] = useState(initialPair.background);
  const [foregroundInput, setForegroundInput] = useState(initialPair.foreground);
  const [backgroundInput, setBackgroundInput] = useState(initialPair.background);
  const [activePaletteRole, setActivePaletteRole] = useState("foreground");

  useEffect(() => {
    const nextPair = findBestContrastPair(selectedPalette?.colors || []);
    setForeground(nextPair.foreground);
    setBackground(nextPair.background);
    setForegroundInput(nextPair.foreground);
    setBackgroundInput(nextPair.background);
  }, [selectedPalette]);

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
            Analyze every unique color pair in a palette or compare two colors
            and preview them in a real interface.
          </p>
        </div>
        <div className="accessibility-page__local-badge">
          <ShieldCheck size={16} aria-hidden="true" />
          WCAG contrast
        </div>
      </section>

      <section className="accessibility-mode" aria-label="Accessibility mode">
        <button
          type="button"
          aria-pressed={mode === "two-colors"}
          className={mode === "two-colors" ? "accessibility-mode__active" : ""}
          onClick={() => setMode("two-colors")}
        >
          Check two colors
        </button>
        <button
          type="button"
          aria-pressed={mode === "palette"}
          className={mode === "palette" ? "accessibility-mode__active" : ""}
          onClick={() => setMode("palette")}
        >
          Analyze a palette
        </button>
      </section>

      {mode === "palette" && (
        <section className="accessibility-palette-picker">
          <label htmlFor="accessibility-palette">Saved palette</label>
          <select
            id="accessibility-palette"
            value={selectedPaletteId}
            onChange={(event) => setSelectedPaletteId(event.target.value)}
          >
            <option value="">Choose a saved palette</option>
            {routePalette &&
              !savedPalettes.some(
                (palette) =>
                  String(palette.id) === String(location.state?.palette?.id),
              ) && (
                <option value={location.state?.palette?.id || "__route_palette__"}>
                  {routePalette.name} (opened from Library)
                </option>
              )}
            {savedPalettes.map((palette) => (
              <option key={palette.id} value={String(palette.id)}>
                {palette.name}
              </option>
            ))}
          </select>

          {palettesLoading && <p>Loading saved palettes...</p>}
          {!palettesLoading && palettesError && (
            <p role="alert">{palettesError}</p>
          )}
          {!palettesLoading &&
            !palettesError &&
            savedPalettes.length === 0 &&
            !routePalette && (
              <p role="status">
                You have no saved palettes to analyze yet. Save a palette from
                the Generator or Image Extractor first.
              </p>
            )}

          {selectedPalette && (
            <div className="accessibility-palette-picker__selection">
              <strong>{selectedPalette.name}</strong>
              {selectedPalette.colors.length > 0 ? (
                <div className="accessibility-palette-picker__colors">
                  {selectedPalette.colors.map((color, index) => (
                    <span key={`${color}-${index}`}>
                      <i style={{ backgroundColor: color }} />
                      <code>{color}</code>
                    </span>
                  ))}
                </div>
              ) : (
                <p>This palette has no valid HEX colors to analyze.</p>
              )}
            </div>
          )}
        </section>
      )}

      {mode === "palette" && selectedPalette && (
        <PaletteContrastAnalysis palette={selectedPalette} />
      )}

      {mode === "two-colors" && (
        <section className="accessibility-workspace">
          <aside className="accessibility-controls">
            <div className="accessibility-section-heading">
              <span>Colors</span>
              <strong>01</strong>
            </div>

            {selectedPalette && (
              <ImportedPaletteSelector
                palette={selectedPalette}
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
      )}
    </main>
  );
}

export default AccessibilityChecker;
