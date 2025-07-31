import React, { useState } from "react";

function ColorBox({ color }) {
  const [copied, setCopied] = useState(false);

  const copyColor = () => {
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div
      onClick={copyColor}
      className="color-box"
      style={{ backgroundColor: color }}
      title="Click pentru a copia HEX"
    >
      {copied ? "Copiat!" : color}
    </div>
  );
}

export default ColorBox;
