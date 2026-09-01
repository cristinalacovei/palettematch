import React, { useRef, useState } from "react";
import ColorThief from "colorthief";
import {
  Check,
  ChevronDown,
  Copy,
  ImagePlus,
  Save,
  Upload,
} from "lucide-react";
import "./ImagePalette.css";

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function generateId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now());
}

function ImagePalette({ onExtract }) {
  const imageRef = useRef(null);
  const inputRef = useRef(null);

  const [imageUrl, setImageUrl] = useState("");
  const [palette, setPalette] = useState([]);
  const [paletteName, setPaletteName] = useState("");
  const [colorCount, setColorCount] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedColor, setCopiedColor] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const showNotice = (message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2000);
  };

  const extractColors = (image, count = colorCount) => {
    const colorThief = new ColorThief();

    try {
      const extractedColors = colorThief.getPalette(image, count);

      if (!extractedColors || extractedColors.length === 0) {
        throw new Error("No colors could be extracted.");
      }

      const hexColors = extractedColors.map(([red, green, blue]) =>
        rgbToHex(red, green, blue),
      );

      setPalette(hexColors);
      setError("");

      if (onExtract) {
        onExtract(extractedColors, hexColors);
      }
    } catch (extractionError) {
      console.error("Could not extract colors:", extractionError);

      setPalette([]);
      setError(
        "We could not extract colors from this image. Try another file.",
      );
    }
  };

  const loadImage = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    const maximumFileSize = 10 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setError("The image must be smaller than 10 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        imageRef.current = image;

        setImageUrl(event.target.result);
        setPaletteName("");
        setError("");

        extractColors(image);
      };

      image.onerror = () => {
        setError("The selected image could not be loaded.");
      };

      image.src = event.target.result;
    };

    reader.onerror = () => {
      setError("The selected file could not be read.");
    };

    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    loadImage(file);

    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    loadImage(file);
  };

  const handleColorCountChange = (event) => {
    const newColorCount = Number(event.target.value);

    setColorCount(newColorCount);

    if (imageRef.current) {
      extractColors(imageRef.current, newColorCount);
    }
  };

  const copyColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color);

      setCopiedColor(color);

      window.setTimeout(() => {
        setCopiedColor("");
      }, 1200);
    } catch {
      setError("Copying is not available in this browser.");
    }
  };

  const savePalette = () => {
    if (!paletteName.trim()) {
      setError("Give the palette a name before saving it.");
      return;
    }

    if (palette.length === 0) {
      setError("Extract a palette before saving it.");
      return;
    }

    let savedPalettes = [];

    try {
      savedPalettes = JSON.parse(localStorage.getItem("palettes") || "[]");
    } catch {
      savedPalettes = [];
    }

    const newPalette = {
      id: generateId(),
      name: paletteName.trim(),
      colors: palette,
      source: "image",
      favorite: false,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "palettes",
      JSON.stringify([...savedPalettes, newPalette]),
    );

    setPaletteName("");
    setError("");
    showNotice("Palette saved to your library");
  };

  return (
    <main className="extract-page">
      <div className="extract-heading">
        <div>
          <span className="extract-kicker">Image extractor</span>

          <h1>Find the colors inside an image</h1>

          <p>
            Upload a visual reference and turn its dominant colors into a
            reusable palette.
          </p>
        </div>

        <div className="extract-heading__badge">
          <ImagePlus size={16} />
          Processed locally
        </div>
      </div>

      <section className="extract-workspace">
        <div className="extract-controls">
          <div className="extract-controls__header">
            <span>Source image</span>
            <span>01</span>
          </div>

          <label
            className={`upload-zone ${
              isDragging ? "upload-zone--dragging" : ""
            }`}
            htmlFor="image-upload"
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <span className="upload-zone__icon">
              <Upload size={22} />
            </span>

            <strong>Choose an image</strong>

            <span>or drag and drop it here</span>

            <small>PNG, JPG or WEBP · maximum 10 MB</small>
          </label>

          <input
            ref={inputRef}
            id="image-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            hidden
          />

          <div className="extract-field">
            <label htmlFor="color-count">Number of colors</label>

            <div className="extract-select">
              <select
                id="color-count"
                value={colorCount}
                onChange={handleColorCountChange}
              >
                <option value={3}>3 colors</option>
                <option value={5}>5 colors</option>
                <option value={7}>7 colors</option>
                <option value={10}>10 colors</option>
              </select>

              <ChevronDown size={16} />
            </div>

            <p>You can change this after uploading the image.</p>
          </div>

          {error && (
            <div className="extract-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="extract-result">
          {!imageUrl ? (
            <div className="extract-empty">
              <span className="extract-empty__icon">
                <ImagePlus size={28} />
              </span>

              <h2>Your extracted palette will appear here</h2>

              <p>Choose an image to see its dominant colors.</p>

              <button type="button" onClick={() => inputRef.current?.click()}>
                <Upload size={17} />
                Upload image
              </button>
            </div>
          ) : (
            <>
              <div className="extract-preview">
                <img src={imageUrl} alt="Uploaded visual reference" />
              </div>

              <div className="extracted-palette-header">
                <div>
                  <span>Extracted palette</span>
                  <strong>{palette.length} colors found</strong>
                </div>

                <span>Click a color to copy it</span>
              </div>

              <div
                className="extracted-colors"
                style={{ "--extracted-count": palette.length }}
              >
                {palette.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    type="button"
                    className="extracted-color"
                    onClick={() => copyColor(color)}
                    aria-label={`Copy color ${color}`}
                  >
                    <span
                      className="extracted-color__tone"
                      style={{ backgroundColor: color }}
                    >
                      <span className="extracted-color__copy">
                        {copiedColor === color ? (
                          <Check size={15} />
                        ) : (
                          <Copy size={15} />
                        )}

                        {copiedColor === color ? "Copied" : "Copy"}
                      </span>
                    </span>

                    <span className="extracted-color__value">
                      <small>Color {String(index + 1).padStart(2, "0")}</small>

                      <code>{color}</code>
                    </span>
                  </button>
                ))}
              </div>

              <div className="extract-save">
                <div>
                  <label htmlFor="extracted-palette-name">
                    Save this palette
                  </label>

                  <span>It will appear in your PaletteMatch library.</span>
                </div>

                <div className="extract-save__form">
                  <input
                    id="extracted-palette-name"
                    type="text"
                    placeholder="e.g. Coastal campaign"
                    value={paletteName}
                    onChange={(event) => setPaletteName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        savePalette();
                      }
                    }}
                  />

                  <button type="button" onClick={savePalette}>
                    <Save size={16} />
                    Save palette
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <div
        className={`extract-toast ${notice ? "extract-toast--visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <Check size={16} />
        {notice}
      </div>
    </main>
  );
}

export default ImagePalette;
