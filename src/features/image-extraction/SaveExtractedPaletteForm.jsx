import React from "react";
import { Save } from "lucide-react";

function SaveExtractedPaletteForm({
  paletteName,
  onPaletteNameChange,
  onSave,
}) {
  return (
    <div className="extract-save">
      <div>
        <label htmlFor="extracted-palette-name">Save this palette</label>
        <span>It will appear in your PaletteMatch library.</span>
      </div>

      <div className="extract-save__form">
        <input
          id="extracted-palette-name"
          type="text"
          placeholder="e.g. Coastal campaign"
          value={paletteName}
          onChange={(event) => onPaletteNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSave();
            }
          }}
        />
        <button type="button" onClick={onSave}>
          <Save size={16} aria-hidden="true" />
          Save palette
        </button>
      </div>
    </div>
  );
}

export default SaveExtractedPaletteForm;
