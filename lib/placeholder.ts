// Dummy gardırop öğeleri için ağ gerektirmeyen, satır içi SVG placeholder üretir.

export function svgPlaceholder(label: string, bg: string, fg = "#ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bg}"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="${fg}"
      text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
