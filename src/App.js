import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import PaletteGenerator from "./components/PaletteGenerator";
import SavedPalettes from "./components/SavedPalettes";
import ThemeToggle from "./components/ToggleTheme";
import ImagePalette from "./components/ImagePalette";
import HomePage from "./components/HomePage";
import "./App.css"; // 🔥 importă fișierul cu stilul pentru navbar

function App() {
  return (
    <Router>
      <ThemeToggle />

      <nav className="navbar">
        <Link to="/genereaza" className="nav-link">
          🎨 Generează
        </Link>
        <Link to="/salvate" className="nav-link">
          📁 Paletele mele
        </Link>
        <Link to="/din-imagine" className="nav-link">
          🎞️ Din imagine
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genereaza" element={<PaletteGenerator />} />
        <Route path="/salvate" element={<SavedPalettes />} />
        <Route path="/din-imagine" element={<ImagePalette />} />
      </Routes>
    </Router>
  );
}

export default App;
