import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const outDir = '/Users/tonocp/DEV/PERSONAL/MurDoku/public/icons'
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
]

for (const t of targets) {
  const svg = iconSvg(t.size, { padding: t.padding })
  await sharp(Buffer.from(svg)).png().toFile(`${outDir}/${t.name}`)
  console.log('wrote', t.name)
}

// Apple touch icon (no transparency, standard size)
const appleSvg = iconSvg(180, { padding: 0 })
await sharp(Buffer.from(appleSvg)).png().toFile(`${outDir}/apple-touch-icon.png`)
console.log('wrote apple-touch-icon.png')
