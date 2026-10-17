import React from "react";
import { AlertTriangle, Check } from "lucide-react";

function PreviewAccessibilitySummary({ checks, passedChecks }) {
  return (
    <section className="ui-preview-accessibility">
      <div className="ui-preview-accessibility__heading">
        <div>
          <span>Automatic analysis</span>
          <h2>Important color combinations</h2>
        </div>
        <strong>
          {passedChecks}/{checks.length} passed
        </strong>
      </div>

      <div className="ui-preview-check-list">
        {checks.map((check) => (
          <article
            className={
              check.passed
                ? "ui-preview-check ui-preview-check--passed"
                : "ui-preview-check ui-preview-check--failed"
            }
            key={check.label}
          >
            <span className="ui-preview-check__icon">
              {check.passed ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} aria-hidden="true" />
              )}
            </span>
            <div>
              <strong>{check.label}</strong>
              <span>Minimum {check.threshold}:1</span>
            </div>
            <strong>{check.ratio.toFixed(2)}:1</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PreviewAccessibilitySummary;
