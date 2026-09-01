# PaletteMatch

A modern color design toolkit for generating, validating, previewing and exporting accessible color systems.

[Live demo](https://palettematch-beige.vercel.app) · [Repository](https://github.com/cristinalacovei/palettematch)

## Overview

PaletteMatch helps designers and developers move from a simple color palette to a practical, accessible interface theme.

Instead of only generating HEX values, the application lets users:

- generate color harmonies;
- extract colors from images;
- save and organize palettes locally;
- check WCAG contrast;
- preview a palette in a dashboard interface;
- assign semantic design-system roles;
- export palettes as developer-ready code.

All saved data is stored locally in the browser using `localStorage`. No backend or user account is required.

## Features

### Palette generator

- Six harmony types:
  - Analog
  - Complementary
  - Triadic
  - Tetradic
  - Monochromatic
  - Split complementary
- Base color picker
- Lock individual colors before generating again
- Edit colors using HEX, RGB and HSL values
- Copy all color values
- Save palettes to the local library

### Image palette extraction

- Upload an image
- Extract dominant colors
- Create a palette from visual inspiration
- Save the extracted result to the library

### Palette library

- Search by palette name or HEX value
- Sort by newest, oldest, favorites or alphabetical order
- Favorite palettes
- Rename, duplicate and delete palettes
- Copy individual colors or an entire palette
- Export saved palettes
- Open saved palettes in Accessibility Checker or UI Preview

### Accessibility checker

- Calculate contrast ratio between two colors
- WCAG AA and AAA validation
- Separate checks for:
  - normal text;
  - large text;
  - UI components;
- Live text and button preview
- Import all colors from a saved palette
- Automatically select the pair with the strongest contrast
- Manually choose any palette color as text or background

### UI Preview and Design System Builder

- Apply a saved palette to a dashboard preview
- Assign semantic color roles:
  - Background
  - Surface
  - Text
  - Primary
  - Accent
- Modify roles manually
- Check key interface combinations automatically
- Save the design-system mapping back to the palette
- Reopen a palette later with its saved roles

### Export

Saved palettes can be exported as:

- CSS custom properties
- SCSS variables
- JSON
- Tailwind configuration

When a palette has a saved design system, the export uses semantic names:

```css
:root {
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text: #17181C;
  --color-primary: #5B5CE2;
  --color-accent: #FF6B81;
}
```

## Tech Stack

- React
- React Router DOM
- Chroma.js
- React Color
- ColorThief
- Lucide React
- CSS
- Vercel

## Routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/generate` | Palette generator |
| `/from-image` | Image color extraction |
| `/saved` | Saved palette library |
| `/accessibility` | WCAG contrast checker |
| `/preview` | UI Preview and Design System Builder |

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Installation

```bash
git clone https://github.com/cristinalacovei/palettematch.git
cd palettematch
npm install
```

### Run locally

```bash
npm start
```

Open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
```

The production files are generated in the `build` folder.

## Deployment

The project is deployed with Vercel.

A `vercel.json` rewrite rule is used so React Router routes work correctly after a direct refresh:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Project Structure

```text
src/
├── components/
│   ├── AppHeader.jsx
│   ├── AccessibilityChecker.jsx
│   ├── ColorBox.jsx
│   ├── ColorEditor.jsx
│   ├── ExportPalette.jsx
│   ├── HomePage.jsx
│   ├── ImagePalette.jsx
│   ├── PaletteGenerator.jsx
│   ├── PalettePreview.jsx
│   ├── PaletteUIPreview.jsx
│   ├── SavedPalettes.jsx
│   └── ToggleTheme.jsx
│
├── App.js
├── App.css
└── index.css
```

## Future Improvements

- Theme Studio: generate a complete theme from user preferences
- Shades generator from `50` to `950`
- Automatic contrast correction
- Color blindness simulation
- Add, remove and reorder palette colors
- Additional UI Preview templates:
  - landing page;
  - mobile application;
  - e-commerce interface;
- Shareable palette links
- Cloud synchronization with user accounts

## Author

Cristina Iacovei
