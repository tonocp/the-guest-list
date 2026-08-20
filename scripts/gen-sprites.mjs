import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Relative to this script, not the project folder's name — survives a repo rename.
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/sprites')
mkdirSync(OUT_DIR, { recursive: true })

const SIZE = 16
const OUT = 128

// ---- palette --------------------------------------------------------
const DARK = hex('#2a2430')

// Skin tones and hair colors for procedurally-picked suspect faces (see face() below).
const SKIN_TONES = [
  { skin: hex('#f2d3b0'), shadow: hex('#d9ac83') },
  { skin: hex('#d9a875'), shadow: hex('#b8845a') },
  { skin: hex('#a9714a'), shadow: hex('#7d5133') },
  { skin: hex('#6b4530'), shadow: hex('#4a2f20') },
]
const HAIR_COLORS = [
  { hair: hex('#3d3548'), shadow: hex('#2a2434') }, // near-black, kept a shade off DARK so the outline still reads
  { hair: hex('#6b4226'), shadow: hex('#4a2d19') },
  { hair: hex('#d9b64f'), shadow: hex('#b8952f') },
  { hair: hex('#a8532c'), shadow: hex('#7d3c1f') },
  { hair: hex('#cfc8ba'), shadow: hex('#a89e8c') },
]
// Counts mirrored by hand in src/lib/suspectFace.ts, same convention as
// furnitureIcons.ts mirroring the furniture sprite list — see docs/visual-design.md.
const TERRACOTTA = hex('#c96a3c')
const TERRACOTTA_DK = hex('#a8532c')
const LEAF = hex('#4a9c5e')
const LEAF_DK = hex('#357a45')
const LEAF_LT = hex('#6bc47f')
const RUG_A = hex('#c65b7c')
const RUG_B = hex('#e8899f')
const RUG_DK = hex('#9c4460')
const CHAIR = hex('#a9714a')
const CHAIR_DK = hex('#7d5133')
const SHELF = hex('#8b5a3c')
const SHELF_DK = hex('#5f3c24')
const SHELF_BG = hex('#e8ddc8')
const BOOK_RED = hex('#c94f4f')
const BOOK_BLUE = hex('#4f7fc9')
const BOOK_YEL = hex('#d9b64f')
const BOOK_GRN = hex('#4fa876')
const SOFA = hex('#6c8ebf')
const SOFA_DK = hex('#4d6c96')
const SOFA_LT = hex('#93b3de')
const GLASS = hex('#bfe3f0')
const GLASS_LT = hex('#e2f6fc')
const FRAME = hex('#4a4038')
const GOLD = hex('#d4af5a')
const GOLD_DK = hex('#a5813a')
const CANVAS_BG = hex('#ecdcc0')
const LAMP_SHADE = hex('#e8c15a')
const LAMP_GLOW = hex('#fff3c9')
const LAMP_DK = hex('#b8912f')
const TABLE = hex('#9c6b3e')
const TABLE_DK = hex('#7a4f2c')
const TABLE_LT = hex('#c99a68')
const MIRROR_FRAME = hex('#b8935a')
const MIRROR_FRAME_DK = hex('#8a6a3c')
const MIRROR_GLASS = hex('#cfe6ea')
const MIRROR_GLASS_LT = hex('#f0fafb')
const CLOCK_FACE = hex('#f3ecd8')
const CLOCK_RIM = hex('#4a4038')
const VASE_BODY = hex('#5d8a8f')
const VASE_DK = hex('#3f6468')
const VASE_LT = hex('#84b3b8')

// ---- pixel canvas helpers --------------------------------------------
function hex(c) {
  const h = c.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255]
}

function newCanvas(size = SIZE) {
  return Array.from({ length: size }, () => new Array(size).fill(null))
}

function rect(canvas, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x >= 0 && x < canvas.length && y >= 0 && y < canvas.length) canvas[y][x] = color
    }
  }
}

function px(canvas, x, y, color) {
  if (x >= 0 && x < canvas.length && y >= 0 && y < canvas.length) canvas[y][x] = color
}

function circle(canvas, cx, cy, r, color) {
  const size = canvas.length
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5
      const dy = y - cy + 0.5
      if (dx * dx + dy * dy <= r * r) canvas[y][x] = color
    }
  }
}

function outline(canvas, color) {
  const size = canvas.length
  const snapshot = canvas.map((row) => row.slice())
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (snapshot[y][x]) continue
      const hasFilledNeighbor = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([nx, ny]) => nx >= 0 && nx < size && ny >= 0 && ny < size && snapshot[ny][nx])
      if (hasFilledNeighbor) canvas[y][x] = color
    }
  }
}

async function render(canvas, filename) {
  const size = canvas.length
  const buf = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = canvas[y][x] ?? [0, 0, 0, 0]
      const i = (y * size + x) * 4
      buf[i] = c[0]
      buf[i + 1] = c[1]
      buf[i + 2] = c[2]
      buf[i + 3] = c[3]
    }
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 4 } })
    .resize(OUT, OUT, { kernel: 'nearest' })
    .png()
    .toFile(`${OUT_DIR}/${filename}`)
  console.log('wrote', filename)
}

