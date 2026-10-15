import React from "react";

import { Link, NavLink } from "react-router-dom";

import {
  FolderHeart,
  Image,
  LogIn,
  LogOut,
  Palette,
  ShieldCheck,
} from "lucide-react";

import ThemeToggle from "./ToggleTheme";

import { useAuth } from "../../auth/AuthContext";

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
  const { isReady, authenticated, currentUser, login, logout } = useAuth();

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

        <div className="app-header__actions">
          {isReady && authenticated && currentUser && (
            <span className="app-header__user">{currentUser.username}</span>
          )}

          {isReady && !authenticated && (
            <button className="nav-link" type="button" onClick={login}>
              <LogIn size={17} aria-hidden="true" />

              <span>Login</span>
            </button>
          )}

          {isReady && authenticated && (
            <button className="nav-link" type="button" onClick={logout}>
              <LogOut size={17} aria-hidden="true" />

              <span>Logout</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
