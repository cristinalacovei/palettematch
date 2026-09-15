import React, { useState } from "react";
import { Check, Copy, Lock, Pencil, Unlock } from "lucide-react";

function ColorBox({ color, index, locked = false, onToggleLock, onEditColor }) {
  const [copied, setCopied] = useState(false);

  const copyColor = async () => {
    try {
      await navigator.clipboard.writeText(color);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch {
      setCopied(false);
    }
  };

  const toggleLock = () => {
    if (onToggleLock) {
      onToggleLock(index);
    }
  };

  const openEditor = () => {
    if (onEditColor) {
      onEditColor(index);
    }
  };

  return (
    <article className={`color-card ${locked ? "color-card--locked" : ""}`}>
      <div
        className="color-card__tone"
        style={{
          backgroundColor: color,
        }}
      >
        {onToggleLock && (
          <button
            type="button"
            className={`color-card__lock ${
              locked ? "color-card__lock--active" : ""
            }`}
            onClick={toggleLock}
            aria-label={
              locked ? `Unlock color ${color}` : `Lock color ${color}`
            }
            title={
              locked ? "Unlock this color" : "Keep this color when regenerating"
            }
          >
            {locked ? <Lock size={16} /> : <Unlock size={16} />}

            <span>{locked ? "Locked" : "Lock"}</span>
          </button>
        )}

        {onEditColor && (
          <button
            type="button"
            className="color-card__edit"
            onClick={openEditor}
            aria-label={`Edit color ${color}`}
            title="Edit HEX, RGB or HSL"
          >
            <Pencil size={16} />

            <span>Edit</span>
          </button>
        )}

        <button
          type="button"
          className="color-card__copy"
          onClick={copyColor}
          aria-label={`Copy color ${color}`}
          title={`Copy ${color}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}

          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="color-card__meta">
        <span>Color {String(index + 1).padStart(2, "0")}</span>

        <code>{color}</code>

        {locked && (
          <small className="color-card__locked-label">
            Preserved when generating
          </small>
        )}
      </div>
    </article>
  );
}

export default ColorBox;
