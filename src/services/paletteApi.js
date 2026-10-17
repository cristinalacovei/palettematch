import { apiRequest } from "./apiClient";

export function getPalettes() {
  return apiRequest("/api/palettes");
}

export function getPalette(paletteId) {
  return apiRequest(`/api/palettes/${paletteId}`);
}

export function createPalette(data) {
  return apiRequest("/api/palettes", {
    method: "POST",
    body: data,
  });
}

export function updatePalette(paletteId, data) {
  return apiRequest(`/api/palettes/${paletteId}`, {
    method: "PUT",
    body: data,
  });
}

export function deletePalette(paletteId) {
  return apiRequest(`/api/palettes/${paletteId}`, {
    method: "DELETE",
  });
}

export function updateDesignSystem(paletteId, designSystem) {
  return apiRequest(`/api/palettes/${paletteId}/design-system`, {
    method: "PUT",
    body: designSystem,
  });
}
