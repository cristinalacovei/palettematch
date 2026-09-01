import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import chroma from "chroma-js";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  LayoutDashboard,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Save,
} from "lucide-react";
import "./PaletteUIPreview.css";

const HEX_PATTERN = /^#[0-9A-F]{6}$/i;

const ROLE_OPTIONS = [
  {
    key: "background",
    label: "Background",
    description: "Main application background",
  },
  {
    key: "surface",
    label: "Surface",
    description: "Cards and elevated areas",
  },
  {
    key: "text",
    label: "Text",
    description: "Headings and body content",
  },
  {
    key: "primary",
    label: "Primary",
    description: "Buttons and main actions",
  },
  {
    key: "accent",
    label: "Accent",
    description: "Highlights and secondary details",
  },
];

function normalizeColor(color) {
  return chroma(color).hex().toUpperCase();
}

function getImportedPalette(routeState) {
  const receivedPalette = routeState?.palette;

  if (!receivedPalette || !Array.isArray(receivedPalette.colors)) {
    return null;
  }

  const validColors = receivedPalette.colors
    .filter((color) => typeof color === "string" && HEX_PATTERN.test(color))
    .map(normalizeColor);

  const uniqueColors = [...new Set(validColors)];

  if (uniqueColors.length < 2) {
    return null;
  }

  return {
    id: receivedPalette.id || null,
    name: receivedPalette.name || "Untitled palette",
    colors: uniqueColors,
    designSystem:
      receivedPalette.designSystem &&
      typeof receivedPalette.designSystem === "object"
        ? receivedPalette.designSystem
        : null,
  };
}

function getColorScore(color) {
  const colorValue = chroma(color);
  const saturation = colorValue.get("hsl.s") || 0;
  const luminance = colorValue.luminance();

  const middleLuminanceScore = 1 - Math.abs(luminance - 0.45);

  return saturation * 0.75 + middleLuminanceScore * 0.25;
}

function findStrongestColor(colors) {
  if (colors.length === 0) {
    return null;
  }

  return [...colors].sort(
    (first, second) => getColorScore(second) - getColorScore(first),
  )[0];
}

function createRoleAssignments(colors) {
  const sortedByLuminance = [...colors].sort(
    (first, second) => chroma(first).luminance() - chroma(second).luminance(),
  );

  const darkestColor = sortedByLuminance[0];
  const lightestColor = sortedByLuminance[sortedByLuminance.length - 1];

  const surfaceColor =
    sortedByLuminance.length >= 3
      ? sortedByLuminance[sortedByLuminance.length - 2]
      : normalizeColor(chroma(lightestColor).darken(0.35));

  const primaryCandidates = colors.filter(
    (color) =>
      color !== darkestColor &&
      color !== lightestColor &&
      color !== surfaceColor,
  );

  const primaryColor =
    findStrongestColor(primaryCandidates) ||
    findStrongestColor(
      colors.filter(
        (color) => color !== darkestColor && color !== lightestColor,
      ),
    ) ||
    darkestColor;

  const accentCandidates = colors.filter(
    (color) =>
      color !== darkestColor &&
      color !== lightestColor &&
      color !== surfaceColor &&
      color !== primaryColor,
  );

  const accentColor =
    findStrongestColor(accentCandidates) ||
    colors.find((color) => color !== primaryColor && color !== darkestColor) ||
    primaryColor;

  return {
    background: lightestColor,
    surface: surfaceColor,
    text: darkestColor,
    primary: primaryColor,
    accent: accentColor,
  };
}

function getSavedRoleAssignments(designSystem) {
  if (!designSystem || typeof designSystem !== "object") {
    return null;
  }

  const roleKeys = ROLE_OPTIONS.map((role) => role.key);

  const hasValidRoles = roleKeys.every(
    (roleKey) =>
      typeof designSystem[roleKey] === "string" &&
      HEX_PATTERN.test(designSystem[roleKey]),
  );

  if (!hasValidRoles) {
    return null;
  }

  return roleKeys.reduce(
    (savedRoles, roleKey) => ({
      ...savedRoles,
      [roleKey]: normalizeColor(designSystem[roleKey]),
    }),
    {},
  );
}

function getInitialRoleAssignments(palette) {
  const savedRoles = getSavedRoleAssignments(palette.designSystem);

  if (savedRoles) {
    return savedRoles;
  }

  return createRoleAssignments(palette.colors);
}

function getBestTextColor(background, candidates) {
  return [...candidates].sort(
    (first, second) =>
      chroma.contrast(second, background) - chroma.contrast(first, background),
  )[0];
}

