import React from "react";

function ImportedPaletteSelector({
  palette,
  activeRole,
  foreground,
  background,
  onRoleChange,
  onColorSelect,
}) {
  return (
    <div className="accessibility-imported">
      <div className="accessibility-imported__heading">
        <span>Imported palette</span>
        <strong>{palette.name}</strong>
      </div>

      <p>Choose a role, then select one of the palette colors.</p>

      <div className="accessibility-role-selector" aria-label="Color role">
        <button
          type="button"
          className={
            activeRole === "foreground"
              ? "accessibility-role-selector__button accessibility-role-selector__button--active"
              : "accessibility-role-selector__button"
          }
          onClick={() => onRoleChange("foreground")}
        >
          Text
        </button>

        <button
          type="button"
          className={
            activeRole === "background"
              ? "accessibility-role-selector__button accessibility-role-selector__button--active"
              : "accessibility-role-selector__button"
          }
          onClick={() => onRoleChange("background")}
        >
          Background
        </button>
      </div>

      <div className="accessibility-imported__swatches">
        {palette.colors.map((color, index) => {
          const isForeground = foreground === color;
          const isBackground = background === color;
          const roleLabel = activeRole === "foreground" ? "text" : "background";

          return (
            <button
              type="button"
              className={`accessibility-imported__swatch ${
                isForeground || isBackground
                  ? "accessibility-imported__swatch--selected"
                  : ""
              }`}
              key={`${color}-${index}`}
              onClick={() => onColorSelect(color)}
              title={`Use ${color} as ${roleLabel}`}
              aria-label={`Use ${color} as ${roleLabel} color`}
            >
              <span style={{ backgroundColor: color }} />
              <small>{color}</small>
              {(isForeground || isBackground) && (
                <em>
                  {isForeground && isBackground
                    ? "Both"
                    : isForeground
                      ? "Text"
                      : "Background"}
                </em>
              )}
            </button>
          );
        })}
      </div>

      <small className="accessibility-imported__note">
        The pair with the highest contrast was selected automatically.
      </small>
    </div>
  );
}

export default ImportedPaletteSelector;
