import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import chroma from "chroma-js";
import { ArrowLeftRight, Check, ShieldCheck, X } from "lucide-react";
import "./AccessibilityChecker.css";

const HEX_PATTERN = /^#[0-9A-F]{6}$/i;

const DEFAULT_FOREGROUND = "#17181C";
const DEFAULT_BACKGROUND = "#FFFFFF";

function normalizeHex(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const valueWithHash = trimmedValue.startsWith("#")
    ? trimmedValue
    : `#${trimmedValue}`;

  return valueWithHash.toUpperCase();
}

function getImportedPalette(routeState) {
  const receivedPalette = routeState?.palette;

  if (!receivedPalette || !Array.isArray(receivedPalette.colors)) {
    return null;
  }

  const validColors = receivedPalette.colors
    .filter((color) => {
      if (typeof color !== "string") {
        return false;
      }

      return HEX_PATTERN.test(normalizeHex(color));
    })
    .map((color) => normalizeHex(color));

  const uniqueColors = [...new Set(validColors)];

  if (uniqueColors.length === 0) {
    return null;
  }

  return {
    name: receivedPalette.name || "Imported palette",
    colors: uniqueColors,
  };
}

function findBestContrastPair(colors) {
  if (!colors || colors.length < 2) {
    return {
      foreground: DEFAULT_FOREGROUND,
      background: DEFAULT_BACKGROUND,
    };
  }

  let bestFirstColor = colors[0];
  let bestSecondColor = colors[1];
  let bestRatio = chroma.contrast(colors[0], colors[1]);

  for (let firstIndex = 0; firstIndex < colors.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < colors.length;
      secondIndex += 1
    ) {
      const currentRatio = chroma.contrast(
        colors[firstIndex],
        colors[secondIndex],
      );

      if (currentRatio > bestRatio) {
        bestRatio = currentRatio;
        bestFirstColor = colors[firstIndex];
        bestSecondColor = colors[secondIndex];
      }
    }
  }

  const firstLuminance = chroma(bestFirstColor).luminance();

  const secondLuminance = chroma(bestSecondColor).luminance();

  if (firstLuminance <= secondLuminance) {
    return {
      foreground: bestFirstColor,
      background: bestSecondColor,
    };
  }

  return {
    foreground: bestSecondColor,
    background: bestFirstColor,
  };
}

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

  const [foregroundInput, setForegroundInput] = useState(
    initialPair.foreground,
  );

  const [backgroundInput, setBackgroundInput] = useState(
    initialPair.background,
  );

  const [activePaletteRole, setActivePaletteRole] = useState("foreground");

  const contrastRatio = useMemo(
    () => chroma.contrast(foreground, background),
    [foreground, background],
  );

  const roundedRatio = contrastRatio.toFixed(2);

  const foregroundHasError = !HEX_PATTERN.test(foregroundInput);

  const backgroundHasError = !HEX_PATTERN.test(backgroundInput);

  const results = [
    {
      title: "Normal text",
      description: "Regular text smaller than 18pt",
      standard: "WCAG AA",
      threshold: "4.5:1",
      passed: contrastRatio >= 4.5,
    },
    {
      title: "Normal text",
      description: "Regular text smaller than 18pt",
      standard: "WCAG AAA",
      threshold: "7:1",
      passed: contrastRatio >= 7,
    },
    {
      title: "Large text",
      description: "18pt or 14pt bold and larger",
      standard: "WCAG AA",
      threshold: "3:1",
      passed: contrastRatio >= 3,
    },
    {
      title: "Large text",
      description: "18pt or 14pt bold and larger",
      standard: "WCAG AAA",
      threshold: "4.5:1",
      passed: contrastRatio >= 4.5,
    },
    {
      title: "UI components",
      description: "Icons, borders and interface controls",
      standard: "WCAG AA",
      threshold: "3:1",
      passed: contrastRatio >= 3,
    },
  ];

  const passedChecks = results.filter((result) => result.passed).length;

  const getContrastStatus = () => {
    if (contrastRatio >= 7) {
      return {
        label: "Excellent contrast",
        message: "This combination passes every contrast check.",
        tone: "excellent",
      };
    }

    if (contrastRatio >= 4.5) {
      return {
        label: "Good contrast",
        message: "Suitable for normal and large text at WCAG AA.",
        tone: "good",
      };
    }

    if (contrastRatio >= 3) {
      return {
        label: "Limited contrast",
        message: "Use this combination only for large text or UI elements.",
        tone: "limited",
      };
    }

    return {
      label: "Insufficient contrast",
      message: "Increase the difference between these two colors.",
      tone: "poor",
    };
  };

  const contrastStatus = getContrastStatus();

  const handleTextColorChange = (type, value) => {
    const normalizedValue = normalizeHex(value);

    if (type === "foreground") {
      setForegroundInput(normalizedValue);

      if (HEX_PATTERN.test(normalizedValue)) {
        setForeground(normalizedValue);
      }

      return;
    }

    setBackgroundInput(normalizedValue);

    if (HEX_PATTERN.test(normalizedValue)) {
      setBackground(normalizedValue);
    }
  };

  const handlePickerColorChange = (type, value) => {
    const normalizedValue = value.toUpperCase();

    if (type === "foreground") {
      setForeground(normalizedValue);
      setForegroundInput(normalizedValue);
      return;
    }

    setBackground(normalizedValue);
    setBackgroundInput(normalizedValue);
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
      return;
    }

    setBackground(color);
    setBackgroundInput(color);
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
            <div className="accessibility-imported">
              <div className="accessibility-imported__heading">
                <span>Imported palette</span>

                <strong>{importedPalette.name}</strong>
              </div>

              <p>Choose a role, then select one of the palette colors.</p>

              <div
                className="accessibility-role-selector"
                aria-label="Color role"
              >
                <button
                  type="button"
                  className={
                    activePaletteRole === "foreground"
                      ? "accessibility-role-selector__button accessibility-role-selector__button--active"
                      : "accessibility-role-selector__button"
                  }
                  onClick={() => setActivePaletteRole("foreground")}
                >
                  Text
                </button>

                <button
                  type="button"
                  className={
                    activePaletteRole === "background"
                      ? "accessibility-role-selector__button accessibility-role-selector__button--active"
                      : "accessibility-role-selector__button"
                  }
                  onClick={() => setActivePaletteRole("background")}
                >
                  Background
                </button>
              </div>

              <div className="accessibility-imported__swatches">
                {importedPalette.colors.map((color, index) => {
                  const isForeground = foreground === color;

                  const isBackground = background === color;

                  return (
                    <button
                      type="button"
                      className={`accessibility-imported__swatch ${
                        isForeground || isBackground
                          ? "accessibility-imported__swatch--selected"
                          : ""
                      }`}
                      key={`${color}-${index}`}
                      onClick={() => applyImportedColor(color)}
                      title={`Use ${color} as ${
                        activePaletteRole === "foreground"
                          ? "text"
                          : "background"
                      }`}
                      aria-label={`Use ${color} as ${
                        activePaletteRole === "foreground"
                          ? "text color"
                          : "background color"
                      }`}
                    >
                      <span
                        style={{
                          backgroundColor: color,
                        }}
                      />

                      <small>{color}</small>

                      {(isForeground || isBackground) && (
                        <em>
                          {isForeground && isBackground
                            ? "Both"
                            : isForeground
                              ? "Text"
                              : "Background"}
                        </em>
                      )}
                    </button>
                  );
                })}
              </div>

              <small className="accessibility-imported__note">
                The pair with the highest contrast was selected automatically.
              </small>
            </div>
          )}

          <div className="accessibility-color-field">
            <label htmlFor="foreground-color">Text color</label>

            <div
              className={`accessibility-color-input ${
                foregroundHasError ? "accessibility-color-input--error" : ""
              }`}
            >
              <input
                className="accessibility-color-input__picker"
                type="color"
                value={foreground}
                onChange={(event) =>
                  handlePickerColorChange("foreground", event.target.value)
                }
                aria-label="Choose text color"
              />

              <input
                id="foreground-color"
                className="accessibility-color-input__text"
                type="text"
                value={foregroundInput}
                onFocus={() => setActivePaletteRole("foreground")}
                onChange={(event) =>
                  handleTextColorChange("foreground", event.target.value)
                }
                onBlur={() => handleInputBlur("foreground")}
                maxLength={7}
                spellCheck="false"
                aria-invalid={foregroundHasError}
              />
            </div>

            {foregroundHasError && (
              <small className="accessibility-color-field__error">
                Enter a valid six-digit HEX color.
              </small>
            )}
          </div>

          <button
            className="accessibility-swap-button"
            type="button"
            onClick={handleSwapColors}
          >
            <ArrowLeftRight size={18} aria-hidden="true" />
            Swap colors
          </button>

          <div className="accessibility-color-field">
            <label htmlFor="background-color">Background color</label>

            <div
              className={`accessibility-color-input ${
                backgroundHasError ? "accessibility-color-input--error" : ""
              }`}
            >
              <input
                className="accessibility-color-input__picker"
                type="color"
                value={background}
                onChange={(event) =>
                  handlePickerColorChange("background", event.target.value)
                }
                aria-label="Choose background color"
              />

              <input
                id="background-color"
                className="accessibility-color-input__text"
                type="text"
                value={backgroundInput}
                onFocus={() => setActivePaletteRole("background")}
                onChange={(event) =>
                  handleTextColorChange("background", event.target.value)
                }
                onBlur={() => handleInputBlur("background")}
                maxLength={7}
                spellCheck="false"
                aria-invalid={backgroundHasError}
              />
            </div>

            {backgroundHasError && (
              <small className="accessibility-color-field__error">
                Enter a valid six-digit HEX color.
              </small>
            )}
          </div>

          <div className="accessibility-ratio" aria-live="polite">
            <span>Contrast ratio</span>
            <strong>{roundedRatio}:1</strong>
            <small>{passedChecks} of 5 checks passed</small>
          </div>

          <div
            className={`accessibility-summary accessibility-summary--${contrastStatus.tone}`}
          >
            <strong>{contrastStatus.label}</strong>

            <p>{contrastStatus.message}</p>
          </div>
        </aside>

        <div className="accessibility-results">
          <div className="accessibility-preview-heading">
            <div>
              <span>Live preview</span>
              <h2>See the combination in context</h2>
            </div>

            <div className="accessibility-preview-heading__colors">
              <span>{foreground}</span>
              <span>{background}</span>
            </div>
          </div>

          <div
            className="accessibility-preview"
            style={{
              color: foreground,
              backgroundColor: background,
            }}
          >
            <span className="accessibility-preview__label">
              Product design toolkit
            </span>

            <h3>Create accessible experiences.</h3>

            <p>
              Good contrast makes content easier to read and helps more people
              use your product comfortably.
            </p>

            <button
              type="button"
              style={{
                color: background,
                backgroundColor: foreground,
                borderColor: foreground,
              }}
            >
              Explore the palette
            </button>

            <small>
              This smaller text demonstrates how the combination behaves in
              supporting content.
            </small>
          </div>

          <div className="accessibility-checks">
            <div className="accessibility-checks__heading">
              <div>
                <span>WCAG results</span>
                <h2>Contrast requirements</h2>
              </div>

              <strong>
                {passedChecks}/{results.length} passed
              </strong>
            </div>

            <div className="accessibility-checks__list">
              {results.map((result, index) => (
                <article
                  className={`accessibility-result ${
                    result.passed
                      ? "accessibility-result--passed"
                      : "accessibility-result--failed"
                  }`}
                  key={`${result.title}-${result.standard}-${index}`}
                >
                  <div className="accessibility-result__icon">
                    {result.passed ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <X size={18} aria-hidden="true" />
                    )}
                  </div>

                  <div className="accessibility-result__content">
                    <strong>{result.title}</strong>

                    <span>{result.description}</span>
                  </div>

                  <div className="accessibility-result__requirement">
                    <strong>{result.standard}</strong>

                    <span>Minimum {result.threshold}</span>
                  </div>

                  <span className="accessibility-result__status">
                    {result.passed ? "Pass" : "Fail"}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AccessibilityChecker;
