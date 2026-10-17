import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";

import SavedPalettes from "./SavedPalettes";
import { useAuth } from "../../auth/AuthContext";
import {
  createPalette,
  getPalettes,
  updateDesignSystem,
  updatePalette,
} from "../../services/paletteApi";
import {
  loadPalettes as loadLocalPalettes,
  savePalettes,
  updatePalette as updateLocalPalette,
} from "../../services/paletteStorage";
import { generateId } from "../../utils/idUtils";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../services/paletteApi", () => ({
  createPalette: jest.fn(),
  deletePalette: jest.fn(),
  getPalettes: jest.fn(),
  updateDesignSystem: jest.fn(),
  updatePalette: jest.fn(),
}));

jest.mock("../../services/paletteStorage", () => ({
  loadPalettes: jest.fn(),
  savePalettes: jest.fn(),
  updatePalette: jest.fn(),
}));

jest.mock("../../utils/idUtils", () => ({
  generateId: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

jest.mock("./PaletteCard", () => {
  const React = require("react");

  return function MockPaletteCard({
    palette,
    onDuplicate,
    onEdit,
    onAccessibility,
  }) {
    return (
      <article>
        <h2>{palette.name}</h2>
        <button type="button" onClick={() => onEdit(palette)}>
          Edit palette {palette.name}
        </button>
        <button type="button" onClick={() => onAccessibility(palette)}>
          Check contrast {palette.name}
        </button>
        <button type="button" onClick={() => onDuplicate(palette)}>
          Duplicate {palette.name}
        </button>
      </article>
    );
  };
});

const sourcePalette = {
  id: "source-palette",
  name: "Ocean",
  colors: ["#112233", "#445566"],
  source: "generator",
  favorite: true,
  designSystem: {
    background: "#112233",
    surface: "#223344",
    text: "#FFFFFF",
    primary: "#445566",
    accent: "#778899",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  createdAt: "2026-01-01T00:00:00Z",
};

function renderLibrary() {
  return render(<SavedPalettes />);
}

const navigateMock = jest.fn();

describe("SavedPalettes duplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
    useAuth.mockReturnValue({ authenticated: true, isReady: true });
    getPalettes.mockResolvedValue([sourcePalette]);
    createPalette.mockResolvedValue({
      ...sourcePalette,
      id: "duplicated-palette",
      name: "Ocean copy",
      favorite: false,
    });
  });

  it("creates an authenticated duplicate with the semantic design system in one request", async () => {
    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: "Duplicate Ocean" }));

    await waitFor(() => {
      expect(createPalette).toHaveBeenCalledWith({
        name: "Ocean copy",
        colors: sourcePalette.colors,
        source: "generator",
        favorite: false,
        designSystem: {
          background: "#112233",
          surface: "#223344",
          text: "#FFFFFF",
          primary: "#445566",
          accent: "#778899",
        },
      });
    });
    expect(updateDesignSystem).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Ocean copy" }),
    ).toBeInTheDocument();
  });

  it("creates an authenticated duplicate without a semantic design system", async () => {
    getPalettes.mockResolvedValue([{ ...sourcePalette, designSystem: null }]);

    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: "Duplicate Ocean" }));

    await waitFor(() => {
      expect(createPalette).toHaveBeenCalledWith({
        name: "Ocean copy",
        colors: sourcePalette.colors,
        source: "generator",
        favorite: false,
        designSystem: null,
      });
    });
    expect(updateDesignSystem).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Ocean copy" }),
    ).toBeInTheDocument();
  });

  it("preserves the semantic design system when a guest duplicates a palette", async () => {
    useAuth.mockReturnValue({ authenticated: false, isReady: true });
    loadLocalPalettes.mockReturnValue([sourcePalette]);
    generateId.mockReturnValue("guest-duplicate");
    savePalettes.mockReturnValue(true);

    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: "Duplicate Ocean" }));

    await waitFor(() => {
      expect(savePalettes).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "guest-duplicate",
          name: "Ocean copy",
          colors: sourcePalette.colors,
          favorite: false,
          designSystem: sourcePalette.designSystem,
        }),
        sourcePalette,
      ]);
    });
    expect(getPalettes).not.toHaveBeenCalled();
    expect(createPalette).not.toHaveBeenCalled();
  });
});

