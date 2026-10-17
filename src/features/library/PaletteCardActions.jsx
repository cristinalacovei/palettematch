import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  LayoutDashboard,
  MoreHorizontal,
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
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const runMenuAction = (action) => {
    setMenuOpen(false);
    action();
  };

  return (
    <div
      className="library-card__actions"
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" onClick={() => onEdit(palette)}>
        <Pencil size={16} aria-hidden="true" />
        Edit palette
      </button>

      <button type="button" onClick={() => onPreview(palette)}>
        <LayoutDashboard size={16} aria-hidden="true" />
        Preview
      </button>

      <button type="button" onClick={() => onAccessibility(palette)}>
        <ShieldCheck size={16} aria-hidden="true" />
        Accessibility
      </button>

      <div className="library-card__more" ref={menuRef}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`More actions for ${palette.name}`}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <MoreHorizontal size={17} aria-hidden="true" />
          More actions
        </button>

        {menuOpen && (
          <div
            className="library-card__more-menu"
            role="menu"
            aria-label={`Actions for ${palette.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                runMenuAction(() => onCopyPalette(palette))
              }
            >
              {copiedValue === palette.id ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              Copy
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(() => onExport(palette))}
            >
              <Download size={16} aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(() => onRename(palette))}
            >
              <Pencil size={16} aria-hidden="true" />
              Rename
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(() => onDuplicate(palette))}
            >
              <Copy size={16} aria-hidden="true" />
              Duplicate
            </button>
            <button
              type="button"
              role="menuitem"
              className="delete-button"
              onClick={() => runMenuAction(() => onDelete(palette.id))}
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaletteCardActions;
