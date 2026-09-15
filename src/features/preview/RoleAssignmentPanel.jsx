import React from "react";
import { Check, RotateCcw, Save, ShieldCheck } from "lucide-react";

import { ROLE_OPTIONS } from "../../domain/color-system/colorSystemConstants";

function RoleAssignmentPanel({
  palette,
  roles,
  saveStatus,
  previewScore,
  passedChecks,
  totalChecks,
  onRoleChange,
  onReset,
  onSave,
}) {
  return (
    <aside className="ui-preview-controls">
      <div className="ui-preview-controls__heading">
        <div>
          <span>Palette mapping</span>
          <strong>{palette.name}</strong>
        </div>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset automatic color mapping"
          title="Reset mapping"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="ui-preview-original-palette">
        {palette.colors.map((color, index) => (
          <span key={`${color}-${index}`} style={{ backgroundColor: color }} title={color} />
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
                style={{ backgroundColor: roles[role.key] }}
              />
            </div>
            <select
              value={roles[role.key]}
              onChange={(event) => onRoleChange(role.key, event.target.value)}
              aria-label={`Select ${role.label} color`}
            >
              {palette.colors.map((color, index) => (
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
        onClick={onSave}
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
          {passedChecks} of {totalChecks} key combinations pass.
        </small>
      </div>
    </aside>
  );
}

export default RoleAssignmentPanel;
