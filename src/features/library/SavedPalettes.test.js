import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SavedPalettes from "./SavedPalettes";
import { useAuth } from "../../auth/AuthContext";
import {
  createPalette,
  getPalettes,
  updateDesignSystem,
} from "../../services/paletteApi";
import {
  loadPalettes as loadLocalPalettes,
  savePalettes,
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
}));

jest.mock("../../utils/idUtils", () => ({
  generateId: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

jest.mock("./PaletteCard", () => {
  const React = require("react");

  return function MockPaletteCard({ palette, onDuplicate }) {
    return (
      <article>
        <h2>{palette.name}</h2>
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

describe("SavedPalettes duplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(await screen.findByRole("heading", { name: "Ocean copy" })).toBeInTheDocument();
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
    expect(await screen.findByRole("heading", { name: "Ocean copy" })).toBeInTheDocument();
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
