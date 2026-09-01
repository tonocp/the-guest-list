import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Relative to this script, not the project folder's name — survives a repo rename.
const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public')
const outDir = resolve(publicDir, 'icons')
mkdirSync(outDir, { recursive: true })

// Base icon: dark navy square, pastel 3x3 grid, gold magnifying glass.
function iconSvg(size, { padding = 0 } = {}) {
  const s = size
  const inner = s - padding * 2
  const cell = inner / 3
  const colors = ['#dbe7f7', '#f3ddef', '#d9f0e3', '#fbe7cf', '#e6dff5', '#fdf1c7', '#d9f0e3', '#fbe7cf', '#dbe7f7']

  let cells = ''
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = padding + c * cell
      const y = padding + r * cell
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${colors[r * 3 + c]}" opacity="0.9"/>`
    }
  }

  const glassCx = s * 0.42
  const glassCy = s * 0.42
  const glassR = s * 0.17
  const handleX1 = s * 0.54
  const handleY1 = s * 0.54
  const handleX2 = s * 0.72
  const handleY2 = s * 0.72

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#1f2430"/>
  <g>${cells}</g>
  <rect x="0" y="0" width="${s}" height="${s}" fill="#1f2430" opacity="0.15"/>
  <circle cx="${glassCx}" cy="${glassCy}" r="${glassR}" fill="none" stroke="#f5c542" stroke-width="${s * 0.055}"/>
  <line x1="${handleX1}" y1="${handleY1}" x2="${handleX2}" y2="${handleY2}" stroke="#f5c542" stroke-width="${s * 0.06}" stroke-linecap="round"/>
</svg>`
}

const targets = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  { name: 'maskable-512.png', size: 512, padding: 64 }, // safe-zone padding for maskable icons
  { name: 'apple-touch-icon.png', size: 180, padding: 0 },
]

// Every icon is flattened onto the navy background — no alpha channel. iOS composites a
// transparent apple-touch-icon over black, and install UIs expect opaque app icons.
for (const t of targets) {
  const svg = iconSvg(t.size, { padding: t.padding })
  await sharp(Buffer.from(svg)).flatten({ background: '#1f2430' }).png().toFile(`${outDir}/${t.name}`)
  console.log('wrote', t.name)
}

/** Favicon: a *simplified* variant of the same mark (dark navy, gold magnifying
 * glass, pastel grid), not just iconSvg() at a small size. Measured at real
 * rendered size (16px, the worst case — browser tabs, not just the 192-512px
 * app/home-screen icons above): the 3x3 grid + thin ring from iconSvg() turns into
 * unreadable plaid with a barely-visible circle. A 2x2 grid (bigger cells, fewer of
 * them) and a much thicker ring/handle stays legible from 16px up. */
function faviconSvg(size) {
  const s = size
  const half = s / 2
  const gridColors = ['#dbe7f7', '#f3ddef', '#f3ddef', '#dbe7f7']
  const cx = s * 0.44
  const cy = s * 0.44
  const r = s * 0.24
  const hx1 = s * 0.6
  const hy1 = s * 0.6
  const hx2 = s * 0.84
  const hy2 = s * 0.84
  const cellSize = half * 0.78

  let grid = ''
  const positions = [
    [s * 0.1, s * 0.1],
    [half + s * 0.02, s * 0.1],
    [s * 0.1, half + s * 0.02],
    [half + s * 0.02, half + s * 0.02],
  ]
  positions.forEach(([x, y], i) => {
    grid += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${gridColors[i]}"/>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${s * 0.18}" fill="#1f2430"/>
  ${grid}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1f2430" stroke="#f5c542" stroke-width="${s * 0.15}"/>
  <line x1="${hx1}" y1="${hy1}" x2="${hx2}" y2="${hy2}" stroke="#f5c542" stroke-width="${s * 0.15}" stroke-linecap="round"/>
</svg>`
}

writeFileSync(`${publicDir}/favicon.svg`, faviconSvg(32))
console.log('wrote favicon.svg')
