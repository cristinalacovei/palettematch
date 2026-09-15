import React, { useEffect, useState } from "react";
import chroma from "chroma-js";
import { Check, Copy, SlidersHorizontal, X } from "lucide-react";
import "./ColorEditor.css";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getColorValues(color) {
  const safeColor = chroma(color);

  const [red, green, blue] = safeColor.rgb();

  const [rawHue, rawSaturation, rawLightness] = safeColor.hsl();

  return {
    hex: safeColor.hex().toUpperCase(),

    rgb: {
      red: Math.round(red),
      green: Math.round(green),
      blue: Math.round(blue),
    },

    hsl: {
      hue: Number.isFinite(rawHue) ? Math.round(rawHue) : 0,

      saturation: Math.round(rawSaturation * 100),

      lightness: Math.round(rawLightness * 100),
    },
  };
}

function ColorEditor({ color, colorIndex, onChange, onClose }) {
  const initialValues = getColorValues(color);

  const [hexValue, setHexValue] = useState(initialValues.hex);

  const [rgbValues, setRgbValues] = useState(initialValues.rgb);

  const [hslValues, setHslValues] = useState(initialValues.hsl);

  const [copied, setCopied] = useState(false);

  const [hexError, setHexError] = useState(false);

  useEffect(() => {
    const updatedValues = getColorValues(color);

    setHexValue(updatedValues.hex);
    setRgbValues(updatedValues.rgb);
    setHslValues(updatedValues.hsl);
    setHexError(false);
  }, [color]);

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [onClose]);

  const updateParentColor = (newColor) => {
    const normalizedColor = chroma(newColor).hex().toUpperCase();

    onChange(colorIndex, normalizedColor);
  };

  const handleHexChange = (event) => {
    const inputValue = event.target.value.toUpperCase();

    setHexValue(inputValue);

    const normalizedInput = inputValue.startsWith("#")
      ? inputValue
      : `#${inputValue}`;

    const validHexPattern = /^#[0-9A-F]{6}$/;

    if (validHexPattern.test(normalizedInput)) {
      setHexError(false);

      updateParentColor(normalizedInput);
    } else {
      setHexError(true);
    }
  };

  const resetInvalidHex = () => {
    if (hexError) {
      setHexValue(chroma(color).hex().toUpperCase());

      setHexError(false);
    }
  };

  const handleRgbChange = (channel, inputValue) => {
    const numericValue = Number(inputValue);

    const updatedRgbValues = {
      ...rgbValues,

      [channel]: clamp(
        Number.isFinite(numericValue) ? numericValue : 0,
        0,
        255,
      ),
    };

    setRgbValues(updatedRgbValues);

    updateParentColor(
      chroma(
        updatedRgbValues.red,
        updatedRgbValues.green,
        updatedRgbValues.blue,
      ),
    );
  };

  const handleHslChange = (channel, inputValue) => {
    const numericValue = Number(inputValue);

    const maximumValue = channel === "hue" ? 360 : 100;

    const updatedHslValues = {
      ...hslValues,

      [channel]: clamp(
        Number.isFinite(numericValue) ? numericValue : 0,
        0,
        maximumValue,
      ),
    };

    setHslValues(updatedHslValues);

    updateParentColor(
      chroma.hsl(
        updatedHslValues.hue,
        updatedHslValues.saturation / 100,
        updatedHslValues.lightness / 100,
      ),
    );
  };

  const copyCurrentColor = async () => {
    try {
      await navigator.clipboard.writeText(chroma(color).hex().toUpperCase());

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch {
      setCopied(false);
    }
  };

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="color-editor-overlay" onMouseDown={handleOverlayMouseDown}>
      <aside
        className="color-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-editor-title"
      >
        <div className="color-editor__header">
          <div>
            <span className="color-editor__kicker">
              Color {String(colorIndex + 1).padStart(2, "0")}
            </span>

            <h2 id="color-editor-title">Edit color</h2>
          </div>

          <button
            type="button"
            className="color-editor__close"
            onClick={onClose}
            aria-label="Close color editor"
          >
            <X size={19} />
          </button>
        </div>

        <div
          className="color-editor__preview"
          style={{
            backgroundColor: color,
          }}
        >
          <span>
            <SlidersHorizontal size={17} />
            Live preview
          </span>
        </div>

        <section className="editor-section">
          <div className="editor-section__heading">
            <div>
              <h3>HEX</h3>

              <p>Six-digit hexadecimal value</p>
            </div>

            <button type="button" onClick={copyCurrentColor}>
              {copied ? <Check size={15} /> : <Copy size={15} />}

              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className={`hex-editor ${hexError ? "hex-editor--error" : ""}`}>
            <span
              style={{
                backgroundColor: color,
              }}
            />

            <input
              type="text"
              value={hexValue}
              onChange={handleHexChange}
              onBlur={resetInvalidHex}
              maxLength={7}
              spellCheck="false"
              aria-label="HEX color value"
            />
          </div>

          {hexError && (
            <p className="editor-error">
              Enter a complete value such as #5B5CE2.
            </p>
          )}
        </section>

        <section className="editor-section">
          <div className="editor-section__heading">
            <div>
              <h3>RGB</h3>

              <p>Red, green and blue channels</p>
            </div>
          </div>

          <div className="channel-grid">
            <label>
              <span>R</span>

              <input
                type="number"
                min="0"
                max="255"
                value={rgbValues.red}
                onChange={(event) => handleRgbChange("red", event.target.value)}
              />
            </label>

            <label>
              <span>G</span>

              <input
                type="number"
                min="0"
                max="255"
                value={rgbValues.green}
                onChange={(event) =>
                  handleRgbChange("green", event.target.value)
                }
              />
            </label>

            <label>
              <span>B</span>

              <input
                type="number"
                min="0"
                max="255"
                value={rgbValues.blue}
                onChange={(event) =>
                  handleRgbChange("blue", event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <section className="editor-section">
          <div className="editor-section__heading">
            <div>
              <h3>HSL</h3>

              <p>Hue, saturation and lightness</p>
            </div>
          </div>

          <div className="channel-grid">
            <label>
              <span>H</span>

              <input
                type="number"
                min="0"
                max="360"
                value={hslValues.hue}
                onChange={(event) => handleHslChange("hue", event.target.value)}
              />
            </label>

            <label>
              <span>S %</span>

              <input
                type="number"
                min="0"
                max="100"
                value={hslValues.saturation}
                onChange={(event) =>
                  handleHslChange("saturation", event.target.value)
                }
              />
            </label>

            <label>
              <span>L %</span>

              <input
                type="number"
                min="0"
                max="100"
                value={hslValues.lightness}
                onChange={(event) =>
                  handleHslChange("lightness", event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <div className="color-editor__footer">
          <p>Changes are applied instantly to the current palette.</p>

          <button type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ColorEditor;
