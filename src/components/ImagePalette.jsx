import React, { useRef, useState } from "react";
import ColorThief from "colorthief";
import "./ImagePalette.css";

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function ImagePalette({ onExtract }) {
  const imgRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [palette, setPalette] = useState([]);
  const [hexPalette, setHexPalette] = useState([]);
  const [paletteName, setPaletteName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        extractColors(img);
        setImageUrl(event.target.result);
      };
      img.src = event.target.result;
    };

    if (file) reader.readAsDataURL(file);
  };

  const extractColors = (image) => {
    const colorThief = new ColorThief();
    try {
      const colors = colorThief.getPalette(image, 5);
      const hex = colors.map(([r, g, b]) => rgbToHex(r, g, b));
      setPalette(colors);
      setHexPalette(hex);
      setPaletteName("");
      if (onExtract) onExtract(colors, hex);
    } catch (err) {
      console.error("Eroare la extragerea paletei:", err);
    }
  };

  const savePalette = () => {
    if (!paletteName.trim()) return;
    const savedPalettes = JSON.parse(localStorage.getItem("palettes") || "[]");
    savedPalettes.push({ name: paletteName, colors: hexPalette });
    localStorage.setItem("palettes", JSON.stringify(savedPalettes));
    setPaletteName("");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="palette-box">
      <h2 className="palette-title">🎨 Extractor de Paletă de Culori</h2>
      <p className="palette-description">
        Încarcă o imagine, extrage automat cele mai dominante culori și salvează
        paleta ta preferată.
      </p>

      <label htmlFor="image-upload" className="palette-upload-label">
        📁 Încarcă imagine
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {imageUrl && (
        <>
          <img src={imageUrl} alt="Uploaded" className="palette-image" />
          <h4 style={{ marginTop: "30px" }}>Culori extrase:</h4>
          <div className="palette-grid">
            {palette.map((color, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  className="palette-color"
                  style={{ backgroundColor: `rgb(${color.join(",")})` }}
                />
                <div className="palette-hex">{rgbToHex(...color)}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "30px" }}>
            <input
              type="text"
              placeholder="Nume paletă"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              className="palette-input"
            />
            <button
              onClick={savePalette}
              disabled={!paletteName.trim()}
              className="palette-save-btn"
            >
              💾 Salvează paleta
            </button>
          </div>

          {showSuccess && (
            <div className="palette-success">
              ✅ Paleta a fost salvată cu succes!
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ImagePalette;
