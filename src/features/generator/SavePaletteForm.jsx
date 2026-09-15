import React from "react";
import { Save } from "lucide-react";

function SavePaletteForm({ name, inputRef, onNameChange, onSave }) {
  return (
    <div className="save-bar">
      <div>
        <label htmlFor="palette-name">Save this direction</label>
        <span>Give it a name you will recognize later.</span>
      </div>

      <div className="save-bar__form">
        <input
          id="palette-name"
          ref={inputRef}
          type="text"
          placeholder="e.g. Midnight product"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
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

export default SavePaletteForm;
