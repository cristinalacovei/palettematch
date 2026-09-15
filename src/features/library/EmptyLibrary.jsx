import React from "react";
import { FolderHeart, Image, Palette, Search } from "lucide-react";
import { Link } from "react-router-dom";

function EmptyLibrary({ hasSearch, onClearSearch }) {
  if (hasSearch) {
    return (
      <section className="library-empty library-empty--search">
        <span className="library-empty__icon">
          <Search size={28} aria-hidden="true" />
        </span>

        <h2>No palettes found</h2>
        <p>Try searching for another name or HEX value.</p>

        <button type="button" onClick={onClearSearch}>
          Clear search
        </button>
      </section>
    );
  }

  return (
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
  );
}

export default EmptyLibrary;
