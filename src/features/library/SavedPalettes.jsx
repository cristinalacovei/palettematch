import React, { useMemo, useState } from "react";
import { Check, FolderHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ExportPalette from "../export/ExportPalette";
import { generateId } from "../../utils/idUtils";
import {
  loadPalettes,
  savePalettes as savePalettesToStorage,
} from "../../services/paletteStorage";
import LibraryToolbar from "./LibraryToolbar";
import EmptyLibrary from "./EmptyLibrary";
import PaletteCard from "./PaletteCard";
import "./SavedPalettes.css";

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

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const persistPalettes = (updatedPalettes) => {
    if (!savePalettesToStorage(updatedPalettes)) {
      showNotice("The library could not be updated");
      return false;
    }

    setPalettes(updatedPalettes);
    return true;
  };

  const toggleFavorite = (paletteId) => {
    persistPalettes(
      palettes.map((palette) =>
        palette.id === paletteId
          ? { ...palette, favorite: !palette.favorite }
          : palette,
      ),
    );
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
    if (!trimmedName) return;

    if (
      persistPalettes(
        palettes.map((palette) =>
          palette.id === paletteId
            ? { ...palette, name: trimmedName }
            : palette,
        ),
      )
    ) {
      cancelRenaming();
      showNotice("Palette renamed");
    }
  };

  const duplicatePalette = (palette) => {
    const duplicatedPalette = {
      ...palette,
      id: generateId(),
      name: `${palette.name} copy`,
      colors: [...palette.colors],
      favorite: false,
      designSystem: palette.designSystem
        ? { ...palette.designSystem }
        : null,
      createdAt: new Date().toISOString(),
    };

    if (persistPalettes([duplicatedPalette, ...palettes])) {
      showNotice("Palette duplicated");
    }
  };

  const deletePalette = (paletteId) => {
    const palette = palettes.find((item) => item.id === paletteId);
    if (!window.confirm(`Delete "${palette?.name || "this palette"}"?`)) {
      return;
    }

    if (persistPalettes(palettes.filter((item) => item.id !== paletteId))) {
      showNotice("Palette deleted");
    }
  };

  const copyColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedValue(color);
      showNotice(`${color} copied`);
      window.setTimeout(() => setCopiedValue(""), 1000);
    } catch {
      showNotice("Copy is not available");
    }
  };

  const copyEntirePalette = async (palette) => {
    try {
      await navigator.clipboard.writeText(palette.colors.join(", "));
      setCopiedValue(palette.id);
      showNotice("Palette values copied");
      window.setTimeout(() => setCopiedValue(""), 1000);
    } catch {
      showNotice("Copy is not available");
    }
  };

  const sendToAccessibility = (palette) => {
    navigate("/accessibility", {
      state: { palette: { name: palette.name, colors: palette.colors } },
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
          <LibraryToolbar
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSearchChange={setSearchQuery}
            onSortChange={setSortOrder}
          />
        )}

        {palettes.length === 0 ? (
          <EmptyLibrary hasSearch={false} />
        ) : visiblePalettes.length === 0 ? (
          <EmptyLibrary
            hasSearch
            onClearSearch={() => setSearchQuery("")}
          />
        ) : (
          <section className="library-grid">
            {visiblePalettes.map((palette) => (
              <PaletteCard
                key={palette.id}
                palette={{ ...palette, formattedDate: formatDate(palette.createdAt) }}
                editing={editingId === palette.id}
                editingName={editingName}
                copiedValue={copiedValue}
                onCopyColor={copyColor}
                onToggleFavorite={toggleFavorite}
                onNameChange={setEditingName}
                onSaveName={saveNewName}
                onCancelRename={cancelRenaming}
                onStartRename={startRenaming}
                onCopyPalette={copyEntirePalette}
                onExport={setPaletteToExport}
                onPreview={sendToPreview}
                onAccessibility={sendToAccessibility}
                onDuplicate={duplicatePalette}
                onDelete={deletePalette}
              />
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
        onClose={() => setPaletteToExport(null)}
      />
    </>
  );
}

export default SavedPalettes;
