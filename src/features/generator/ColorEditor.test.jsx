import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

import ColorEditor from "./ColorEditor";

describe("ColorEditor OKLCH display", () => {
  it("shows formatted OKLCH values and updates when the selected color changes", () => {
    const { rerender } = render(
      <ColorEditor color="#FF0000" colorIndex={0} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText("OKLCH lightness")).toHaveTextContent("0.628");
    expect(screen.getByLabelText("OKLCH chroma")).toHaveTextContent("0.2577");
    expect(screen.getByLabelText("OKLCH hue")).toHaveTextContent("29.2°");

    rerender(
      <ColorEditor color="#0000FF" colorIndex={0} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText("OKLCH lightness")).toHaveTextContent("0.452");
    expect(screen.getByLabelText("OKLCH chroma")).toHaveTextContent("0.3132");
    expect(screen.getByLabelText("OKLCH hue")).toHaveTextContent("264.1°");
  });

  it("shows an em dash for achromatic hue", () => {
    render(
      <ColorEditor color="#808080" colorIndex={0} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText("OKLCH chroma")).toHaveTextContent("0.0000");
    expect(screen.getByLabelText("OKLCH hue")).toHaveTextContent("—");
  });
});
