import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FolderHeart,
  Heart,
  Image,
  Palette,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  LayoutDashboard,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ExportPalette from "./ExportPalette.jsx";
import "./SavedPalettes.css";

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadPalettes() {
  try {
    const storedPalettes = JSON.parse(localStorage.getItem("palettes") || "[]");

    if (!Array.isArray(storedPalettes)) {
      return [];
    }

    const normalizedPalettes = storedPalettes.map((palette, index) => ({
      id: palette.id || `legacy-${Date.now()}-${index}`,
      name: palette.name || `Untitled palette ${index + 1}`,
      colors: Array.isArray(palette.colors) ? palette.colors : [],
      source: palette.source || "generator",
      favorite: Boolean(palette.favorite),
      designSystem:
        palette.designSystem && typeof palette.designSystem === "object"
          ? palette.designSystem
          : null,
      createdAt: palette.createdAt || new Date(0).toISOString(),
    }));

    localStorage.setItem("palettes", JSON.stringify(normalizedPalettes));

    return normalizedPalettes;
  } catch {
    return [];
  }
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime()) || date.getFullYear() === 1970) {
    return "Saved palette";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function SavedPalettes() {
  const navigate = useNavigate();

  const [palettes, setPalettes] = useState(loadPalettes);

  const [searchQuery, setSearchQuery] = useState("");

  const [sortOrder, setSortOrder] = useState("newest");

  const [editingId, setEditingId] = useState(null);

  const [editingName, setEditingName] = useState("");

  const [copiedValue, setCopiedValue] = useState("");

  const [paletteToExport, setPaletteToExport] = useState(null);

  const [notice, setNotice] = useState("");

  const savePalettes = (updatedPalettes) => {
    setPalettes(updatedPalettes);

    localStorage.setItem("palettes", JSON.stringify(updatedPalettes));
  };

  const showNotice = (message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 1800);
  };

  const toggleFavorite = (paletteId) => {
    const updatedPalettes = palettes.map((palette) =>
      palette.id === paletteId
        ? {
            ...palette,
            favorite: !palette.favorite,
          }
        : palette,
    );

    savePalettes(updatedPalettes);
  };

  const startRenaming = (palette) => {
    setEditingId(palette.id);
    setEditingName(palette.name);
  };

  const cancelRenaming = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveNewName = (paletteId) => {
    const trimmedName = editingName.trim();

    if (!trimmedName) {
      return;
    }

    const updatedPalettes = palettes.map((palette) =>
      palette.id === paletteId
        ? {
            ...palette,
            name: trimmedName,
          }
        : palette,
    );

    savePalettes(updatedPalettes);
    cancelRenaming();
    showNotice("Palette renamed");
  };

  const duplicatePalette = (palette) => {
    const duplicatedPalette = {
      ...palette,
      id: generateId(),
      name: `${palette.name} copy`,
      favorite: false,
      createdAt: new Date().toISOString(),
    };

    savePalettes([duplicatedPalette, ...palettes]);

    showNotice("Palette duplicated");
  };

  const deletePalette = (paletteId) => {
    const palette = palettes.find((item) => item.id === paletteId);

    const shouldDelete = window.confirm(
      `Delete "${palette?.name || "this palette"}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    const updatedPalettes = palettes.filter((item) => item.id !== paletteId);

    savePalettes(updatedPalettes);
    showNotice("Palette deleted");
  };

  const copyColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color);

      setCopiedValue(color);
      showNotice(`${color} copied`);

      window.setTimeout(() => {
        setCopiedValue("");
      }, 1000);
    } catch {
      showNotice("Copy is not available");
    }
  };

  const copyEntirePalette = async (palette) => {
    try {
      const paletteValue = palette.colors.join(", ");

      await navigator.clipboard.writeText(paletteValue);

      setCopiedValue(palette.id);
      showNotice("Palette values copied");

      window.setTimeout(() => {
        setCopiedValue("");
      }, 1000);
    } catch {
      showNotice("Copy is not available");
    }
  };

  const openExport = (palette) => {
    setPaletteToExport(palette);
  };

  const closeExport = () => {
    setPaletteToExport(null);
  };

  const sendToAccessibility = (palette) => {
    navigate("/accessibility", {
      state: {
        palette: {
          name: palette.name,
          colors: palette.colors,
        },
      },
    });
  };

  const sendToPreview = (palette) => {
    navigate("/preview", {
      state: {
        palette: {
          id: palette.id,
          name: palette.name,
          colors: palette.colors,
          designSystem: palette.designSystem || null,
        },
      },
    });
  };

  const visiblePalettes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredPalettes = palettes.filter((palette) => {
      const matchesName = palette.name.toLowerCase().includes(normalizedQuery);

      const matchesColor = palette.colors.some((color) =>
        color.toLowerCase().includes(normalizedQuery),
      );

      return matchesName || matchesColor;
    });

    return [...filteredPalettes].sort((first, second) => {
      if (sortOrder === "favorites") {
        if (first.favorite !== second.favorite) {
          return first.favorite ? -1 : 1;
        }

        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      }

      if (sortOrder === "oldest") {
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
      }

      if (sortOrder === "alphabetical") {
        return first.name.localeCompare(second.name);
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }, [palettes, searchQuery, sortOrder]);

  return (
    <>
      <main className="library-page">
        <div className="library-heading">
          <div>
            <span className="library-kicker">Palette library</span>

            <h1>Your saved color directions</h1>

            <p>Search, organize, export and reuse every palette you save.</p>
          </div>

          <div className="library-counter">
            <FolderHeart size={16} aria-hidden="true" />

            <span>
              {palettes.length} {palettes.length === 1 ? "palette" : "palettes"}
            </span>
          </div>
        </div>

        {palettes.length > 0 && (
          <section className="library-toolbar">
            <div className="library-search">
              <Search size={17} aria-hidden="true" />

              <input
                type="search"
                placeholder="Search palettes or HEX values"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search saved palettes"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="library-sort">
              <label htmlFor="palette-sort">Sort by</label>

              <select
                id="palette-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest first</option>

                <option value="oldest">Oldest first</option>

                <option value="favorites">Favorites first</option>

                <option value="alphabetical">Name A–Z</option>
              </select>
            </div>
          </section>
        )}

        {palettes.length === 0 ? (
          <section className="library-empty">
            <span className="library-empty__icon">
              <FolderHeart size={30} aria-hidden="true" />
            </span>

            <h2>Your library is empty</h2>

            <p>
              Generate a palette or extract colors from an image, then save your
              favorite direction here.
            </p>

            <div className="library-empty__actions">
              <Link className="library-primary-link" to="/generate">
                <Palette size={17} aria-hidden="true" />
                Generate palette
              </Link>

              <Link className="library-secondary-link" to="/from-image">
                <Image size={17} aria-hidden="true" />
                Extract from image
              </Link>
            </div>
          </section>
        ) : visiblePalettes.length === 0 ? (
          <section className="library-empty library-empty--search">
            <span className="library-empty__icon">
              <Search size={28} aria-hidden="true" />
            </span>

            <h2>No palettes found</h2>

            <p>Try searching for another name or HEX value.</p>

            <button type="button" onClick={() => setSearchQuery("")}>
              Clear search
            </button>
          </section>
        ) : (
          <section className="library-grid">
            {visiblePalettes.map((palette) => (
              <article className="library-card" key={palette.id}>
                <div
                  className="library-swatches"
                  style={{
                    "--library-color-count": palette.colors.length,
                  }}
                >
                  {palette.colors.map((color, index) => (
                    <button
                      type="button"
                      className="library-swatch"
                      key={`${palette.id}-${color}-${index}`}
                      style={{
                        backgroundColor: color,
                      }}
                      onClick={() => copyColor(color)}
                      aria-label={`Copy color ${color}`}
                      title={`Copy ${color}`}
                    >
                      <span>
                        {copiedValue === color ? (
                          <Check size={15} aria-hidden="true" />
                        ) : (
                          <Copy size={15} aria-hidden="true" />
                        )}

                        {color}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="library-card__content">
                  <div className="library-card__top">
                    <div className="library-card__identity">
                      {editingId === palette.id ? (
                        <div className="library-rename">
                          <input
                            type="text"
                            value={editingName}
                            autoFocus
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                saveNewName(palette.id);
                              }

                              if (event.key === "Escape") {
                                cancelRenaming();
                              }
                            }}
                            aria-label="New palette name"
                          />

                          <button
                            type="button"
                            onClick={() => saveNewName(palette.id)}
                            aria-label="Save new name"
                          >
                            <Check size={16} aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={cancelRenaming}
                            aria-label="Cancel renaming"
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2>{palette.name}</h2>

                          <div className="library-card__metadata">
                            <span>
                              {palette.source === "image"
                                ? "Extracted"
                                : "Generated"}
                            </span>

                            <span aria-hidden="true">·</span>

                            <span>{palette.colors.length} colors</span>

                            <span aria-hidden="true">·</span>

                            <span>
                              {formatDate(palette.createdAt)}
                              {palette.designSystem && (
                                <>
                                  <span aria-hidden="true">·</span>

                                  <span>Design system configured</span>
                                </>
                              )}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`favorite-button ${
                        palette.favorite ? "favorite-button--active" : ""
                      }`}
                      onClick={() => toggleFavorite(palette.id)}
                      aria-label={
                        palette.favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      title={
                        palette.favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Heart
                        size={18}
                        fill={palette.favorite ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="library-card__actions">
                    <button
                      type="button"
                      onClick={() => copyEntirePalette(palette)}
                    >
                      {copiedValue === palette.id ? (
                        <Check size={16} aria-hidden="true" />
                      ) : (
                        <Copy size={16} aria-hidden="true" />
                      )}
                      Copy
                    </button>

                    <button type="button" onClick={() => openExport(palette)}>
                      <Download size={16} aria-hidden="true" />
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={() => sendToPreview(palette)}
                    >
                      <LayoutDashboard size={16} aria-hidden="true" />
                      Preview UI
                    </button>

                    <button
                      type="button"
                      onClick={() => sendToAccessibility(palette)}
                    >
                      <ShieldCheck size={16} aria-hidden="true" />
                      Check contrast
                    </button>

                    <button
                      type="button"
                      onClick={() => startRenaming(palette)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Rename
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicatePalette(palette)}
                    >
                      <Copy size={16} aria-hidden="true" />
                      Duplicate
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deletePalette(palette.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <div
          className={`library-toast ${notice ? "library-toast--visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          <Check size={16} aria-hidden="true" />
          {notice}
        </div>
      </main>

      <ExportPalette
        colors={paletteToExport?.colors || []}
        paletteName={paletteToExport?.name || "Saved palette"}
        isOpen={Boolean(paletteToExport)}
        onClose={closeExport}
      />
    </>
  );
}

export default SavedPalettes;
