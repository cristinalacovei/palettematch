import React, { useRef, useState } from "react";
import { Check, ImagePlus } from "lucide-react";

import { addPalette } from "../../services/paletteStorage";
import { createPalette } from "../../services/paletteApi";
import { useAuth } from "../../auth/AuthContext";
import ImageUploadPanel from "./ImageUploadPanel";
import ExtractedPalette from "./ExtractedPalette";
import SaveExtractedPaletteForm from "./SaveExtractedPaletteForm";
import { extractPaletteFromImage } from "./imageColorExtractor";
import "./ImagePalette.css";

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
  const { authenticated } = useAuth();

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2000);
  };

  const extractColors = (image, count = colorCount) => {
    try {
      const { rgbColors, hexColors } = extractPaletteFromImage(image, count);
      setPalette(hexColors);
      setError("");
      if (onExtract) onExtract(rgbColors, hexColors);
    } catch (extractionError) {
      console.error("Could not extract colors:", extractionError);
      setPalette([]);
      setError(
        "We could not extract colors from this image. Try another file.",
      );
    }
  };

  const loadImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
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
      image.onerror = () => setError("The selected image could not be loaded.");
      image.src = event.target.result;
    };
    reader.onerror = () => setError("The selected file could not be read.");
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event) => {
    loadImage(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    loadImage(event.dataTransfer.files?.[0]);
  };

  const handleColorCountChange = (event) => {
    const newColorCount = Number(event.target.value);
    setColorCount(newColorCount);
    if (imageRef.current) extractColors(imageRef.current, newColorCount);
  };

  const copyColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      window.setTimeout(() => setCopiedColor(""), 1200);
    } catch {
      setError("Copying is not available in this browser.");
    }
  };

  const savePalette = async () => {
    const trimmedName = paletteName.trim();
    if (!trimmedName) {
      setError("Give the palette a name before saving it.");
      return;
    }
    if (palette.length === 0) {
      setError("Extract a palette before saving it.");
      return;
    }

    let savedPalette;
    try {
      const save = authenticated ? createPalette : addPalette;
      savedPalette = await save({
        name: trimmedName,
        colors: palette,
        source: "image",
        favorite: false,
        designSystem: null,
      });
    } catch (saveError) {
      console.error("Could not save extracted palette.", saveError);
      setError("Could not save palette.");
      return;
    }
    if (!savedPalette) {
      setError("The palette could not be saved.");
      return;
    }

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
          <ImagePlus size={16} aria-hidden="true" />
          Processed locally
        </div>
      </div>

      <section className="extract-workspace">
        <ImageUploadPanel
          inputRef={inputRef}
          isDragging={isDragging}
          colorCount={colorCount}
          error={error}
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
          onUpload={handleImageUpload}
          onColorCountChange={handleColorCountChange}
        />

        <div className="extract-result">
          <ExtractedPalette
            imageUrl={imageUrl}
            palette={palette}
            copiedColor={copiedColor}
            inputRef={inputRef}
            onCopyColor={copyColor}
          />
          {imageUrl && (
            <SaveExtractedPaletteForm
              paletteName={paletteName}
              onPaletteNameChange={setPaletteName}
              onSave={savePalette}
            />
          )}
        </div>
      </section>

      <div
        className={`extract-toast ${notice ? "extract-toast--visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <Check size={16} aria-hidden="true" />
        {notice}
      </div>
    </main>
  );
}

export default ImagePalette;
