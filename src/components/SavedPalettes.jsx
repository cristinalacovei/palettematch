// SavedPalettes.jsx
import React, { useEffect, useState } from "react";
import PalettePreview from "./PalettePreview";

function SavedPalettes() {
  const [savedPalettes, setSavedPalettes] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("palettes");
    if (data) {
      setSavedPalettes(JSON.parse(data));
    }
  }, []);

  const deletePalette = (indexToDelete) => {
    const updated = savedPalettes.filter((_, index) => index !== indexToDelete);
    setSavedPalettes(updated);
    localStorage.setItem("palettes", JSON.stringify(updated));
  };

  return (
    <div className="palette-container">
      <h2>Paletele mele salvate 🎨</h2>
      {savedPalettes.length === 0 ? (
        <p>Nu ai salvat încă nicio paletă.</p>
      ) : (
        savedPalettes.map((palette, index) => (
          <div key={index} style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>{palette.name}</h4>
            <PalettePreview colors={palette.colors} />
            <button
              onClick={() => deletePalette(index)}
              style={{
                marginTop: "10px",
                backgroundColor: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              🗑️ Șterge paleta
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default SavedPalettes;
