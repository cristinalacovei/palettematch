// src/components/ThemeToggle.jsx
import React, { useState, useEffect } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");

    // 🔔 Notifică alte componente că s-a schimbat tema
    window.dispatchEvent(new Event("themeChange"));
  }, [dark]);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        padding: "10px 15px",
        borderRadius: "10px",
        background: dark ? "#444" : "#ddd",
        color: dark ? "#fff" : "#222",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        zIndex: 999,
      }}
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default ThemeToggle;
