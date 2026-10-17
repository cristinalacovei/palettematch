import React from "react";
import { ChevronDown, Upload } from "lucide-react";

function ImageUploadPanel({
  inputRef,
  isDragging,
  colorCount,
  error,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onUpload,
  onColorCountChange,
}) {
  return (
    <div className="extract-controls">
      <div className="extract-controls__header">
        <span>Source image</span>
        <span>01</span>
      </div>

      <label
        className={`upload-zone ${isDragging ? "upload-zone--dragging" : ""}`}
        htmlFor="image-upload"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="upload-zone__icon">
          <Upload size={22} aria-hidden="true" />
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
        onChange={onUpload}
        hidden
      />

      <div className="extract-field">
        <label htmlFor="color-count">Number of colors</label>
        <div className="extract-select">
          <select
            id="color-count"
            value={colorCount}
            onChange={onColorCountChange}
          >
            <option value={3}>3 colors</option>
            <option value={5}>5 colors</option>
            <option value={7}>7 colors</option>
            <option value={10}>10 colors</option>
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
        <p>You can change this after uploading the image.</p>
      </div>

      {error && (
        <div className="extract-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default ImageUploadPanel;
