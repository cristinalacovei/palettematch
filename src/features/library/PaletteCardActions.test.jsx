import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PaletteCardActions from "./PaletteCardActions";

const palette = {
  id: "palette-1",
  name: "Ocean",
  colors: ["#112233", "#445566"],
};

describe("PaletteCardActions", () => {
  const callbacks = {
    onCopyPalette: jest.fn(),
    onExport: jest.fn(),
    onPreview: jest.fn(),
    onAccessibility: jest.fn(),
    onEdit: jest.fn(),
    onRename: jest.fn(),
    onDuplicate: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps Edit, Preview, and Accessibility visible and invokes those actions", () => {
    render(<PaletteCardActions palette={palette} {...callbacks} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit palette" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Accessibility" }));

    expect(callbacks.onEdit).toHaveBeenCalledWith(palette);
    expect(callbacks.onPreview).toHaveBeenCalledWith(palette);
    expect(callbacks.onAccessibility).toHaveBeenCalledWith(palette);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens an accessible menu and runs secondary actions without bubbling", () => {
    const cardClick = jest.fn();
    render(
      <article onClick={cardClick}>
        <PaletteCardActions palette={palette} {...callbacks} />
      </article>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Ocean" }),
    );
    expect(screen.getByRole("menu", { name: "Actions for Ocean" })).toBeVisible();

    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(callbacks.onRename).toHaveBeenCalledWith(palette);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(cardClick).not.toHaveBeenCalled();
  });

  it.each([
    ["Copy", "onCopyPalette", palette],
    ["Export", "onExport", palette],
    ["Duplicate", "onDuplicate", palette],
    ["Delete", "onDelete", palette.id],
  ])("runs %s from More actions", (label, callbackName, argument) => {
    render(<PaletteCardActions palette={palette} {...callbacks} />);

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Ocean" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: label }));

    expect(callbacks[callbackName]).toHaveBeenCalledWith(argument);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on outside click and Escape", () => {
    render(
      <>
        <PaletteCardActions palette={palette} {...callbacks} />
        <button type="button">Outside</button>
      </>,
    );

    const moreButton = screen.getByRole("button", {
      name: "More actions for Ocean",
    });
    fireEvent.click(moreButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(moreButton);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
