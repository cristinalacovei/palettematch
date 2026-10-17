import React from "react";

function ExportFormatSelector({ formats, selectedFormat, onFormatChange }) {
  return (
    <div
      className="export-modal__formats"
      role="tablist"
      aria-label="Export format"
    >
      {Object.entries(formats).map(([formatKey, format]) => (
        <button
          className={`export-format ${
            selectedFormat === formatKey ? "export-format--active" : ""
          }`}
          type="button"
          role="tab"
          aria-selected={selectedFormat === formatKey}
          key={formatKey}
          onClick={() => onFormatChange(formatKey)}
        >
          <strong>{format.label}</strong>
          <span>{format.description}</span>
        </button>
      ))}
    </div>
  );
}

export default ExportFormatSelector;
