# PaletteMatch

A color design toolkit for creating, checking, previewing, and exporting accessible color systems.

**[Try the demo](https://palettematch-git-feature-demo-auth-cristina-lacoveis-projects.vercel.app/)** · [Repository](https://github.com/cristinalacovei/palettematch)

> The live demo uses a separate Preview frontend, demo API, and demo database. The existing production deployment is kept separate. Demo data is temporary and should not be used for sensitive information.

## Overview

PaletteMatch helps designers and developers turn a color palette into a practical interface theme. It combines color exploration with accessibility checks, semantic design-system roles, UI previews, and developer-friendly exports.

The app supports two ways to save palettes:

- **Without signing in:** palettes are saved locally in the browser using `localStorage`.
- **In the hosted demo:** sign in with the demo password to save palettes to the demo API. Each successful sign-in creates an isolated demo identity, so demo users do not share saved palettes.

## Features

### Palette generator

- Generate six color harmonies: Analog, Complementary, Triadic, Tetradic, Monochromatic, and Split complementary.
- Choose a base color and lock colors before generating again.
- Edit colors using HEX, RGB, and HSL values.
- Copy color values and save palettes to the library.

### Image palette extraction

- Upload an image and extract dominant colors.
- Create a palette from visual inspiration and save it to the library.

### Palette library

- Search by palette name or HEX value.
- Sort by newest, oldest, favorites, or alphabetical order.
- Favorite, rename, duplicate, and delete palettes.
- Copy colors, export saved palettes, and open them in the accessibility checker or UI preview.

### Accessibility checker

- Calculate color contrast ratios.
- Check WCAG AA and AAA requirements for normal text, large text, and UI components.
- Preview text and buttons, import colors from a saved palette, and choose text/background pairs manually.

### UI preview and design-system builder

- Apply a palette to a dashboard preview.
- Assign semantic roles: Background, Surface, Text, Primary, and Accent.
- Adjust roles manually and inspect important interface color combinations.
- Save design-system mappings with palettes and reopen them later.

### Export

Export saved palettes as:

- CSS custom properties
- SCSS variables
- JSON
- Tailwind configuration

When a palette has a saved design system, exports use semantic names, for example:

```css
:root {
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text: #17181C;
  --color-primary: #5B5CE2;
  --color-accent: #FF6B81;
}
```

## Tech stack

- **Frontend:** React, React Router DOM, JavaScript, CSS
- **Color tools:** Chroma.js, React Color, ColorThief
- **Backend:** Java 21, Spring Boot, Spring Security, Spring Data JPA
- **Database and migrations:** PostgreSQL, Flyway
- **Authentication:** Keycloak for local development; isolated password-based demo login with short-lived RSA-signed JWTs for the hosted demo
- **Deployment:** Vercel (frontend), Render (demo API and demo PostgreSQL database)

## Routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/generate` | Palette generator |
| `/from-image` | Image color extraction |
| `/saved` | Saved palette library |
| `/accessibility` | WCAG contrast checker |
| `/preview` | UI preview and design-system builder |

## Run locally

### Requirements

- Node.js 18 or newer
- Java 21
- Docker Desktop (for the local PostgreSQL and Keycloak services)

### Install the frontend

```bash
git clone https://github.com/cristinalacovei/palettematch.git
cd palettematch
npm install
```

### Start backend services

From the `backend` directory:

```powershell
docker compose up -d
.\mvnw.cmd spring-boot:run
```

The local backend runs at `http://localhost:8080`. The local Keycloak service is available at `http://localhost:8180`.

### Start the frontend

From the repository root, in a separate terminal:

```bash
npm start
```

Open `http://localhost:3000`.

Local development defaults to Keycloak authentication. The frontend authentication mode is selected at build time with `REACT_APP_AUTH_MODE` and defaults to `keycloak`. Copy `.env.example` to `.env.local` if you need to override local settings. The Keycloak URL, realm, and client ID can be configured with `REACT_APP_KEYCLOAK_URL`, `REACT_APP_KEYCLOAK_REALM`, and `REACT_APP_KEYCLOAK_CLIENT_ID`. Local API requests default to `http://localhost:8080`.

### Build the frontend

```bash
npm run build
```

The production files are generated in the `build` folder.

## Deployment notes

The public demo is deployed separately from the existing production environment.

### Vercel frontend

Configure these environment variables for the **Preview** environment only:

```text
REACT_APP_AUTH_MODE=demo
REACT_APP_API_BASE_URL=<public HTTPS URL of the demo Render API>
```

After changing `REACT_APP_*` variables, redeploy the Preview deployment so the values are included in the frontend build. Do not switch the Production Branch or overwrite Production environment variables just to configure the demo.

### Render demo API

The demo API runs from the `feature/demo-auth` branch and uses its own PostgreSQL database. Configure the following on the demo API service only:

- `APP_AUTH_MODE=demo`
- `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` for the separate demo database
- `APP_CORS_ALLOWED_ORIGINS` set to the exact Vercel Preview origin
- `DEMO_PASSWORD_BCRYPT`
- `DEMO_JWT_PRIVATE_KEY_BASE64`
- `DEMO_JWT_PUBLIC_KEY_BASE64`

Use a dedicated RSA key pair for the demo. Keep the database password, BCrypt hash, and signing keys in Render environment variables; never commit them to Git or place backend secrets in Vercel variables. The frontend's `REACT_APP_*` values are embedded in public build assets and must not contain secrets.

The demo access token lasts 15 minutes. Each successful sign-in creates a separate demo identity whose data is scheduled to expire after 30 days. Render's free PostgreSQL databases are temporary and may be deleted at the expiration date shown in the Render dashboard; check the database's Info page before relying on demo data.

## Project structure

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
├── App.js
├── App.css
└── index.css

backend/
└── Spring Boot API, persistence model, migrations, and tests
```

## Future improvements

- Generate a complete theme from user preferences.
- Add a shades generator from `50` to `950`.
- Automatically suggest contrast corrections.
- Add color-blindness simulation.
- Add, remove, and reorder palette colors.
- Expand UI preview templates for landing pages, mobile apps, and e-commerce.
- Add shareable palette links.

## Author

Cristina Iacovei
