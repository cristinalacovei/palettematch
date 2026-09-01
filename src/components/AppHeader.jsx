import React from "react";
import { Link, NavLink } from "react-router-dom";
import { FolderHeart, Image, Palette, ShieldCheck } from "lucide-react";
import ThemeToggle from "./ToggleTheme";

const navItems = [
  {
    to: "/generate",
    label: "Generate",
    icon: Palette,
  },
  {
    to: "/from-image",
    label: "Extract",
    icon: Image,
  },
  {
    to: "/accessibility",
    label: "Accessibility",
    icon: ShieldCheck,
  },
  {
    to: "/saved",
    label: "Library",
    icon: FolderHeart,
  },
];

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link className="brand" to="/" aria-label="PaletteMatch home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>

          <span>PaletteMatch</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: NavIcon }) => (
            <NavLink
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link--active" : ""}`
              }
              key={to}
              to={to}
            >
              <NavIcon size={17} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}

export default AppHeader;
