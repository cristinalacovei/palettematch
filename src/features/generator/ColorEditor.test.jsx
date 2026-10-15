import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock(
  "chroma-js",
  () => {
    const path = require("path");
    const packageEntry = require.resolve("chroma-js");
    return require(path.join(path.dirname(packageEntry), "dist", "chroma.cjs"));
  },
);

import ColorEditor from "./ColorEditor";

function ControlledColorEditor({ initialColor }) {
  const [color, setColor] = React.useState(initialColor);
  return (
    <ColorEditor
      color={color}
      colorIndex={0}
      onChange={(_, nextColor) => setColor(nextColor)}
      onClose={jest.fn()}
    />
  );
}

describe("ColorEditor OKLCH controls", () => {
  it("shows OKLCH values and updates them when the selected color changes", () => {
    const { rerender } = render(
      <ColorEditor color="#FF0000" colorIndex={0} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText("OKLCH lightness")).toHaveValue(0.628);
    expect(screen.getByLabelText("OKLCH chroma")).toHaveValue(0.2577);
    expect(screen.getByLabelText("OKLCH hue")).toHaveValue(29.2);

    rerender(
      <ColorEditor color="#0000FF" colorIndex={0} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText("OKLCH lightness")).toHaveValue(0.452);
    expect(screen.getByLabelText("OKLCH chroma")).toHaveValue(0.3132);
    expect(screen.getByLabelText("OKLCH hue")).toHaveValue(264.1);
  });

  it("shows an em dash for achromatic hue", () => {
    render(
      <ColorEditor color="#808080" colorIndex={0} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(screen.getByLabelText("OKLCH chroma")).toHaveValue(0);
    expect(screen.getByLabelText("OKLCH hue")).toHaveValue(null);
    expect(screen.getByLabelText("OKLCH hue")).toBeDisabled();
  });

  it.each([
    ["OKLCH lightness", "0.7"],
    ["OKLCH chroma", "0.15"],
    ["OKLCH hue", "120"],
  ])("applies an %s edit through the existing color update callback", (label, value) => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ColorEditor color="#FF0000" colorIndex={2} onChange={onChange} onClose={jest.fn()} />,
    );

    fireEvent.change(screen.getByLabelText(label), { target: { value } });

    expect(onChange).toHaveBeenCalledWith(2, expect.stringMatching(/^#[0-9A-F]{6}$/));
    const updatedColor = onChange.mock.calls[0][1];
    expect(updatedColor).not.toBe("#FF0000");

    rerender(
      <ColorEditor
        color={updatedColor}
        colorIndex={2}
        onChange={onChange}
        onClose={jest.fn()}
      />,
    );
    const initialValue =
      label === "OKLCH lightness" ? 0.628 : label === "OKLCH chroma" ? 0.2577 : 29.2;
    expect(Number(screen.getByLabelText(label).value)).not.toBe(initialValue);
  });

  it("enables hue after increasing chroma on an achromatic color", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ColorEditor color="#808080" colorIndex={0} onChange={onChange} onClose={jest.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("OKLCH chroma"), {
      target: { value: "0.1" },
    });
    const updatedColor = onChange.mock.calls[0][1];
    expect(updatedColor).not.toBe("#808080");

    rerender(
      <ColorEditor
        color={updatedColor}
        colorIndex={0}
        onChange={onChange}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("OKLCH hue")).toBeEnabled();
  });

  it("keeps incremental chroma edits from zero while gray HEX is unchanged", () => {
    render(<ControlledColorEditor initialColor="#666666" />);

    const chromaInput = screen.getByLabelText("OKLCH chroma");
    fireEvent.focus(chromaInput);
    fireEvent.change(chromaInput, { target: { value: "0.0001" } });

    expect(chromaInput).toHaveValue(0.0001);
    expect(screen.getByLabelText("HEX color value")).toHaveValue("#666666");

    fireEvent.change(chromaInput, { target: { value: "0.0002" } });
    expect(chromaInput).toHaveValue(0.0002);
    expect(screen.getByLabelText("HEX color value")).toHaveValue("#666666");

    fireEvent.change(chromaInput, { target: { value: "0.0010" } });
    expect(chromaInput).toHaveValue(0.001);
    expect(screen.getByLabelText("HEX color value")).not.toHaveValue("#666666");
  });

  it("keeps HEX, RGB, and HSL editing connected to the existing callback", () => {
    const onChange = jest.fn();
    render(
      <ColorEditor color="#FF0000" colorIndex={1} onChange={onChange} onClose={jest.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("HEX color value"), {
      target: { value: "#00FF00" },
    });
    expect(onChange).toHaveBeenLastCalledWith(1, "#00FF00");

    fireEvent.change(screen.getByLabelText("R"), { target: { value: "120" } });
    expect(onChange).toHaveBeenLastCalledWith(1, expect.stringMatching(/^#[0-9A-F]{6}$/));

    fireEvent.change(screen.getByLabelText("S %"), { target: { value: "50" } });
    expect(onChange).toHaveBeenLastCalledWith(1, expect.stringMatching(/^#[0-9A-F]{6}$/));
  });
});
