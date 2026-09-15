import React, { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { ChromePicker } from "react-color";

import {
  PALETTE_DESCRIPTIONS,
  PALETTE_TYPES,
} from "../../domain/palette/paletteConstants";

function GeneratorControls({
  baseColor,
  type,
  onBaseColorChange,
  onTypeChange,
  onGenerate,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
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
            style={{ backgroundColor: baseColor }}
          />

          <code>{baseColor.toUpperCase()}</code>

          <ChevronDown size={16} aria-hidden="true" />
        </button>

        {pickerOpen && (
          <div className="picker-popover">
            <ChromePicker
              color={baseColor}
              onChange={(color) => onBaseColorChange(color.hex.toUpperCase())}
              disableAlpha
            />
          </div>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="harmony">Color harmony</label>

        <div className="select-control">
          <select id="harmony" value={type} onChange={onTypeChange}>
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

      <button className="generate-button" type="button" onClick={onGenerate}>
        <RefreshCw size={17} aria-hidden="true" />
        Generate palette
      </button>

      <p className="control-note">
        Lock a color to preserve it or use Edit to change its HEX, RGB and HSL
        values.
      </p>
    </aside>
  );
}

export default GeneratorControls;