function PaletteUIPreview() {
  const location = useLocation();

  const importedPalette = useMemo(
    () => getImportedPalette(location.state),
    [location.state],
  );

  const [roles, setRoles] = useState(() =>
    importedPalette ? getInitialRoleAssignments(importedPalette) : null,
  );

  const [saveStatus, setSaveStatus] = useState("");

  const primaryText = useMemo(() => {
    if (!roles) {
      return "#FFFFFF";
    }

    return getBestTextColor(roles.primary, [roles.text, roles.background]);
  }, [roles]);

  const accessibilityChecks = useMemo(() => {
    if (!roles) {
      return [];
    }

    return [
      {
        label: "Text on background",
        ratio: chroma.contrast(roles.text, roles.background),
        threshold: 4.5,
      },
      {
        label: "Text on surface",
        ratio: chroma.contrast(roles.text, roles.surface),
        threshold: 4.5,
      },
      {
        label: "Button text",
        ratio: chroma.contrast(primaryText, roles.primary),
        threshold: 4.5,
      },
      {
        label: "Primary UI elements",
        ratio: chroma.contrast(roles.primary, roles.background),
        threshold: 3,
      },
      {
        label: "Accent UI elements",
        ratio: chroma.contrast(roles.accent, roles.surface),
        threshold: 3,
      },
    ].map((check) => ({
      ...check,
      passed: check.ratio >= check.threshold,
    }));
  }, [roles, primaryText]);

  if (!importedPalette || !roles) {
    return (
      <main className="ui-preview-page">
        <section className="ui-preview-empty">
          <span className="ui-preview-empty__icon">
            <LayoutDashboard size={30} aria-hidden="true" />
          </span>

          <h1>No palette selected</h1>

          <p>
            Open your Library and select a saved palette to preview it in an
            interface.
          </p>

          <Link to="/saved">
            <ArrowLeft size={17} aria-hidden="true" />
            Go to Library
          </Link>
        </section>
      </main>
    );
  }

  const passedChecks = accessibilityChecks.filter(
    (check) => check.passed,
  ).length;

  const previewScore = Math.round(
    (passedChecks / accessibilityChecks.length) * 100,
  );

  const handleRoleChange = (roleKey, color) => {
    setRoles((currentRoles) => ({
      ...currentRoles,
      [roleKey]: color,
    }));

    setSaveStatus("");
  };

  const resetRoles = () => {
    setRoles(createRoleAssignments(importedPalette.colors));

    setSaveStatus("");
  };
  const saveDesignSystem = () => {
    if (!importedPalette.id) {
      setSaveStatus("error");
      return;
    }

    try {
      const savedPalettes = JSON.parse(
        localStorage.getItem("palettes") || "[]",
      );

      if (!Array.isArray(savedPalettes)) {
        setSaveStatus("error");
        return;
      }

      const paletteExists = savedPalettes.some(
        (palette) => palette.id === importedPalette.id,
      );

      if (!paletteExists) {
        setSaveStatus("error");
        return;
      }

      const updatedPalettes = savedPalettes.map((palette) =>
        palette.id === importedPalette.id
          ? {
              ...palette,
              designSystem: {
                ...roles,
                updatedAt: new Date().toISOString(),
              },
            }
          : palette,
      );

      localStorage.setItem("palettes", JSON.stringify(updatedPalettes));

      setSaveStatus("saved");

      window.setTimeout(() => {
        setSaveStatus("");
      }, 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const previewStyles = {
    "--preview-background": roles.background,
    "--preview-surface": roles.surface,
    "--preview-text": roles.text,
    "--preview-primary": roles.primary,
    "--preview-accent": roles.accent,
    "--preview-primary-text": primaryText,
  };

  return (
    <main className="ui-preview-page">
      <section className="ui-preview-heading">
        <div>
          <span className="ui-preview-kicker">Interface preview</span>

          <h1>See your palette in action.</h1>

          <p>
            PaletteMatch assigned each color a practical interface role. Adjust
            the mapping and verify the results.
          </p>
        </div>

        <Link className="ui-preview-back" to="/saved">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Library
        </Link>
      </section>

      <section className="ui-preview-workspace">
        <aside className="ui-preview-controls">
          <div className="ui-preview-controls__heading">
            <div>
              <span>Palette mapping</span>
              <strong>{importedPalette.name}</strong>
            </div>

            <button
              type="button"
              onClick={resetRoles}
              aria-label="Reset automatic color mapping"
              title="Reset mapping"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="ui-preview-original-palette">
            {importedPalette.colors.map((color, index) => (
              <span
                key={`${color}-${index}`}
                style={{
                  backgroundColor: color,
                }}
                title={color}
              />
            ))}
          </div>

          <div className="ui-preview-role-list">
            {ROLE_OPTIONS.map((role) => (
              <div className="ui-preview-role" key={role.key}>
                <div className="ui-preview-role__heading">
                  <div>
                    <strong>{role.label}</strong>
                    <span>{role.description}</span>
                  </div>

                  <span
                    className="ui-preview-role__swatch"
                    style={{
                      backgroundColor: roles[role.key],
                    }}
                  />
                </div>

                <select
                  value={roles[role.key]}
                  onChange={(event) =>
                    handleRoleChange(role.key, event.target.value)
                  }
                  aria-label={`Select ${role.label} color`}
                >
                  {importedPalette.colors.map((color, index) => (
                    <option value={color} key={`${role.key}-${color}-${index}`}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            className={`ui-preview-save-button ${
              saveStatus === "saved"
                ? "ui-preview-save-button--saved"
                : saveStatus === "error"
                  ? "ui-preview-save-button--error"
                  : ""
            }`}
            type="button"
            onClick={saveDesignSystem}
          >
            {saveStatus === "saved" ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}

            {saveStatus === "saved"
              ? "Design system saved"
              : saveStatus === "error"
                ? "Could not save"
                : "Save design system"}
          </button>
          <div className="ui-preview-score">
            <div>
              <ShieldCheck size={18} aria-hidden="true" />

              <span>Accessibility score</span>
            </div>

            <strong>{previewScore}%</strong>

            <small>
              {passedChecks} of {accessibilityChecks.length} key combinations
              pass.
            </small>
          </div>
        </aside>

        <div className="ui-preview-canvas">
          <div className="ui-preview-canvas__heading">
            <div>
              <span>Dashboard example</span>
              <strong>Live interface</strong>
            </div>

            <div className="ui-preview-canvas__status">
              <span />
              Live preview
            </div>
          </div>

          <div className="preview-application" style={previewStyles}>
            <aside className="preview-sidebar">
              <div className="preview-brand">
                <span>
                  <Sparkles size={17} aria-hidden="true" />
                </span>

                <strong>Northstar</strong>
              </div>

              <nav>
                <button
                  className="preview-nav-item preview-nav-item--active"
                  type="button"
                >
                  <LayoutDashboard size={17} aria-hidden="true" />
                  Overview
                </button>

                <button className="preview-nav-item" type="button">
                  <TrendingUp size={17} aria-hidden="true" />
                  Analytics
                </button>

                <button className="preview-nav-item" type="button">
                  <Users size={17} aria-hidden="true" />
                  Customers
                </button>
              </nav>

              <div className="preview-sidebar__card">
                <Sparkles size={18} aria-hidden="true" />

                <strong>Upgrade plan</strong>

                <span>Unlock advanced reports.</span>

                <button type="button">View plans</button>
              </div>
            </aside>

            <div className="preview-content">
              <header className="preview-topbar">
                <div className="preview-search">
                  <Search size={16} aria-hidden="true" />

                  <input
                    type="text"
                    placeholder="Search dashboard"
                    readOnly
                    aria-label="Search dashboard preview"
                  />
                </div>

                <button
                  className="preview-icon-button"
                  type="button"
                  aria-label="Notifications"
                >
                  <Bell size={17} aria-hidden="true" />
                </button>

                <span className="preview-avatar">CL</span>
              </header>

              <div className="preview-main">
                <div className="preview-main__heading">
                  <div>
                    <span>September overview</span>
                    <h2>Welcome back, Cristina</h2>
                  </div>

                  <button className="preview-primary-button" type="button">
                    Create report
                  </button>
                </div>

                <div className="preview-stat-grid">
                  <article className="preview-stat-card">
                    <div>
                      <span>Total revenue</span>
                      <TrendingUp size={17} aria-hidden="true" />
                    </div>

                    <strong>$48,290</strong>

                    <small>+12.5% from last month</small>
                  </article>

                  <article className="preview-stat-card">
                    <div>
                      <span>New customers</span>
                      <Users size={17} aria-hidden="true" />
                    </div>

                    <strong>1,429</strong>

                    <small>+8.2% from last month</small>
                  </article>

                  <article className="preview-stat-card">
                    <div>
                      <span>Conversion</span>
                      <Sparkles size={17} aria-hidden="true" />
                    </div>

                    <strong>7.84%</strong>

                    <small>+2.1% from last month</small>
                  </article>
                </div>

                <div className="preview-bottom-grid">
                  <article className="preview-chart-card">
                    <div className="preview-card-heading">
                      <div>
                        <span>Performance</span>
                        <strong>Monthly revenue</strong>
                      </div>

                      <span>Last 6 months</span>
                    </div>

                    <div className="preview-chart">
                      {[42, 58, 48, 72, 64, 88].map((height, index) => (
                        <span
                          key={index}
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      ))}
                    </div>
                  </article>

                  <article className="preview-activity-card">
                    <div className="preview-card-heading">
                      <div>
                        <span>Activity</span>
                        <strong>Recent updates</strong>
                      </div>
                    </div>

                    <div className="preview-activity-list">
                      <div>
                        <span />
                        <p>
                          <strong>New report created</strong>
                          <small>Marketing performance</small>
                        </p>
                      </div>

                      <div>
                        <span />
                        <p>
                          <strong>Target achieved</strong>
                          <small>Monthly conversions</small>
                        </p>
                      </div>

                      <div>
                        <span />
                        <p>
                          <strong>Customer added</strong>
                          <small>Enterprise account</small>
                        </p>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>

          <section className="ui-preview-accessibility">
            <div className="ui-preview-accessibility__heading">
              <div>
                <span>Automatic analysis</span>
                <h2>Important color combinations</h2>
              </div>

              <strong>
                {passedChecks}/{accessibilityChecks.length} passed
              </strong>
            </div>

            <div className="ui-preview-check-list">
              {accessibilityChecks.map((check) => (
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
        </div>
      </section>
    </main>
  );
}

export default PaletteUIPreview;
