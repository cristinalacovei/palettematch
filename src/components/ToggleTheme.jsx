// src/components/ThemeToggle.jsx
import React, { useState, useEffect } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");

    // Notify other components that the theme has changed
    window.dispatchEvent(new Event("themeChange"));
  }, [dark]);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        padding: "12px 18px",
        borderRadius: "12px",
        background: dark
          ? "linear-gradient(135deg, #2a2a3e, #1a1a2e)"
          : "linear-gradient(135deg, #f0f0f5, #e8e8f0)",
        color: dark ? "#fff" : "#222",
        border: "2px solid",
        borderColor: dark
          ? "rgba(122, 79, 255, 0.3)"
          : "rgba(122, 79, 255, 0.2)",
        cursor: "pointer",
        boxShadow: dark
          ? "0 4px 15px rgba(0, 0, 0, 0.3)"
          : "0 4px 15px rgba(0, 0, 0, 0.1)",
        zIndex: 999,
        fontWeight: "700",
        fontSize: "0.95rem",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        letterSpacing: "0.5px",
      }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default ThemeToggle;
