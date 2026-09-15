import React, { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, X } from "lucide-react";

import ExportFormatSelector from "./ExportFormatSelector";
import {
  EXPORT_FORMATS,
  createSafeFileName,
  formatExportContent,
  normalizeDesignSystem,
  normalizeExportColors,
} from "./exportFormatters";
import { downloadTextFile } from "./fileDownload";
import "./ExportPalette.css";

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryTextArea = document.createElement("textarea");
  temporaryTextArea.value = text;
  temporaryTextArea.style.position = "fixed";
  temporaryTextArea.style.left = "-9999px";
  temporaryTextArea.style.opacity = "0";
  document.body.appendChild(temporaryTextArea);
  temporaryTextArea.focus();
  temporaryTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(temporaryTextArea);
}

function ExportPalette({
  colors = [],
  paletteName = "Untitled palette",
  designSystem = null,
  isOpen,
  onClose,
}) {
  const [selectedFormat, setSelectedFormat] = useState("css");
  const [copied, setCopied] = useState(false);

  const normalizedColors = useMemo(
    () => normalizeExportColors(colors),
    [colors],
  );
  const normalizedDesignSystem = useMemo(
    () => normalizeDesignSystem(designSystem),
    [designSystem],
  );
  const exportContent = useMemo(
    () =>
      formatExportContent(
        selectedFormat,
        normalizedColors,
        paletteName,
        normalizedDesignSystem,
      ),
    [normalizedColors, normalizedDesignSystem, paletteName, selectedFormat],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setCopied(false);
  }, [selectedFormat, exportContent]);

  if (!isOpen) return null;

  const currentFormat = EXPORT_FORMATS[selectedFormat];

  const handleCopy = async () => {
    try {
      await copyText(exportContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Could not copy the palette.", error);
    }
  };

  const handleDownload = () => {
    const semanticSuffix = normalizedDesignSystem ? "-design-system" : "";
    downloadTextFile({
      content: exportContent,
      filename: `${createSafeFileName(paletteName)}${semanticSuffix}.${currentFormat.extension}`,
      mimeType: "text/plain",
    });
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="export-modal"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        className="export-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-palette-title"
      >
        <header className="export-modal__header">
          <div>
            <span>
              {normalizedDesignSystem
                ? "Design system export"
                : "Palette export"}
            </span>
            <h2 id="export-palette-title">Export your color system</h2>
            <p>Copy the generated code or download it as a file.</p>
          </div>
          <button
            className="export-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close export window"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="export-modal__palette">
          {normalizedColors.map((color, index) => (
            <div className="export-modal__swatch" key={`${color}-${index}`}>
              <span style={{ backgroundColor: color }} />
              <small>{color}</small>
            </div>
          ))}
        </div>

        {normalizedDesignSystem && (
          <div className="export-modal__semantic-note">
            <span>
              <Check size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Semantic roles included</strong>
              <p>
                Background, surface, text, primary and accent names will be
                used in every format.
              </p>
            </div>
          </div>
        )}

        <ExportFormatSelector
          formats={EXPORT_FORMATS}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
        />

        <div className="export-modal__code">
          <div className="export-modal__code-heading">
            <span>{currentFormat.label} output</span>
            <small>.{currentFormat.extension}</small>
          </div>
          <pre>
            <code>{exportContent}</code>
          </pre>
        </div>

        <footer className="export-modal__footer">
          <button
            className="export-modal__secondary-action"
            type="button"
            onClick={handleCopy}
          >
            {copied ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Clipboard size={17} aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy code"}
          </button>
          <button
            className="export-modal__primary-action"
            type="button"
            onClick={handleDownload}
          >
            <Download size={17} aria-hidden="true" />
            Download file
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ExportPalette;
