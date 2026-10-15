import React, { useState } from "react";
import { Save, X } from "lucide-react";
import ColorEditor from "../generator/ColorEditor";
import "./EditPalettePanel.css";

function EditPalettePanel({ palette, onClose, onSave }) {
  const [colors, setColors] = useState(() => [...palette.colors]);
  const [editingColorIndex, setEditingColorIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = colors.some(
    (color, index) => color !== palette.colors[index],
  );

  const requestClose = () => {
    if (
      hasChanges &&
      !window.confirm("Discard your unsaved color changes?")
    ) {
      return;
    }
    onClose();
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await onSave(palette, colors);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className="edit-palette-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            requestClose();
          }
        }}
      >
        <aside
          className="edit-palette-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-palette-title"
        >
          <header className="edit-palette-panel__header">
            <div>
              <span className="library-kicker">Palette library</span>
              <h2 id="edit-palette-title">Edit {palette.name}</h2>
              <p>Select a color to edit it. Changes stay local until saved.</p>
            </div>
            <button
              type="button"
              className="edit-palette-panel__close"
              onClick={requestClose}
              aria-label="Close palette editor"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </header>

          <div className="edit-palette-panel__colors">
            {colors.map((color, index) => (
              <button
                key={`${palette.id}-${index}`}
                type="button"
                className="edit-palette-panel__color"
                onClick={() => setEditingColorIndex(index)}
                aria-label={`Edit color ${color}`}
              >
                <span style={{ backgroundColor: color }} />
                <code>{color}</code>
                <small>Color {index + 1}</small>
              </button>
            ))}
          </div>

          <footer className="edit-palette-panel__footer">
            <button
              type="button"
              className="edit-palette-panel__cancel"
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="edit-palette-panel__save"
              onClick={saveChanges}
              disabled={!hasChanges || isSaving}
            >
              <Save size={16} aria-hidden="true" />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </footer>
        </aside>
      </div>

      {editingColorIndex !== null && (
        <ColorEditor
          color={colors[editingColorIndex]}
          colorIndex={editingColorIndex}
          onChange={(_, nextColor) =>
            setColors((currentColors) =>
              currentColors.map((color, index) =>
                index === editingColorIndex ? nextColor : color,
              ),
            )
          }
          onClose={() => setEditingColorIndex(null)}
        />
      )}
    </>
  );
}

export default EditPalettePanel;
