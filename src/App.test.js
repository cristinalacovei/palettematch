import { render, screen } from "@testing-library/react";
import HomePage from "./components/HomePage";

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");

    return {
      BrowserRouter: ({ children }) => <>{children}</>,
      Routes: ({ children }) => <>{children}</>,
      Route: ({ element, path }) => (path === "/" ? element : null),
      Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>{children}</a>
      ),
      NavLink: ({ children, className, to, ...props }) => (
        <a
          href={to}
          className={typeof className === "function" ? className({ isActive: false }) : className}
          {...props}
        >
          {children}
        </a>
      ),
    };
  },
  { virtual: true },
);

test("renders the PaletteMatch home page", () => {
  render(<HomePage />);
  expect(
    screen.getByRole("heading", {
      name: /build palettes that work beyond the moodboard/i,
    }),
  ).toBeInTheDocument();
});
