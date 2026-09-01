import React from "react";
import { ArrowRight, FolderHeart, Image, Palette, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import "./HomePage.css";

const previewColors = [
  { hex: "#171933", name: "Ink" },
  { hex: "#5B5CE2", name: "Primary" },
  { hex: "#9C8CFF", name: "Accent" },
  { hex: "#D7D0FF", name: "Soft" },
  { hex: "#F5F3FF", name: "Canvas" },
];

const capabilities = [
  {
    icon: Palette,
    title: "Generate with intention",
    copy: "Start from one color and build balanced harmonies in seconds.",
    to: "/generate",
    link: "Open generator",
  },
  {
    icon: Image,
    title: "Extract from images",
    copy: "Turn visual references into a clean, reusable color palette.",
    to: "/from-image",
    link: "Upload an image",
  },
  {
    icon: FolderHeart,
    title: "Keep your best work",
    copy: "Save promising directions and return to them whenever you need.",
    to: "/saved",
    link: "View library",
  },
];

function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <div className="eyebrow">
            <Sparkles size={15} />
            Color design workspace
          </div>
          <h1>Build palettes that work beyond the moodboard.</h1>
          <p>
            Create harmonious color systems, extract inspiration from images,
            and keep every direction organized in one focused workspace.
          </p>

          <div className="hero-actions">
            <Link className="button button--primary" to="/generate">
              Start creating
              <ArrowRight size={17} />
            </Link>
            <Link className="button button--secondary" to="/from-image">
              Extract from image
            </Link>
          </div>

          <div className="hero-note">
            <span className="hero-note__dot" />
            Free to use. Your palettes stay in your browser.
          </div>
        </div>

        <div className="palette-showcase" aria-label="Example PaletteMatch palette">
          <div className="showcase-header">
            <div>
              <span className="showcase-kicker">Current palette</span>
              <strong>Quiet confidence</strong>
            </div>
            <span className="showcase-chip">Analog</span>
          </div>

          <div className="showcase-swatches">
            {previewColors.map((color) => (
              <div className="showcase-swatch" key={color.hex}>
                <div style={{ backgroundColor: color.hex }} />
                <span>{color.name}</span>
                <code>{color.hex}</code>
              </div>
            ))}
          </div>

          <div className="showcase-footer">
            <div className="avatar-stack" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>5 balanced colors</span>
            <span className="showcase-score">Analog harmony</span>
          </div>
        </div>
      </section>

      <section className="capability-grid" aria-label="PaletteMatch tools">
        {capabilities.map(({ icon: Icon, title, copy, to, link }) => (
          <article className="capability-card" key={title}>
            <div className="capability-icon"><Icon size={20} /></div>
            <h2>{title}</h2>
            <p>{copy}</p>
            <Link to={to}>
              {link}
              <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export default HomePage;
