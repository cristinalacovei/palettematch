import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PaletteGenerator from "./components/PaletteGenerator";
import SavedPalettes from "./components/SavedPalettes";
import ImagePalette from "./components/ImagePalette";
import HomePage from "./components/HomePage";
import AppHeader from "./components/AppHeader";
import AccessibilityChecker from "./components/AccessibilityChecker";
import PaletteUIPreview from "./components/PaletteUIPreview";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <AppHeader />

        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/generate" element={<PaletteGenerator />} />

          <Route path="/from-image" element={<ImagePalette />} />

          <Route path="/accessibility" element={<AccessibilityChecker />} />

          <Route path="/preview" element={<PaletteUIPreview />} />

          <Route path="/saved" element={<SavedPalettes />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
