import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import AccessibilityChecker from "./AccessibilityChecker";
import { useAuth } from "../../auth/AuthContext";
import { getPalettes } from "../../services/paletteApi";
import { loadPalettes } from "../../services/paletteStorage";

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: jest.fn(),
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

jest.mock("../../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../services/paletteApi", () => ({
  getPalettes: jest.fn(),
}));

jest.mock("../../services/paletteStorage", () => ({
  loadPalettes: jest.fn(),
}));

describe("AccessibilityChecker palette analysis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ authenticated: true, isReady: false });
    getPalettes.mockResolvedValue([]);
    loadPalettes.mockReturnValue([]);
  });

  it("analyzes all pairs for the palette selected from Library", () => {
    useLocation.mockReturnValue({
      state: {
        palette: {
          name: "Ocean",
          colors: ["#112233", "#445566", "#778899", "#AABBCC", "#DDEEFF"],
        },
      },
    });

    render(<AccessibilityChecker />);

    expect(
      screen.getByRole("heading", { name: "WCAG contrast for Ocean" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^\d+ of 10 pairs have a failing check$/),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll(".palette-contrast-pair"),
    ).toHaveLength(10);
    expect(screen.getAllByText("#112233")).not.toHaveLength(0);
    expect(screen.getAllByText("#DDEEFF")).not.toHaveLength(0);
    expect(
      document.querySelectorAll(".palette-contrast-pair__check"),
    ).toHaveLength(40);
  });

  it("shows clear feedback when an imported palette has invalid colors", () => {
    useLocation.mockReturnValue({
      state: {
        palette: {
          name: "Broken palette",
          colors: ["bad", "#000000", null],
        },
      },
    });

    render(<AccessibilityChecker />);

    expect(
      screen.getByText(/2 invalid colors were skipped/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 colors are missing from the expected five/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This palette does not contain two valid, distinct HEX colors to compare/,
      ),
    ).toBeInTheDocument();
  });

  it("lets authenticated users select a saved palette and shows its colors and analysis", async () => {
    getPalettes.mockResolvedValue([
      {
        id: "saved-ocean",
        name: "Saved Ocean",
        colors: ["#000000", "#FFFFFF", "#336699", "#CC8844", "#668822"],
      },
    ]);
    useLocation.mockReturnValue({ state: null });
    useAuth.mockReturnValue({ authenticated: true, isReady: true });

    render(<AccessibilityChecker />);
    fireEvent.click(screen.getByRole("button", { name: "Analyze a palette" }));
    const paletteSelect = await screen.findByLabelText("Saved palette");
    await screen.findByRole("option", { name: "Saved Ocean" });
    fireEvent.change(paletteSelect, {
      target: { value: "saved-ocean" },
    });
    expect(screen.getByLabelText("Saved palette")).toHaveValue("saved-ocean");

    expect(
      await screen.findByRole("heading", {
        name: "WCAG contrast for Saved Ocean",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("#000000")).not.toHaveLength(0);
    expect(screen.getAllByText("#668822")).not.toHaveLength(0);
    expect(document.querySelectorAll(".palette-contrast-pair")).toHaveLength(10);
    expect(getPalettes).toHaveBeenCalled();
    expect(loadPalettes).not.toHaveBeenCalled();
  });

  it("loads guest palettes from local storage and explains an empty Library", async () => {
    useAuth.mockReturnValue({ authenticated: false, isReady: true });
    useLocation.mockReturnValue({ state: null });
    loadPalettes.mockReturnValue([]);

    render(<AccessibilityChecker />);
    fireEvent.click(screen.getByRole("button", { name: "Analyze a palette" }));

    expect(
      await screen.findByText(/You have no saved palettes to analyze yet/),
    ).toBeInTheDocument();
    expect(loadPalettes).toHaveBeenCalled();
    expect(getPalettes).not.toHaveBeenCalled();
  });

  it("preserves two-color comparison and can return from palette analysis", () => {
    useLocation.mockReturnValue({ state: null });
    render(<AccessibilityChecker />);

    expect(screen.getByLabelText("Text color")).toBeInTheDocument();
    expect(screen.getByLabelText("Background color")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Analyze a palette" }));
    expect(screen.getByLabelText("Saved palette")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Check two colors" }));
    expect(screen.getByLabelText("Text color")).toBeInTheDocument();
    expect(screen.queryByLabelText("Saved palette")).not.toBeInTheDocument();
  });
});
