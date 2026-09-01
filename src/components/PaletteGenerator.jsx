import React, { useState, useEffect } from "react";
import chroma from "chroma-js";
import PalettePreview from "./PalettePreview";
import { ChromePicker } from "react-color";
import "./PaletteGenerator.css";

const PALETTE_TYPES = [
  "analog",
  "complement",
  "triad",
  "tetradic",
  "monochrome",
  "split-complement",
];

const PALETTE_DESCRIPTIONS = {
  analog:
    "Colors close together on the color wheel (e.g., orange, red-orange, red).",
  complement: "Color opposite on the color wheel (e.g., blue and orange).",
  triad:
    "Three colors equidistant on the color wheel (e.g., red, yellow, blue).",
  tetradic:
    "Two pairs of complementary colors (e.g., red-green and yellow-violet).",
  monochrome: "Same color with variations in lightness and saturation.",
  "split-complement":
    "One color plus the two neighbors of its complement (e.g., red + yellow-green and blue-green).",
};

function PaletteGenerator() {
  const [baseColor, setBaseColor] = useState("#ff5733");
  const [type, setType] = useState("analog");
  const [colors, setColors] = useState([]);
  const [paletteName, setPaletteName] = useState("");
  const [savedPalettes, setSavedPalettes] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const data = localStorage.getItem("palettes");
    if (data) {
      setSavedPalettes(JSON.parse(data));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("palettes", JSON.stringify(savedPalettes));
  }, [savedPalettes]);

  const generatePalette = () => {
    let newColors = [];
    try {
      const h = chroma(baseColor).get("hsl.h");

      switch (type) {
        case "analog":
          newColors = chroma
            .scale([
              chroma(baseColor).set("hsl.h", h - 30),
              baseColor,
              chroma(baseColor).set("hsl.h", h + 30),
            ])
            .colors(3);
          break;
        case "complement":
          newColors = [
            baseColor,
            chroma(baseColor)
              .set("hsl.h", (h + 180) % 360)
              .hex(),
          ];
          break;
        case "triad":
          newColors = [
            baseColor,
            chroma(baseColor)
              .set("hsl.h", (h + 120) % 360)
              .hex(),
            chroma(baseColor)
              .set("hsl.h", (h + 240) % 360)
              .hex(),
          ];
          break;
        case "tetradic":
          newColors = [
            baseColor,
            chroma(baseColor)
              .set("hsl.h", (h + 90) % 360)
              .hex(),
            chroma(baseColor)
              .set("hsl.h", (h + 180) % 360)
              .hex(),
            chroma(baseColor)
              .set("hsl.h", (h + 270) % 360)
              .hex(),
          ];
          break;
        case "monochrome":
          newColors = chroma
            .scale([chroma(baseColor).brighten(2), chroma(baseColor).darken(2)])
            .mode("lab")
            .colors(5);
          break;
        case "split-complement":
          newColors = [
            baseColor,
            chroma(baseColor)
              .set("hsl.h", (h + 150) % 360)
              .hex(),
            chroma(baseColor)
              .set("hsl.h", (h + 210) % 360)
              .hex(),
          ];
          break;
        default:
          newColors = [baseColor];
      }

      setColors(newColors);
    } catch (err) {
      console.error("Invalid color");
      setColors([]);
    }
  };

  const saveCurrentPalette = () => {
    if (!paletteName.trim() || colors.length === 0) return;
    const newPalette = { name: paletteName.trim(), colors };
    setSavedPalettes([...savedPalettes, newPalette]);
    setPaletteName(""); // clear input
  };

  const deletePalette = (indexToDelete) => {
    const updated = savedPalettes.filter((_, index) => index !== indexToDelete);
    setSavedPalettes(updated);
  };

  return (
    <div className="palette-container">
      <h2>PaletteMatch 🎨</h2>

      <div className="color-picker-wrapper">
        <ChromePicker
          color={baseColor}
          onChange={(color) => setBaseColor(color.hex)}
          disableAlpha
        />
      </div>

      <div className="select-wrapper">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {PALETTE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <p>{PALETTE_DESCRIPTIONS[type]}</p>
      </div>

      <button className="generate-button" onClick={generatePalette}>
        Generate Palette
      </button>

      {colors.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Palette name"
            value={paletteName}
            onChange={(e) => setPaletteName(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "1rem",
              marginRight: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              outline: "none",
              width: "200px",
            }}
          />
          <button
            className="generate-button"
            onClick={saveCurrentPalette}
            style={{ backgroundColor: "#2ecc71" }}
          >
            💾 Save Palette
          </button>
        </div>
      )}

      <PalettePreview colors={colors} />
    </div>
  );
}

export default PaletteGenerator;