// ---- sprites -----------------------------------------------------------

async function plant() {
  const c = newCanvas()
  rect(c, 4, 12, 11, 14, TERRACOTTA)
  rect(c, 4, 12, 11, 12, TERRACOTTA_DK)
  rect(c, 5, 14, 10, 14, TERRACOTTA_DK)
  circle(c, 7, 7, 4, LEAF)
  circle(c, 4, 9, 2.4, LEAF)
  circle(c, 11, 9, 2.4, LEAF)
  circle(c, 6, 4, 1.6, LEAF_LT)
  circle(c, 9, 6, 1.2, LEAF_DK)
  outline(c, DARK)
  await render(c, 'plant.png')
}

async function rug() {
  const c = newCanvas()
  rect(c, 2, 4, 13, 12, RUG_B)
  rect(c, 3, 5, 12, 11, RUG_A)
  rect(c, 6, 7, 9, 9, RUG_DK)
  rect(c, 7, 8, 8, 8, RUG_B)
  // clip rounded corners
  for (const [x, y] of [
    [2, 4],
    [13, 4],
    [2, 12],
    [13, 12],
  ]) {
    px(c, x, y, null)
  }
  outline(c, DARK)
  await render(c, 'rug.png')
}

async function chair() {
  const c = newCanvas()
  // backrest, seen peeking out from behind the seat
  rect(c, 3, 2, 12, 6, CHAIR_DK)
  rect(c, 4, 3, 11, 5, CHAIR)
  // seat
  rect(c, 3, 7, 12, 12, CHAIR)
  rect(c, 4, 8, 11, 11, CHAIR_DK)
  rect(c, 4, 8, 11, 10, CHAIR)
  // legs poking out under the seat
  rect(c, 3, 13, 4, 14, CHAIR_DK)
  rect(c, 11, 13, 12, 14, CHAIR_DK)
  outline(c, DARK)
  await render(c, 'chair.png')
}

async function bookshelf() {
  const c = newCanvas()
  rect(c, 2, 2, 13, 13, SHELF)
  rect(c, 3, 3, 12, 12, SHELF_BG)
  const books = [BOOK_RED, BOOK_BLUE, BOOK_YEL, BOOK_GRN]
  let i = 0
  for (const rowY of [3, 7]) {
    for (let x = 3; x <= 11; x += 2) {
      rect(c, x, rowY, x, rowY + 3, books[i % books.length])
      i++
    }
  }
  rect(c, 3, 6, 12, 6, SHELF_DK)
  rect(c, 3, 10, 12, 10, SHELF_DK)
  rect(c, 3, 11, 12, 13, SHELF_BG)
  outline(c, DARK)
  await render(c, 'bookshelf.png')
}

async function sofa() {
  const c = newCanvas()
  rect(c, 2, 6, 13, 12, SOFA)
  rect(c, 4, 5, 11, 6, SOFA_DK)
  rect(c, 2, 5, 3, 13, SOFA_DK)
  rect(c, 12, 5, 13, 13, SOFA_DK)
  rect(c, 7, 7, 8, 11, SOFA_LT)
  outline(c, DARK)
  await render(c, 'sofa.png')
}

async function window_() {
  const c = newCanvas()
  rect(c, 2, 2, 13, 13, FRAME)
  rect(c, 3, 3, 7, 7, GLASS)
  rect(c, 8, 3, 12, 7, GLASS)
  rect(c, 3, 8, 7, 12, GLASS)
  rect(c, 8, 8, 12, 12, GLASS)
  rect(c, 4, 4, 5, 5, GLASS_LT)
  rect(c, 9, 4, 10, 5, GLASS_LT)
  rect(c, 4, 9, 5, 10, GLASS_LT)
  rect(c, 9, 9, 10, 10, GLASS_LT)
  rect(c, 7, 2, 8, 13, FRAME)
  rect(c, 2, 7, 13, 8, FRAME)
  outline(c, DARK)
  await render(c, 'window.png')
}

async function painting() {
  const c = newCanvas()
  rect(c, 2, 2, 13, 13, GOLD)
  rect(c, 3, 3, 12, 12, GOLD_DK)
  rect(c, 4, 4, 11, 11, CANVAS_BG)
  rect(c, 4, 9, 11, 9, LEAF_DK)
  for (let x = 5; x <= 9; x++) rect(c, x, 8 - Math.abs(x - 7), x, 8, TERRACOTTA_DK)
  circle(c, 10, 5, 1.4, GOLD)
  outline(c, DARK)
  await render(c, 'painting.png')
}

async function lamp() {
  const c = newCanvas()
  circle(c, 7, 7, 6, LAMP_DK)
  circle(c, 7, 7, 5, LAMP_SHADE)
  circle(c, 7, 7, 2.6, LAMP_GLOW)
  outline(c, DARK)
  await render(c, 'lamp.png')
}

