import React, { useState } from "react";

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
import DemoLoginForm from "../../auth/DemoLoginForm";

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
  const {
    isReady,
    authenticated,
    currentUser,
    authError,
    authMode,
    login,
    loginWithDemoPassword,
    logout,
  } = useAuth();
  const [demoLoginOpen, setDemoLoginOpen] = useState(false);

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

          {isReady && !authenticated && authMode === "keycloak" && (
            <button className="nav-link" type="button" onClick={login}>
              <LogIn size={17} aria-hidden="true" />

              <span>Login</span>
            </button>
          )}

          {isReady && !authenticated && authMode === "demo" && (
            <button
              className="nav-link"
              type="button"
              onClick={() => setDemoLoginOpen((open) => !open)}
              aria-expanded={demoLoginOpen}
              aria-controls="demo-login-title"
            >
              <LogIn size={17} aria-hidden="true" />

              <span>Demo login</span>
            </button>
          )}

          {isReady && authenticated && (
            <button className="nav-link" type="button" onClick={logout}>
              <LogOut size={17} aria-hidden="true" />

              <span>Logout</span>
            </button>
          )}

          <ThemeToggle />

          {authMode === "demo" && demoLoginOpen && !authenticated && (
            <DemoLoginForm
              onSubmit={loginWithDemoPassword}
              onClose={() => setDemoLoginOpen(false)}
              error={authError}
            />
          )}
        </div>
      </div>
      {authError && (authMode === "keycloak" || !demoLoginOpen) && (
        <p className="auth-status" role="alert">
          {authError}
        </p>
      )}
    </header>
  );
}

export default AppHeader;
