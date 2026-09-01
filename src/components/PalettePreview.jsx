import React from "react";
import ColorBox from "./ColorBox";
import "./PaletteGenerator.css";

function PalettePreview({
  colors,
  lockedColors = [],
  onToggleLock,
  onEditColor,
}) {
  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div
      className="palette-preview"
      style={{
        "--color-count": colors.length,
      }}
    >
      {colors.map((color, index) => (
        <ColorBox
          key={`${color}-${index}`}
          color={color}
          index={index}
          locked={Boolean(lockedColors[index])}
          onToggleLock={onToggleLock}
          onEditColor={onEditColor}
        />
      ))}
    </div>
  );
}

export default PalettePreview;
