import React, { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Download, X } from "lucide-react";
import "./ExportPalette.css";

const DESIGN_ROLE_KEYS = ["background", "surface", "text", "primary", "accent"];

function normalizeDesignSystem(designSystem) {
  if (!designSystem || typeof designSystem !== "object") {
    return null;
  }

  const hasAllRoles = DESIGN_ROLE_KEYS.every(
    (role) => typeof designSystem[role] === "string",
  );

  if (!hasAllRoles) {
    return null;
  }

  return DESIGN_ROLE_KEYS.reduce(
    (normalizedRoles, role) => ({
      ...normalizedRoles,
      [role]: designSystem[role].toUpperCase(),
    }),
    {},
  );
}

const exportFormats = {
  css: {
    label: "CSS",
    description: "CSS custom properties",
    extension: "css",

    generate(colors, paletteName, designSystem) {
      if (designSystem) {
        const variables = DESIGN_ROLE_KEYS.map(
          (role) => `  --color-${role}: ${designSystem[role]};`,
        ).join("\n");

        return `:root {\n${variables}\n}`;
      }

      const variables = colors
        .map((color, index) => `  --palette-${index + 1}: ${color};`)
        .join("\n");

      return `:root {\n${variables}\n}`;
    },
  },

  scss: {
    label: "SCSS",
    description: "Sass variables",
    extension: "scss",

    generate(colors, paletteName, designSystem) {
      if (designSystem) {
        return DESIGN_ROLE_KEYS.map(
          (role) => `$color-${role}: ${designSystem[role]};`,
        ).join("\n");
      }

      return colors
        .map((color, index) => `$palette-${index + 1}: ${color};`)
        .join("\n");
    },
  },

  json: {
    label: "JSON",
    description: "Structured color data",
    extension: "json",

    generate(colors, paletteName, designSystem) {
      if (designSystem) {
        return JSON.stringify(
          {
            name: paletteName,
            type: "design-system",
            roles: designSystem,
            palette: colors,
          },
          null,
          2,
        );
      }

      return JSON.stringify(
        {
          name: paletteName,
          type: "color-palette",
          colors: colors.map((color, index) => ({
            name: `Color ${String(index + 1).padStart(2, "0")}`,
            value: color,
          })),
        },
        null,
        2,
      );
    },
  },

  tailwind: {
    label: "Tailwind",
    description: "Tailwind configuration",
    extension: "js",

    generate(colors, paletteName, designSystem) {
      if (designSystem) {
        const roleEntries = DESIGN_ROLE_KEYS.map(
          (role) => `        ${role}: "${designSystem[role]}",`,
        ).join("\n");

        return `module.exports = {
  theme: {
    extend: {
      colors: {
${roleEntries}
      },
    },
  },
};`;
      }

      const colorEntries = colors
        .map((color, index) => `          "${index + 1}": "${color}",`)
        .join("\n");

      return `module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
${colorEntries}
        },
      },
    },
  },
};`;
    },
  },
};

function createSafeFileName(name) {
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || "palette";
}

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
    () =>
      colors
        .filter((color) => typeof color === "string")
        .map((color) => color.toUpperCase()),
    [colors],
  );

  const normalizedDesignSystem = useMemo(
    () => normalizeDesignSystem(designSystem),
    [designSystem],
  );

  const exportContent = useMemo(() => {
    const currentFormat = exportFormats[selectedFormat];

    return currentFormat.generate(
      normalizedColors,
      paletteName,
      normalizedDesignSystem,
    );
  }, [normalizedColors, normalizedDesignSystem, paletteName, selectedFormat]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
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

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await copyText(exportContent);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Could not copy the palette.", error);
    }
  };

  const handleDownload = () => {
    const currentFormat = exportFormats[selectedFormat];

    const file = new Blob([exportContent], {
      type: "text/plain;charset=utf-8",
    });

    const downloadUrl = window.URL.createObjectURL(file);

    const downloadLink = document.createElement("a");

    const semanticSuffix = normalizedDesignSystem ? "-design-system" : "";

    downloadLink.href = downloadUrl;

    downloadLink.download = `${createSafeFileName(
      paletteName,
    )}${semanticSuffix}.${currentFormat.extension}`;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);

    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
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
              <span
                style={{
                  backgroundColor: color,
                }}
              />

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
                Background, surface, text, primary and accent names will be used
                in every format.
              </p>
            </div>
          </div>
        )}

        <div
          className="export-modal__formats"
          role="tablist"
          aria-label="Export format"
        >
          {Object.entries(exportFormats).map(([formatKey, format]) => (
            <button
              className={`export-format ${
                selectedFormat === formatKey ? "export-format--active" : ""
              }`}
              type="button"
              role="tab"
              aria-selected={selectedFormat === formatKey}
              key={formatKey}
              onClick={() => setSelectedFormat(formatKey)}
            >
              <strong>{format.label}</strong>

              <span>{format.description}</span>
            </button>
          ))}
        </div>

        <div className="export-modal__code">
          <div className="export-modal__code-heading">
            <span>{exportFormats[selectedFormat].label} output</span>

            <small>.{exportFormats[selectedFormat].extension}</small>
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
