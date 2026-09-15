import React from "react";
import { Check, X } from "lucide-react";

function ContrastResults({ results, passedChecks }) {
  return (
    <div className="accessibility-checks">
      <div className="accessibility-checks__heading">
        <div>
          <span>WCAG results</span>
          <h2>Contrast requirements</h2>
        </div>
        <strong>
          {passedChecks}/{results.length} passed
        </strong>
      </div>

      <div className="accessibility-checks__list">
        {results.map((result, index) => (
          <article
            className={`accessibility-result ${
              result.passed
                ? "accessibility-result--passed"
                : "accessibility-result--failed"
            }`}
            key={`${result.title}-${result.standard}-${index}`}
          >
            <div className="accessibility-result__icon">
              {result.passed ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <X size={18} aria-hidden="true" />
              )}
            </div>
            <div className="accessibility-result__content">
              <strong>{result.title}</strong>
              <span>{result.description}</span>
            </div>
            <div className="accessibility-result__requirement">
              <strong>{result.standard}</strong>
              <span>Minimum {result.threshold}</span>
            </div>
            <span className="accessibility-result__status">
              {result.passed ? "Pass" : "Fail"}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ContrastResults;
