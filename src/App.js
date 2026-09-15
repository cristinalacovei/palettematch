import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PaletteGenerator from "./features/generator/PaletteGenerator";
import SavedPalettes from "./features/library/SavedPalettes";
import ImagePalette from "./features/image-extraction/ImagePalette";
import HomePage from "./features/home/HomePage";
import AppHeader from "./components/shared/AppHeader";
import AccessibilityChecker from "./features/accessibility/AccessibilityChecker";
import PaletteUIPreview from "./features/preview/PaletteUIPreview";
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
