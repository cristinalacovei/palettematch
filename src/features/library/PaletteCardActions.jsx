import React from "react";
import {
  Check,
  Copy,
  Download,
  LayoutDashboard,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";

function PaletteCardActions({
  palette,
  copiedValue,
  onCopyPalette,
  onExport,
  onPreview,
  onAccessibility,
  onRename,
  onDuplicate,
  onDelete,
}) {
  return (
    <div className="library-card__actions">
      <button type="button" onClick={() => onCopyPalette(palette)}>
        {copiedValue === palette.id ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
        Copy
      </button>

      <button type="button" onClick={() => onExport(palette)}>
        <Download size={16} aria-hidden="true" />
        Export
      </button>

      <button type="button" onClick={() => onPreview(palette)}>
        <LayoutDashboard size={16} aria-hidden="true" />
        Preview UI
      </button>

      <button type="button" onClick={() => onAccessibility(palette)}>
        <ShieldCheck size={16} aria-hidden="true" />
        Check contrast
      </button>

      <button type="button" onClick={() => onRename(palette)}>
        <Pencil size={16} aria-hidden="true" />
        Rename
      </button>

      <button type="button" onClick={() => onDuplicate(palette)}>
        <Copy size={16} aria-hidden="true" />
        Duplicate
      </button>

      <button
        type="button"
        className="delete-button"
        onClick={() => onDelete(palette.id)}
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}

export default PaletteCardActions;
