export function downloadTextFile({ content, filename, mimeType = "text/plain" }) {
  const file = new Blob([content], {
    type: `${mimeType};charset=utf-8`,
  });
  const downloadUrl = window.URL.createObjectURL(file);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(downloadUrl);
}
