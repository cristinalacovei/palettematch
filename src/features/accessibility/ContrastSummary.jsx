import React from "react";

function ContrastSummary({ roundedRatio, passedChecks, totalChecks, status }) {
  return (
    <>
      <div className="accessibility-ratio" aria-live="polite">
        <span>Contrast ratio</span>
        <strong>{roundedRatio}:1</strong>
        <small>
          {passedChecks} of {totalChecks} checks passed
        </small>
      </div>

      <div
        className={`accessibility-summary accessibility-summary--${status.tone}`}
      >
        <strong>{status.label}</strong>
        <p>{status.message}</p>
      </div>
    </>
  );
}

export default ContrastSummary;
