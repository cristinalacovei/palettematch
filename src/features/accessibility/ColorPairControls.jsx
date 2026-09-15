import React from "react";
import { ArrowLeftRight } from "lucide-react";

function ColorPairControls({
  foreground,
  background,
  foregroundInput,
  backgroundInput,
  foregroundHasError,
  backgroundHasError,
  onTextColorChange,
  onPickerColorChange,
  onInputFocus,
  onInputBlur,
  onSwap,
}) {
  return (
    <>
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
              onPickerColorChange("foreground", event.target.value)
            }
            aria-label="Choose text color"
          />
          <input
            id="foreground-color"
            className="accessibility-color-input__text"
            type="text"
            value={foregroundInput}
            onFocus={() => onInputFocus("foreground")}
            onChange={(event) =>
              onTextColorChange("foreground", event.target.value)
            }
            onBlur={() => onInputBlur("foreground")}
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
        onClick={onSwap}
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
              onPickerColorChange("background", event.target.value)
            }
            aria-label="Choose background color"
          />
          <input
            id="background-color"
            className="accessibility-color-input__text"
            type="text"
            value={backgroundInput}
            onFocus={() => onInputFocus("background")}
            onChange={(event) =>
              onTextColorChange("background", event.target.value)
            }
            onBlur={() => onInputBlur("background")}
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
    </>
  );
}

export default ColorPairControls;
