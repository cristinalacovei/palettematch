import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function HomePage() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const updateTheme = () => {
      setDarkMode(localStorage.getItem("theme") === "dark");
    };

    // Ascultă schimbarea temei
    window.addEventListener("themeChange", updateTheme);

    // Curățare la demontare
    return () => {
      window.removeEventListener("themeChange", updateTheme);
    };
  }, []);

  const containerStyle = {
    textAlign: "center",
    padding: "60px 20px",
    background: darkMode
      ? "linear-gradient(135deg, #1f1f2f 0%, #2a1a40 50%, #2c2c2c 100%)"
      : "linear-gradient(135deg, #f2f2f2 0%, #eae6f9 50%, #f8f8ff 100%)",
    minHeight: "100vh",
    color: darkMode ? "#f5f5f5" : "#222",
    fontFamily: "'Segoe UI', sans-serif",
    transition: "all 0.3s ease-in-out",
  };

  const titleStyle = {
    fontSize: "3rem",
    marginBottom: "20px",
    background: "linear-gradient(to right, #FF6B6B, #7A4FFF)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const descriptionStyle = {
    fontSize: "1.2rem",
    maxWidth: "700px",
    margin: "0 auto",
    opacity: 0.9,
    lineHeight: "1.6",
  };

  const buttonContainerStyle = {
    marginTop: "50px",
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    flexWrap: "wrap",
  };

  const linkStyle = {
    textDecoration: "none",
  };

  const buttonStyle = {
    padding: "15px 30px",
    borderRadius: "12px",
    fontSize: "1.1rem",
    backgroundColor: "#7A4FFF",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    boxShadow: darkMode
      ? "0 4px 10px rgba(0, 0, 0, 0.3)"
      : "0 4px 10px rgba(0, 0, 0, 0.15)",
    transition: "transform 0.2s, background 0.3s",
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>✨ Bine ai venit în lumea culorilor!</h1>
      <p style={descriptionStyle}>
        Creează, explorează și salvează palete de culori care te inspiră. Poți
        genera aleatoriu, extrage din imagini sau reveni la colecția ta
        preferată de nuanțe.
      </p>

      <div style={buttonContainerStyle}>
        <Link to="/din-imagine" style={linkStyle}>
          <button style={buttonStyle}>🎞️ Extrage din imagine</button>
        </Link>
        <Link to="/salvate" style={linkStyle}>
          <button style={buttonStyle}>📁 Paletele mele</button>
        </Link>
        <Link to="/genereaza" style={linkStyle}>
          <button style={buttonStyle}>🎨 Generează aleatoriu</button>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
