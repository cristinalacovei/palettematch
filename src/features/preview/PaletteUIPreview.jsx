import React, { useMemo, useState } from "react";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  getBestTextColor,
  getImportedPalette,
  getInitialRoleAssignments,
  createRoleAssignments,
} from "../../domain/color-system/roleAssignment";
import {
  getPreviewContrastResults,
} from "../../domain/accessibility/accessibilityEngine";
import { savePaletteDesignSystem } from "../../services/paletteStorage";
import RoleAssignmentPanel from "./RoleAssignmentPanel";
import InterfacePreview from "./InterfacePreview";
import PreviewAccessibilitySummary from "./PreviewAccessibilitySummary";
import "./PaletteUIPreview.css";

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

  const primaryText = useMemo(
    () =>
      roles
        ? getBestTextColor(roles.primary, [roles.text, roles.background])
        : "#FFFFFF",
    [roles],
  );
  const accessibilityChecks = useMemo(
    () => (roles ? getPreviewContrastResults(roles, primaryText) : []),
    [roles, primaryText],
  );

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

  const passedChecks = accessibilityChecks.filter((check) => check.passed).length;
  const previewScore = Math.round(
    (passedChecks / accessibilityChecks.length) * 100,
  );

  const handleRoleChange = (roleKey, color) => {
    setRoles((currentRoles) => ({ ...currentRoles, [roleKey]: color }));
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

    const updatedPalette = savePaletteDesignSystem(importedPalette.id, roles);
    if (!updatedPalette) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus(""), 2000);
  };

  return (
    <main className="ui-preview-page">
      <section className="ui-preview-heading">
        <div className="ui-preview-canvas">
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
        <RoleAssignmentPanel
          palette={importedPalette}
          roles={roles}
          saveStatus={saveStatus}
          previewScore={previewScore}
          passedChecks={passedChecks}
          totalChecks={accessibilityChecks.length}
          onRoleChange={handleRoleChange}
          onReset={resetRoles}
          onSave={saveDesignSystem}
        />
        <div>
          <InterfacePreview roles={roles} primaryText={primaryText} />
          <PreviewAccessibilitySummary
            checks={accessibilityChecks}
            passedChecks={passedChecks}
          />
        </div>
      </section>
    </main>
  );
}

export default PaletteUIPreview;
