import React from "react";

function AccessibilityPreview({ foreground, background }) {
  return (
    <>
      <div className="accessibility-preview-heading">
        <div>
          <span>Live preview</span>
          <h2>See the combination in context</h2>
        </div>
        <div className="accessibility-preview-heading__colors">
          <span>{foreground}</span>
          <span>{background}</span>
        </div>
      </div>

      <div
        className="accessibility-preview"
        style={{ color: foreground, backgroundColor: background }}
      >
        <span className="accessibility-preview__label">
          Product design toolkit
        </span>
        <h3>Create accessible experiences.</h3>
        <p>
          Good contrast makes content easier to read and helps more people use
          your product comfortably.
        </p>
        <button
          type="button"
          style={{
            color: background,
            backgroundColor: foreground,
            borderColor: foreground,
          }}
        >
          Explore the palette
        </button>
        <small>
          This smaller text demonstrates how the combination behaves in
          supporting content.
        </small>
      </div>
    </>
  );
}

export default AccessibilityPreview;
