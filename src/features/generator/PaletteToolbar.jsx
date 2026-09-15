import React from "react";
import { Copy, Unlock } from "lucide-react";

function PaletteToolbar({
  paletteTypeLabel,
  lockedCount,
  onUnlockAll,
  onCopyPalette,
}) {
  return (
    <div className="palette-toolbar">
      <div>
        <span className="palette-toolbar__label">Generated palette</span>
        <strong>{paletteTypeLabel}</strong>
      </div>

      <div className="palette-toolbar__actions">
        {lockedCount > 0 && (
          <button type="button" onClick={onUnlockAll}>
            <Unlock size={16} aria-hidden="true" />
            Unlock all
          </button>
        )}

        <button type="button" onClick={onCopyPalette}>
          <Copy size={16} aria-hidden="true" />
          Copy values
        </button>
      </div>
    </div>
  );
}

export default PaletteToolbar;