async function table() {
  const c = newCanvas()
  circle(c, 7, 7, 6, TABLE_DK)
  circle(c, 7, 7, 5.3, TABLE)
  circle(c, 5.5, 5.5, 2, TABLE_LT)
  outline(c, DARK)
  await render(c, 'table.png')
}

async function mirror() {
  const c = newCanvas()
  circle(c, 7, 7.5, 6.3, MIRROR_FRAME_DK)
  circle(c, 7, 7.5, 5.4, MIRROR_FRAME)
  circle(c, 7, 7.5, 4.2, MIRROR_GLASS)
  circle(c, 5.5, 5.5, 1.6, MIRROR_GLASS_LT)
  rect(c, 6, 13, 9, 14, MIRROR_FRAME_DK)
  outline(c, DARK)
  await render(c, 'mirror.png')
}

async function clock() {
  const c = newCanvas()
  circle(c, 7, 7, 6, CLOCK_RIM)
  circle(c, 7, 7, 5, CLOCK_FACE)
  rect(c, 7, 3, 7, 7, CLOCK_RIM)
  rect(c, 7, 7, 10, 7, CLOCK_RIM)
  circle(c, 7, 7, 0.8, CLOCK_RIM)
  outline(c, DARK)
  await render(c, 'clock.png')
}

async function vase() {
  const c = newCanvas()
  rect(c, 5, 9, 10, 13, VASE_BODY)
  rect(c, 6, 6, 9, 9, VASE_DK)
  rect(c, 6, 4, 9, 6, VASE_BODY)
  rect(c, 5, 9, 6, 12, VASE_LT)
  circle(c, 5, 3, 1.3, LEAF)
  circle(c, 7.5, 2, 1.3, LEAF_LT)
  circle(c, 10, 3, 1.3, LEAF)
  outline(c, DARK)
  await render(c, 'vase.png')
}

/** A stylized suspect face: skin tone + hair color/style chosen by the caller (see
 * suspectFace.ts for how those are picked deterministically per suspect), rendered on
 * the same 16x16 pixel canvas as everything else. `closedEyes` is used for the
 * victim's face only. */
function face(skin, skinShadow, hair, hairShadow, style, { closedEyes = false } = {}) {
  const c = newCanvas()
  // long hair falls behind the head first, flanking it past the jawline
  if (style === 'long') {
    rect(c, 1, 6, 2, 13, hair)
    rect(c, 13, 6, 14, 13, hair)
    rect(c, 1, 6, 2, 7, hairShadow)
    rect(c, 13, 6, 14, 7, hairShadow)
  }
  // head
  circle(c, 7.5, 8.7, 6, skin)
  rect(c, 3, 12, 12, 13, skinShadow) // chin shading
  // hair cap
  rect(c, 2, 2, 13, 5, hair)
  rect(c, 3, 1, 12, 1, hair)
  rect(c, 2, 5, 13, 5, hairShadow)
  if (style === 'short') {
    rect(c, 2, 6, 3, 8, hair) // side fringe
    rect(c, 12, 6, 13, 8, hair)
  }
  // eyes: open = a round 2x2 dot, closed (victim only) = a thin 1-row line
  if (closedEyes) {
    rect(c, 4, 9, 6, 9, DARK)
    rect(c, 9, 9, 11, 9, DARK)
  } else {
    rect(c, 5, 8, 6, 9, DARK)
    rect(c, 9, 8, 10, 9, DARK)
  }
  // mouth
  rect(c, 6, 12, 9, 12, skinShadow)
  outline(c, DARK)
  return c
}

async function suspectFaces() {
  for (let skinIdx = 0; skinIdx < SKIN_TONES.length; skinIdx++) {
    for (let hairIdx = 0; hairIdx < HAIR_COLORS.length; hairIdx++) {
      for (const style of ['short', 'long']) {
        const { skin, shadow: skinShadow } = SKIN_TONES[skinIdx]
        const { hair, shadow: hairShadow } = HAIR_COLORS[hairIdx]
        const c = face(skin, skinShadow, hair, hairShadow, style)
        await render(c, `face-${skinIdx}-${hairIdx}-${style}.png`)
      }
    }
  }
}

/** The victim always renders the same face — pale skin, muted grey hair, closed eyes —
 * so it's instantly recognizable as "the victim" regardless of which pool character it
 * ended up being, matching how the clue text ("La víctima...") is also generic. */
async function victimFace() {
  const c = face(hex('#e9e2d2'), hex('#cfc6b2'), hex('#cfc8ba'), hex('#a89e8c'), 'long', { closedEyes: true })
  await render(c, 'face-victim.png')
}

async function floorDither() {
  const size = 8
  const c = newCanvas(size)
  const dot = [0, 0, 0, 26]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % 4 === 0) c[y][x] = dot
    }
  }
  await render(c, 'floor-dither.png')
}

await plant()
await rug()
await chair()
await bookshelf()
await sofa()
await window_()
await painting()
await lamp()
await table()
await mirror()
await clock()
await vase()
await suspectFaces()
await victimFace()
await floorDither()
