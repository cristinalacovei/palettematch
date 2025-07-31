# 🎨 Color Palette App

A modern React application that lets you:

- Generate random color palettes
- Save your favorite palettes
- Extract dominant colors from images
- Toggle dark mode
- Navigate through a clean interface using routing

## 🔧 Features

- ✅ Generate color palettes
- ✅ Save palettes locally with custom names
- ✅ Extract colors from uploaded images (using `color-thief`)
- ✅ Dark mode toggle with persistence (`localStorage`)
- ✅ Multi-page navigation via React Router

---

## ▶️ Run the App Locally

1. Clone the repository:

```bash
git clone https://github.com/username/color-palette-app.git
cd color-palette-app
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to view the app in your browser.

---

## 🚀 Build for Production

```bash
npm run build
```

This command will create a `build/` folder ready for deployment.

---

## 🗂️ File Structure

```
src/
├── components/
│   ├── PaletteGenerator.jsx
│   ├── SavedPalettes.jsx
│   ├── ImagePalette.jsx
│   ├── HomePage.jsx
│   └── ToggleTheme.jsx
├── App.jsx
├── index.js
└── App.css / PaletteGenerator.css
```

---

## 🔮 Tech Stack

- React
- React Router
- localStorage
- color-thief
- Modern CSS

---

## 🧠 Future Ideas

- Export palettes as `.json` or `.png`
- Integration with color trend APIs
- Public palette gallery
- User accounts (Firebase or other backend)
