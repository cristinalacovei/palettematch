import React from "react";
import { Check, Copy, ImagePlus, Upload } from "lucide-react";

function ExtractedPalette({
  imageUrl,
  palette,
  copiedColor,
  inputRef,
  onCopyColor,
}) {
  if (!imageUrl) {
    return (
      <div className="extract-empty">
        <span className="extract-empty__icon">
          <ImagePlus size={28} aria-hidden="true" />
        </span>
        <h2>Your extracted palette will appear here</h2>
        <p>Choose an image to see its dominant colors.</p>
        <button type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={17} aria-hidden="true" />
          Upload image
        </button>
      </div>
    );
  }

  return (
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
            onClick={() => onCopyColor(color)}
            aria-label={`Copy color ${color}`}
          >
            <span
              className="extracted-color__tone"
              style={{ backgroundColor: color }}
            >
              <span className="extracted-color__copy">
                {copiedColor === color ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
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
    </>
  );
}

export default ExtractedPalette;
