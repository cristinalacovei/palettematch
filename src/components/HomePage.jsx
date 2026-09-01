import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    const updateTheme = () => {
      setDarkMode(localStorage.getItem("theme") === "dark");
    };

    // Listen for theme changes
    window.addEventListener("themeChange", updateTheme);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("themeChange", updateTheme);
    };
  }, []);

  const containerStyle = {
    textAlign: "center",
    padding: "80px 20px",
    background: darkMode
      ? "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)"
      : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #e8e8f5 100%)",
    minHeight: "100vh",
    color: darkMode ? "#f5f5f5" : "#222",
    fontFamily: "'Segoe UI', sans-serif",
    transition: "all 0.3s ease-in-out",
    backgroundAttachment: "fixed",
    position: "relative",
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

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>✨ Welcome to the World of Colors!</h1>
      <p style={descriptionStyle}>
        Create, explore, and save color palettes that inspire you. Generate
        random palettes, extract colors from images, or revisit your favorite
        collection of colors.
      </p>

      <div style={buttonContainerStyle}>
        <Link to="/from-image" style={linkStyle}>
          <button className="home-button">🎞️ Extract from Image</button>
        </Link>
        <Link to="/saved" style={linkStyle}>
          <button className="home-button">📁 My Palettes</button>
        </Link>
        <Link to="/generate" style={linkStyle}>
          <button className="home-button">🎨 Generate Random</button>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
