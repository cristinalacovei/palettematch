import React from "react";
import { Check, Copy, Heart, X } from "lucide-react";

import PaletteCardActions from "./PaletteCardActions";

function PaletteCard({
  palette,
  editing,
  editingName,
  copiedValue,
  onCopyColor,
  onToggleFavorite,
  onNameChange,
  onSaveName,
  onCancelRename,
  onStartRename,
  onCopyPalette,
  onExport,
  onPreview,
  onAccessibility,
  onDuplicate,
  onDelete,
}) {
  return (
    <article className="library-card">
      <div
        className="library-swatches"
        style={{ "--library-color-count": palette.colors.length }}
      >
        {palette.colors.map((color, index) => (
          <button
            type="button"
            className="library-swatch"
            key={`${palette.id}-${color}-${index}`}
            style={{ backgroundColor: color }}
            onClick={() => onCopyColor(color)}
            aria-label={`Copy color ${color}`}
            title={`Copy ${color}`}
          >
            <span>
              {copiedValue === color ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Copy size={15} aria-hidden="true" />
              )}
              {color}
            </span>
          </button>
        ))}
      </div>

      <div className="library-card__content">
        <div className="library-card__top">
          <div className="library-card__identity">
            {editing ? (
              <div className="library-rename">
                <input
                  type="text"
                  value={editingName}
                  autoFocus
                  onChange={(event) => onNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSaveName(palette.id);
                    }

                    if (event.key === "Escape") {
                      onCancelRename();
                    }
                  }}
                  aria-label="New palette name"
                />

                <button
                  type="button"
                  onClick={() => onSaveName(palette.id)}
                  aria-label="Save new name"
                >
                  <Check size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onCancelRename}
                  aria-label="Cancel renaming"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <h2>{palette.name}</h2>

                <div className="library-card__metadata">
                  <span>
                    {palette.source === "image" ? "Extracted" : "Generated"}
                  </span>
                  <span>·</span>
                  <span>{palette.colors.length} colors</span>
                  <span>·</span>
                  <span>{palette.formattedDate}</span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className={`favorite-button ${
              palette.favorite ? "favorite-button--active" : ""
            }`}
            onClick={() => onToggleFavorite(palette.id)}
            aria-label={
              palette.favorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
            title={
              palette.favorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <Heart
              size={18}
              fill={palette.favorite ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        </div>

        <PaletteCardActions
          palette={palette}
          copiedValue={copiedValue}
          onCopyPalette={onCopyPalette}
          onExport={onExport}
          onPreview={onPreview}
          onAccessibility={onAccessibility}
          onRename={onStartRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

export default PaletteCard;
