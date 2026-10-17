import React from "react";
import { Search, X } from "lucide-react";

function LibraryToolbar({ searchQuery, sortOrder, onSearchChange, onSortChange }) {
  return (
    <section className="library-toolbar">
      <div className="library-search">
        <Search size={17} aria-hidden="true" />

        <input
          type="search"
          placeholder="Search palettes or HEX values"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search saved palettes"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
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
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="favorites">Favorites first</option>
          <option value="alphabetical">Name A–Z</option>
        </select>
      </div>
    </section>
  );
}

export default LibraryToolbar;
