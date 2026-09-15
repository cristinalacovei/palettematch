export const ROLE_OPTIONS = [
  {
    key: "background",
    label: "Background",
    description: "Main application background",
  },
  {
    key: "surface",
    label: "Surface",
    description: "Cards and elevated areas",
  },
  {
    key: "text",
    label: "Text",
    description: "Headings and body content",
  },
  {
    key: "primary",
    label: "Primary",
    description: "Buttons and main actions",
  },
  {
    key: "accent",
    label: "Accent",
    description: "Highlights and secondary details",
  },
];

export const COLOR_SYSTEM_ROLE_KEYS = ROLE_OPTIONS.map((role) => role.key);
