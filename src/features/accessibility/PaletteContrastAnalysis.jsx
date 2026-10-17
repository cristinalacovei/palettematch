import React from "react";
import { Check, X } from "lucide-react";
import { getPaletteContrastPairs } from "../../domain/accessibility/accessibilityEngine";

function PaletteContrastAnalysis({ palette }) {
  const pairs = getPaletteContrastPairs(palette.colors);
  const failedPairCount = pairs.filter((pair) =>
    pair.checks.some((check) => !check.passed),
  ).length;

  return (
    <section
      className="palette-contrast-analysis"
      aria-labelledby="palette-contrast-title"
    >
      <header className="palette-contrast-analysis__header">
        <div>
          <span className="accessibility-page__eyebrow">Full palette</span>
          <h2 id="palette-contrast-title">
            WCAG contrast for {palette.name}
          </h2>
          <p>
            Each unique color pair is checked for normal and large text at WCAG
            AA and AAA.
          </p>
        </div>
        <strong>
          {failedPairCount} of {pairs.length} pairs have a failing check
        </strong>
      </header>

      {(palette.invalidColorCount > 0 || palette.missingColorCount > 0) && (
        <p className="palette-contrast-analysis__notice" role="status">
          {palette.invalidColorCount > 0 &&
            `${palette.invalidColorCount} invalid ${
              palette.invalidColorCount === 1 ? "color was" : "colors were"
            } skipped. `}
          {palette.missingColorCount > 0 &&
            `${palette.missingColorCount} ${
              palette.missingColorCount === 1 ? "color is" : "colors are"
            } missing from the expected five.`}{" "}
          Valid HEX colors are required for contrast analysis.
        </p>
      )}

      {pairs.length === 0 ? (
        <p className="palette-contrast-analysis__notice" role="status">
          This palette does not contain two valid, distinct HEX colors to
          compare.
        </p>
      ) : (
        <div className="palette-contrast-analysis__pairs">
          {pairs.map((pair) => {
            const hasFailure = pair.checks.some((check) => !check.passed);
            return (
              <article
                key={`${pair.foreground}-${pair.background}`}
                className={`palette-contrast-pair ${
                  hasFailure
                    ? "palette-contrast-pair--failed"
                    : "palette-contrast-pair--passed"
                }`}
              >
                <div className="palette-contrast-pair__colors">
                  <span className="palette-contrast-pair__swatch">
                    <i style={{ backgroundColor: pair.foreground }} />
                    <span>Foreground</span>
                    <code>{pair.foreground}</code>
                  </span>
                  <span className="palette-contrast-pair__swatch">
                    <i style={{ backgroundColor: pair.background }} />
                    <span>Background</span>
                    <code>{pair.background}</code>
                  </span>
                  <strong>{pair.ratio.toFixed(2)}:1</strong>
                </div>

                <div className="palette-contrast-pair__checks">
                  {pair.checks.map((check) => (
                    <span
                      key={`${check.title}-${check.standard}`}
                      className={
                        check.passed
                          ? "palette-contrast-pair__check palette-contrast-pair__check--passed"
                          : "palette-contrast-pair__check palette-contrast-pair__check--failed"
                      }
                    >
                      {check.passed ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <X size={13} aria-hidden="true" />
                      )}
                      {check.title} {check.standard}:{" "}
                      {check.passed ? "Pass" : "Fail"}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PaletteContrastAnalysis;