describe("SavedPalettes palette editing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigateMock);
    useAuth.mockReturnValue({ authenticated: true, isReady: true });
    getPalettes.mockResolvedValue([sourcePalette]);
    updatePalette.mockResolvedValue({
      ...sourcePalette,
      colors: ["#ABCDEF", "#445566"],
    });
    window.confirm = jest.fn(() => true);
  });

  it("opens Accessibility with the selected palette colors", async () => {
    renderLibrary();

    fireEvent.click(
      await screen.findByRole("button", { name: "Check contrast Ocean" }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/accessibility", {
      state: {
        palette: {
          name: "Ocean",
          colors: sourcePalette.colors,
        },
      },
    });
  });

  async function openPaletteEditor() {
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit palette Ocean" }),
    );
    return screen.findByRole("heading", { name: "Edit Ocean" });
  }

  it("opens the side panel without persisting changes", async () => {
    renderLibrary();
    await openPaletteEditor();

    expect(
      screen.getByRole("dialog", { name: "Edit Ocean" }),
    ).toBeInTheDocument();
    expect(updatePalette).not.toHaveBeenCalled();
    expect(createPalette).not.toHaveBeenCalled();
  });

  it("edits a color and saves it to the existing authenticated palette", async () => {
    renderLibrary();
    await openPaletteEditor();

    fireEvent.click(screen.getByRole("button", { name: "Edit color #112233" }));
    fireEvent.change(screen.getByLabelText("HEX color value"), {
      target: { value: "#ABCDEF" },
    });

    expect(screen.getByText("#ABCDEF")).toBeInTheDocument();
    expect(updatePalette).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updatePalette).toHaveBeenCalledWith("source-palette", {
        name: "Ocean",
        colors: ["#ABCDEF", "#445566"],
        favorite: true,
      });
    });
    expect(createPalette).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Ocean" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Edit Ocean" }),
    ).not.toBeInTheDocument();
  });

  it("cancels without saving when there are no unsaved changes", async () => {
    renderLibrary();
    await openPaletteEditor();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Edit Ocean" }),
    ).not.toBeInTheDocument();
    expect(updatePalette).not.toHaveBeenCalled();
  });

  it("asks before discarding unsaved changes and keeps the panel open if declined", async () => {
    window.confirm.mockReturnValueOnce(false);
    renderLibrary();
    await openPaletteEditor();

    fireEvent.click(screen.getByRole("button", { name: "Edit color #112233" }));
    fireEvent.change(screen.getByLabelText("HEX color value"), {
      target: { value: "#ABCDEF" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Discard your unsaved color changes?",
    );
    expect(
      screen.getByRole("heading", { name: "Edit Ocean" }),
    ).toBeInTheDocument();
    expect(updatePalette).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close palette editor" }));
    expect(
      screen.queryByRole("heading", { name: "Edit Ocean" }),
    ).not.toBeInTheDocument();
  });

  it("saves guest edits through the local palette storage service", async () => {
    useAuth.mockReturnValue({ authenticated: false, isReady: true });
    loadLocalPalettes.mockReturnValue([sourcePalette]);
    updateLocalPalette.mockReturnValue({
      ...sourcePalette,
      colors: ["#ABCDEF", "#445566"],
    });
    renderLibrary();
    await openPaletteEditor();

    fireEvent.click(screen.getByRole("button", { name: "Edit color #112233" }));
    fireEvent.change(screen.getByLabelText("HEX color value"), {
      target: { value: "#ABCDEF" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateLocalPalette).toHaveBeenCalledWith("source-palette", {
        colors: ["#ABCDEF", "#445566"],
      });
    });
    expect(updatePalette).not.toHaveBeenCalled();
    expect(createPalette).not.toHaveBeenCalled();
  });
});
