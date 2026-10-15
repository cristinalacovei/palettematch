import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ authenticated: false }),
}));
jest.mock("../../services/paletteApi", () => ({
  createPalette: jest.fn(),
}));
jest.mock("../../services/paletteStorage", () => ({
  addPalette: jest.fn(),
}));
jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

import PaletteGenerator from "./PaletteGenerator";

describe("PaletteGenerator OKLCH mode", () => {
  it("keeps harmony mode available and displays generated OKLCH colors", () => {
    render(<PaletteGenerator />);

    expect(screen.getByLabelText("Color harmony")).toBeInTheDocument();
    expect(screen.getByText("Analog", { selector: "strong" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Generation mode"), {
      target: { value: "oklch" },
    });
    expect(screen.queryByLabelText("Color harmony")).not.toBeInTheDocument();
    expect(screen.getByLabelText("OKLCH harmony")).toHaveValue("variations");

    fireEvent.click(screen.getByRole("button", { name: /generate palette/i }));

    expect(
      screen.getByText("OKLCH variations", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /^Copy color #[0-9A-F]{6}$/ }),
    ).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Copy color #5B5CE2" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("OKLCH harmony"), {
      target: { value: "complementary" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate palette/i }));
    expect(
      screen.getByText("Complementary", { selector: "strong" }),
    ).toBeInTheDocument();
  });
});
