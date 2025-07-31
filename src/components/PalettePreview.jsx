// PalettePreview.jsx
import React from "react";
import ColorBox from "./ColorBox";
import "./PaletteGenerator.css";

function PalettePreview({ colors }) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="palette-preview">
      {colors.map((color, index) => (
        <ColorBox key={index} color={color} />
      ))}
    </div>
  );
}

export default PalettePreview;
