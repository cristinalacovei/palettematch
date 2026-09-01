import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PaletteGenerator from "./components/PaletteGenerator";
import SavedPalettes from "./components/SavedPalettes";
import ThemeToggle from "./components/ToggleTheme";
import ImagePalette from "./components/ImagePalette";
import HomePage from "./components/HomePage";
import "./App.css";

function App() {
  return (
    <Router>
      <ThemeToggle />

      <nav className="navbar">
        <Link to="/generate" className="nav-link">
          🎨 Generate
        </Link>
        <Link to="/saved" className="nav-link">
          📁 My Palettes
        </Link>
        <Link to="/from-image" className="nav-link">
          🎞️ From Image
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<PaletteGenerator />} />
        <Route path="/saved" element={<SavedPalettes />} />
        <Route path="/from-image" element={<ImagePalette />} />
      </Routes>
    </Router>
  );
}

export default App;
