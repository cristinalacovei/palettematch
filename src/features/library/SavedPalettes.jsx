import React, { useMemo, useState, useEffect } from "react";
import { Check, FolderHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ExportPalette from "../export/ExportPalette";
import { generateId } from "../../utils/idUtils";
import { savePalettes as savePalettesToStorage } from "../../services/paletteStorage";
import {
  createPalette,
  deletePalette as deleteRemotePalette,
  getPalettes,
  updateDesignSystem as updateRemotePaletteDesignSystem,
  updatePalette as updateRemotePalette,
} from "../../services/paletteApi";
import LibraryToolbar from "./LibraryToolbar";
import EmptyLibrary from "./EmptyLibrary";
import PaletteCard from "./PaletteCard";
import "./SavedPalettes.css";

import { useAuth } from "../../auth/AuthContext";

import { loadPalettes as loadLocalPalettes } from "../../services/paletteStorage";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [copiedValue, setCopiedValue] = useState("");
  const [paletteToExport, setPaletteToExport] = useState(null);
  const [notice, setNotice] = useState("");
  const { authenticated, isReady } = useAuth();

  const [palettes, setPalettes] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let cancelled = false;

    async function loadLibrary() {
      setIsLoading(true);
      setLoadError("");

      try {
        const loadedPalettes = authenticated
          ? await getPalettes()
          : loadLocalPalettes();

        if (!cancelled) {
          setPalettes(loadedPalettes || []);
        }
      } catch (error) {
        console.error("Could not load palettes.", error);

        if (!cancelled) {
          setLoadError("Your palette library could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, [authenticated, isReady]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  const persistLocalPalettes = (updatedPalettes) => {
    if (!savePalettesToStorage(updatedPalettes)) {
      showNotice("The library could not be updated");
      return false;
    }

    setPalettes(updatedPalettes);
    return true;
  };

  const replacePalette = (updatedPalette) => {
    setPalettes((currentPalettes) =>
      currentPalettes.map((palette) =>
        palette.id === updatedPalette.id ? updatedPalette : palette,
      ),
    );
  };

  const toggleFavorite = async (paletteId) => {
    const palette = palettes.find((item) => item.id === paletteId);
    if (!palette) return;

    const updates = {
      name: palette.name,
      colors: palette.colors,
      favorite: !palette.favorite,
    };

    if (authenticated) {
      try {
        const updatedPalette = await updateRemotePalette(paletteId, updates);
        replacePalette(updatedPalette);
      } catch (error) {
        console.error("Could not update palette favorite.", error);
        showNotice("Could not update palette");
      }
      return;
    }

    persistLocalPalettes(
      palettes.map((item) =>
        item.id === paletteId ? { ...item, favorite: updates.favorite } : item,
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

  const saveNewName = async (paletteId) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;

    const palette = palettes.find((item) => item.id === paletteId);
    if (!palette) return;

    if (authenticated) {
      try {
        const updatedPalette = await updateRemotePalette(paletteId, {
          name: trimmedName,
          colors: palette.colors,
          favorite: palette.favorite,
        });
        replacePalette(updatedPalette);
        cancelRenaming();
        showNotice("Palette renamed");
      } catch (error) {
        console.error("Could not rename palette.", error);
        showNotice("Could not update palette");
      }
      return;
    }

    if (
      persistLocalPalettes(
        palettes.map((item) =>
          item.id === paletteId ? { ...item, name: trimmedName } : item,
        ),
      )
    ) {
      cancelRenaming();
      showNotice("Palette renamed");
    }
  };

  const duplicatePalette = async (palette) => {
    if (authenticated) {
      try {
        const duplicatedPalette = await createPalette({
          name: `${palette.name} copy`,
          colors: palette.colors,
          source: palette.source,
          favorite: false,
          designSystem: null,
        });

        let completedPalette = duplicatedPalette;
        if (palette.designSystem) {
          completedPalette = await updateRemotePaletteDesignSystem(
            duplicatedPalette.id,
            {
              background: palette.designSystem.background,
              surface: palette.designSystem.surface,
              text: palette.designSystem.text,
              primary: palette.designSystem.primary,
              accent: palette.designSystem.accent,
            },
          );
        }

        setPalettes((currentPalettes) => [completedPalette, ...currentPalettes]);
        showNotice("Palette duplicated");
      } catch (error) {
        console.error("Could not duplicate palette.", error);
        showNotice("Could not save palette");
      }
      return;
    }

    const duplicatedPalette = {
      ...palette,
      id: generateId(),
      name: `${palette.name} copy`,
      colors: [...palette.colors],
      favorite: false,
      designSystem: palette.designSystem ? { ...palette.designSystem } : null,
      createdAt: new Date().toISOString(),
    };

    if (persistLocalPalettes([duplicatedPalette, ...palettes])) {
      showNotice("Palette duplicated");
    }
  };

  const deletePalette = async (paletteId) => {
    const palette = palettes.find((item) => item.id === paletteId);
    if (!window.confirm(`Delete "${palette?.name || "this palette"}"?`)) {
      return;
    }

    if (authenticated) {
      try {
        await deleteRemotePalette(paletteId);
        setPalettes((currentPalettes) =>
          currentPalettes.filter((item) => item.id !== paletteId),
        );
        showNotice("Palette deleted");
      } catch (error) {
        console.error("Could not delete palette.", error);
        showNotice("Could not delete palette");
      }
      return;
    }

    if (persistLocalPalettes(palettes.filter((item) => item.id !== paletteId))) {
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

        {isLoading ? (
          <p>Loading your palette library...</p>
        ) : loadError ? (
          <p>{loadError}</p>
        ) : palettes.length === 0 ? (
          <EmptyLibrary hasSearch={false} />
        ) : visiblePalettes.length === 0 ? (
          <EmptyLibrary hasSearch onClearSearch={() => setSearchQuery("")} />
        ) : (
          <section className="library-grid">
            {visiblePalettes.map((palette) => (
              <PaletteCard
                key={palette.id}
                palette={{
                  ...palette,
                  formattedDate: formatDate(palette.createdAt),
                }}
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
