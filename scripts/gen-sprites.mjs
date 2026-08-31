import sharp from 'sharp'
import {mkdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'

// Relative to this script, not the project folder's name — survives a repo rename.
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/sprites')
mkdirSync(OUT_DIR, { recursive: true })

const SIZE = 16
const SCALE = 8
// Shared by rugMotif and sofaMotif/sofaLMotif so a multi-cell piece always floats the
// same distance from its cell's edge regardless of which furniture type it is.
const FURNITURE_MARGIN = 2

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
const CHAIR_LT = hex('#c99a68')
const CHAIR_SHADOW = hex('#5c3a24')
// Kept for CHEST_WOOD/CHEST_WOOD_DK below to reuse (same wood tone) — no longer used
// for a shelf sprite itself since `bookshelf` was retired (see docs/visual-design.md).
const SHELF = hex('#8b5a3c')
const SHELF_DK = hex('#5f3c24')
const SOFA = hex('#6c8ebf')
const SOFA_DK = hex('#4d6c96')
const SOFA_LT = hex('#93b3de')
const LAMP_SHADE = hex('#e8c15a')
const LAMP_GLOW = hex('#fff3c9')
const LAMP_DK = hex('#b8912f')
const TABLE = hex('#9c6b3e')
const TABLE_DK = hex('#7a4f2c')
const TABLE_LT = hex('#c99a68')
const VASE_BODY = hex('#5d8a8f')
const VASE_DK = hex('#3f6468')
const VASE_LT = hex('#84b3b8')
const BED_FRAME = hex('#6b4226')
const BLANKET = hex('#b6533f')
const BLANKET_DK = hex('#8a3a2a')
const PILLOW = hex('#f7f1e3')
const PILLOW_SHADOW = hex('#ddd2ba')
// Same wood tone as SHELF/SHELF_DK — reused rather than re-declared as a new hex value.
const CHEST_WOOD = SHELF
const CHEST_WOOD_DK = SHELF_DK
const CHEST_WOOD_LT = hex('#ab7a54')
const CHEST_METAL = hex('#7d8a9a')
const CHEST_METAL_DK = hex('#4f5a68')
const CHEST_METAL_LT = hex('#b8c4d0')
const PEDESTAL = hex('#a89e8c')
const PEDESTAL_DK = hex('#7d7566')
const PEDESTAL_LT = hex('#c4bcae')
const MARBLE = hex('#e8e2d5')
const MARBLE_SHADOW = hex('#c9c0ac')
const GLOBE_OCEAN = hex('#5f8fa8')
const GLOBE_LAND = hex('#7fa563')
const GLOBE_LAND_DK = hex('#5c7d47')
const GLOBE_RING = hex('#b8935a')
const GLOBE_STAND = SHELF // same wood tone as the chest, reused rather than re-declared
// Lighter than the original near-black (#241c22): that was so close in value to the
// universal DARK outline that the outline all but disappeared against the body,
// leaving the silhouette with no clean edge to read against.
const PIANO_BODY = hex('#4a3a44')
const PIANO_BODY_LT = hex('#6b5560')
const PIANO_KEY_WHITE = hex('#f2ede0')
const PIANO_KEY_BLACK = hex('#1a141a')
const STOOL = hex('#c23b3b')
const SCREEN_FRAME = hex('#5c3a24')
const SCREEN_ACCENT = hex('#c9a227')

// ---- pixel canvas helpers --------------------------------------------
function hex(c) {
  const h = c.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255]
}

/** Canvases are rectangular (width = canvas[0].length, height = canvas.length) —
 * multi-cell furniture pieces render at e.g. 32x16, not just 16x16. */
function newCanvas(width = SIZE, height = width) {
  return Array.from({ length: height }, () => new Array(width).fill(null))
}

function rect(canvas, x0, y0, x1, y1, color) {
  const h = canvas.length
  const w = canvas[0].length
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x >= 0 && x < w && y >= 0 && y < h) canvas[y][x] = color
    }
  }
}

function px(canvas, x, y, color) {
  if (x >= 0 && x < canvas[0].length && y >= 0 && y < canvas.length) canvas[y][x] = color
}

/** `cx`/`cy` are in the same continuous space as pixel *centers* (`x + 0.5`), not pixel
 * indices — so a circle meant to be centered on a 16-wide canvas needs `cx = 8`, not
 * `7.5` (which looks like "the middle index" but actually lands the circle half a
 * pixel left of true center, and made a couple of icons visibly off-center before this
 * was caught — see `center()`'s doc comment and docs/visual-design.md). Two circles
 * meant to mirror each other left-right need `cx1 + cx2 = 16` for the same reason (not
 * `15`, which is what "both average to 7.5" gives you). */
function circle(canvas, cx, cy, r, color) {
  const h = canvas.length
  const w = canvas[0].length
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx + 0.5
      const dy = y - cy + 0.5
      if (dx * dx + dy * dy <= r * r) canvas[y][x] = color
    }
  }
}

function outline(canvas, color) {
  const h = canvas.length
  const w = canvas[0].length
  const snapshot = canvas.map((row) => row.slice())
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (snapshot[y][x]) continue
      const hasFilledNeighbor = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([nx, ny]) => nx >= 0 && nx < w && ny >= 0 && ny < h && snapshot[ny][nx])
      if (hasFilledNeighbor) canvas[y][x] = color
    }
  }
}

/** Rotates a canvas 90° clockwise, as real pixel data (width/height swap for a
 * non-square canvas) — used to bake the L-shaped sofa's 4 orientations as separate
 * files (`sofaLVariants`) instead of relying on a CSS `transform: rotate` at render
 * time. A real pixel rotation carries any asymmetric detail (a backrest on only 2 of
 * the piece's edges, say) to the right place automatically; CSS rotation of a single
 * shared image cannot, because two differently-rotated *instances* of the same source
 * pixels have no way to each apply a different asymmetric design — see `sofaMotif()`
 * and docs/visual-design.md for the design that ran into exactly this. */
function rotate90CW(canvas) {
  const h = canvas.length
  const w = canvas[0].length
  const out = newCanvas(h, w)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out[x][h - 1 - y] = canvas[y][x]
    }
  }
  return out
}

/** Shifts a canvas's drawn content so its bounding box is centered, horizontally and
 * vertically, within the canvas — called right before `outline()` on every single-cell
 * icon (see the `center()` calls below), so each one is centered by construction
 * instead of by hand-tuning coordinates to be symmetric (which drifts easily — e.g. a
 * handful of the furniture icons ended up visibly off-center after later margin/detail
 * tweaks moved one side of a shape without the other, before this existed). Not used
 * for multi-cell pieces (`rugPairH/V`, `sofaPairH/V`, the L): their content is meant to
 * fill/connect across the piece's whole footprint, including the deliberately-empty
 * quadrant of the L — centering would fight that instead of a genuine margin. */
function center(canvas) {
  const h = canvas.length
  const w = canvas[0].length
  let minX = w
  let maxX = -1
  let minY = h
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!canvas[y][x]) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX) return // nothing drawn
  const dx = Math.round((w - (maxX - minX + 1)) / 2) - minX
  const dy = Math.round((h - (maxY - minY + 1)) / 2) - minY
  if (dx === 0 && dy === 0) return
  const snapshot = canvas.map((row) => row.slice())
  for (const row of canvas) row.fill(null)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (snapshot[y][x]) px(canvas, x + dx, y + dy, snapshot[y][x])
    }
  }
}

/** Clips `n` pixels off each of the 4 corners of a rect, for a softened silhouette
 * instead of a hard right angle — used by most furniture pieces below. A corner
 * touching an `open` edge (see `bevel()`) is left un-clipped: rounding it would notch
 * a transparent (then outline()-darkened) speck right at the seam where a multi-cell
 * piece is supposed to run flush into its neighbor. */
function clipCorners(canvas, x0, y0, x1, y1, n = 1, open = {}) {
  if (!(open.top || open.left))
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) px(canvas, x0 + i, y0 + j, null)
  if (!(open.top || open.right))
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) px(canvas, x1 - i, y0 + j, null)
  if (!(open.bottom || open.left))
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) px(canvas, x0 + i, y1 - j, null)
  if (!(open.bottom || open.right))
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) px(canvas, x1 - i, y1 - j, null)
}

/** Fills a rect with `base`, then lays a 1px `light` seam on the top/left edges and a
 * 1px `dark` seam on the bottom/right edges — a cheap pseudo-3D bevel, our standard
 * shading model (light from the top-left) across every furniture piece. Pass `open*:
 * true` to skip a seam on that edge: used by the multi-cell rug/sofa tiles so the edge
 * touching the next cell has no seam and the fill runs flush to the border, making the
 * piece read as one continuous shape across cells instead of tiled icons. */
function bevel(canvas, x0, y0, x1, y1, base, light, dark, open = {}) {
  rect(canvas, x0, y0, x1, y1, base)
  if (!open.top) rect(canvas, x0, y0, x1, y0, light)
  if (!open.left) rect(canvas, x0, y0, x0, y1, light)
  if (!open.bottom) rect(canvas, x0, y1, x1, y1, dark)
  if (!open.right) rect(canvas, x1, y0, x1, y1, dark)
}

/** Draws a `thickness`-px-wide stroke from `(x0,y0)` to `(x1,y1)` by stamping a small
 * square at each interpolated point, stepping along whichever axis spans the larger
 * distance — works for shallow and steep slopes alike, unlike walking a single fixed
 * axis. Used by `screenMotif` to draw each folding-screen panel as a diagonal line. */
function thickLine(canvas, x0, y0, x1, y1, thickness, color) {
  const dx = x1 - x0
  const dy = y1 - y0
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1)
  const half = (thickness - 1) / 2
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = x0 + dx * t
    const y = y0 + dy * t
    rect(canvas, Math.round(x - half), Math.round(y - half), Math.round(x + half), Math.round(y + half), color)
  }
}

async function render(canvas, filename) {
  const height = canvas.length
  const width = canvas[0].length
  const buf = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = canvas[y][x] ?? [0, 0, 0, 0]
      const i = (y * width + x) * 4
      buf[i] = c[0]
      buf[i + 1] = c[1]
      buf[i + 2] = c[2]
      buf[i + 3] = c[3]
    }
  }
  await sharp(buf, { raw: { width, height, channels: 4 } })
    .resize(width * SCALE, height * SCALE, { kernel: 'nearest' })
    .png()
    .toFile(`${OUT_DIR}/${filename}`)
  console.log('wrote', filename)
}

// ---- sprites -----------------------------------------------------------

async function plant() {
  const c = newCanvas()
  bevel(c, 4, 11, 11, 13, TERRACOTTA, TERRACOTTA_DK, TERRACOTTA_DK)
  clipCorners(c, 4, 11, 11, 13, 1)
  circle(c, 8, 7, 4.3, LEAF)
  circle(c, 4.8, 9, 2.3, LEAF)
  circle(c, 11.2, 9, 2.3, LEAF)
  circle(c, 10, 5, 2, LEAF_DK)
  circle(c, 6, 4.5, 1.6, LEAF_LT)
  circle(c, 8.5, 9, 1.4, LEAF_LT)
  center(c)
  outline(c, DARK)
  await render(c, 'plant.png')
}

/** Area rug, top-down: a fringed frame around a field color with one diamond medallion
 * centered on the whole piece, inset by `FURNITURE_MARGIN` on every side (same margin
 * as the sofa, so every multi-cell piece floats the same distance off the cell edge) —
 * so it reads as a rug floating on the floor, not a floor tile filling the cell
 * edge-to-edge. Reused as-is for the single-cell icon and for the 2-cell pieces
 * (`rugPairH`/`rugPairV`, a 32x16 or 16x32 canvas) — it's drawn directly at whatever
 * size the canvas is, in one pass, so a multi-cell rug is one seamless bitmap rather
 * than two separately-rendered cells that have to line up pixel-perfect across a
 * DOM/grid boundary (which is what produced the visible seam this replaces — see
 * BoardGrid.vue's `multiCellPieces`). Since it's one piece with nothing else to connect
 * to, the margin applies on every side alike — there's no longer a "joined" edge to
 * leave flush like a real 2-tile rug would have. */
function rugMotif(c) {
  const w = c[0].length
  const h = c.length
  const m = FURNITURE_MARGIN
  const x1 = w - 1 - m
  const y1 = h - 1 - m
  rect(c, m, m, x1, y1, RUG_DK)
  rect(c, m + 1, m + 1, x1 - 1, y1 - 1, RUG_A)
  rect(c, m + 2, m + 2, x1 - 2, y1 - 2, RUG_B)
  const cx = w / 2
  const cy = h / 2
  rect(c, cx - 2, cy - 2, cx + 1, cy + 1, RUG_DK)
  rect(c, cx - 1, cy - 1, cx, cy, RUG_B)
  clipCorners(c, m, m, x1, y1, 1)
}

async function rugSolo() {
  const c = newCanvas(16, 16)
  rugMotif(c)
  center(c)
  outline(c, DARK)
  await render(c, 'rug-solo.png')
}

async function rugPairH() {
  const c = newCanvas(32, 16)
  rugMotif(c)
  outline(c, DARK)
  await render(c, 'rug-pair-h.png')
}

async function rugPairV() {
  const c = newCanvas(16, 32)
  rugMotif(c)
  outline(c, DARK)
  await render(c, 'rug-pair-v.png')
}

/** Wooden dining chair, top-down: a rounded seat with a darker backrest rail across the
 * top — rounded on its own top corners too, so the whole silhouette reads as one soft
 * shape instead of a hard box — with 2 real gaps cut through the rail in the seat's own
 * wood tone (not a lighter decorative stripe painted on top, which read as two buttons
 * instead of slats), and 4 legs in their own darkest tone so they don't blend into the
 * rail/outline. A first pass added a raised "finial" nub at each top corner (inspired by
 * ladder-back chair references) — it broke the silhouette into disconnected floating
 * squares instead of reading as a chair, so it's gone; the rounded rail corners do the
 * work of making the backrest read as chair-shaped instead. Uses `FURNITURE_MARGIN`,
 * same as `rugMotif`/`sofaMotif`, so all 3 furniture families float the same distance
 * off the cell edge. */
async function chair() {
  const c = newCanvas(16, 16)
  const m = FURNITURE_MARGIN
  const x1 = 15 - m
  const y1 = 15 - m

  rect(c, m, m, x1, y1, CHAIR) // seat, base layer
  clipCorners(c, m, m, x1, y1, 2)

  rect(c, m, m, x1, m + 4, CHAIR_DK) // backrest rail
  clipCorners(c, m, m, x1, m + 4, 2, { bottom: true })
  rect(c, m + 3, m + 1, m + 3, m + 3, CHAIR) // open slats — seat's own wood tone, real gaps not a stripe
  rect(c, x1 - 3, m + 1, x1 - 3, m + 3, CHAIR)

  rect(c, m + 5, y1 - 3, x1 - 5, y1 - 3, CHAIR_LT) // seat joint/grain, subtle

  for (const [lx, ly] of [
    [m - 1, m + 5], // back-left leg, just below the backrest
    [x1, m + 5], // back-right leg
    [m - 1, y1 - 2], // front-left leg
    [x1, y1 - 2], // front-right leg
  ]) {
    rect(c, lx, ly, lx + 1, ly + 2, CHAIR_SHADOW)
  }

  center(c)
  outline(c, DARK)
  await render(c, 'chair.png')
}

/** Grand piano, top-down, with the lid closed — after 5 rejected attempts at an open,
 * raised lid (a straight chamfer "V"; a symmetric round; a 3-tier S-curve; a 4-block
 * staircase; a 2-tier stepped lid with a shadow band and a prop-leg stick), a plain
 * closed lid reads far better at this pixel count than trying to depict the lid raised
 * at an angle. The body is a soft-cornered rect — the same `clipCorners(..., 1)`
 * treatment `chest`/`lamp`/etc. use — with the 2 bottom corners left sharp (`{ bottom:
 * true }`) so they don't nick into the keyboard fascia. `PIANO_BODY_LT` forms a
 * diagonal glare band crossing the FULL width of the lid, edge to edge (`thickLine()`,
 * the same helper `screenMotif` uses) rather than a short, centered segment or a
 * rounded, stationary-looking blob — a real lacquered lid reflects an overhead light as
 * a streak that runs all the way across, not a spot that stops partway. The keyboard is
 * a strip of alternating `PIANO_KEY_WHITE`/`PIANO_KEY_BLACK` bands, `KEY_LEN` px long,
 * with one more full-width white row below them (`KEY_LEN + 1` total) — real piano
 * black keys are shorter than the white keys, so the white keys' own front edge shows
 * as an unbroken white strip past where the black keys end, not blended into the
 * alternating pattern. Below that sits a `STOOL` bar, `STOOL_DEPTH` px deep (twice
 * `FURNITURE_MARGIN`, unlike every other piece's margin-thin floor gap) and running the
 * keyboard's full length like a real bench, not a single small seat — the body's own
 * bottom edge (`y1`) is pulled in by that same amount so the bench still fits inside
 * the same fixed canvas. Always drawn in this one canonical vertical orientation (keys
 * at the bottom) and reused for the other 2 sprites via `rotate90CW()` — the same
 * technique `sofaLMotif()` uses for its 4 rotations — rather than a second, transposed
 * copy of this logic. No legs on the body: like a round table, a grand piano's legs sit
 * well inside the overhang of the body/lid and are fully hidden from directly above.
 * Always grows to a real 2-cell footprint or gets dropped (see `assignMustGrow`) — a
 * piano is never small/square in reality, so a 1-cell version would be a contradiction
 * the same way a 1-cell bed is. */
function pianoMotif(c) {
  const w = c[0].length
  const h = c.length
  const m = FURNITURE_MARGIN
  const STOOL_DEPTH = m * 2
  const KEY_LEN = 3
  const x1 = w - 1 - m
  const y1 = h - 1 - STOOL_DEPTH

  rect(c, m, m, x1, y1, PIANO_BODY)
  clipCorners(c, m, m, x1, y1, 1, { bottom: true }) // soft corners; flat/sharp where the keys sit

  // Diagonal glare band crossing the full width of the lid, edge to edge, centered
  // vertically within the lid area (between the top margin and the keyboard). Its
  // horizontal span always reaches both edges; only its steepness adapts to whatever
  // vertical room is available, since the v2 pair's canvas is twice as tall as the
  // solo icon's.
  const lidLeft = m + 1
  const lidRight = x1 - 1
  const lidTop = m + 1
  const lidBottom = y1 - KEY_LEN - 1
  const bandSpanX = lidRight - lidLeft
  const bandSpanY = Math.min(bandSpanX, lidBottom - lidTop)
  const bandY = lidTop + Math.floor((lidBottom - lidTop - bandSpanY) / 2)
  thickLine(c, lidLeft, bandY, lidRight, bandY + bandSpanY, 2, PIANO_BODY_LT)

  for (let x = m; x <= x1; x++) {
    rect(c, x, y1 - KEY_LEN + 1, x, y1 - 1, (x - m) % 2 === 0 ? PIANO_KEY_WHITE : PIANO_KEY_BLACK)
  }
  rect(c, m, y1, x1, y1, PIANO_KEY_WHITE) // the white keys' own front edge, past where the black keys end
  rect(c, m, y1 + 1, x1, h - 1, STOOL) // bench, in the margin, full width
}

async function pianoSolo() {
  const c = newCanvas(16, 16)
  pianoMotif(c)
  center(c)
  outline(c, DARK)
  await render(c, 'piano-solo.png')
}

async function pianoPairV() {
  const c = newCanvas(16, 32)
  pianoMotif(c)
  outline(c, DARK)
  await render(c, 'piano-pair-v.png')
}

async function pianoPairH() {
  const c = newCanvas(16, 32)
  pianoMotif(c)
  outline(c, DARK)
  await render(rotate90CW(c), 'piano-pair-h.png')
}

/** Folding screen (biombo), true top-down: a screen's decorated panel FACE is vertical,
 * so from directly above it's invisible — drawing it as a flat framed square with a
 * painted motif (the original version of this function) was the exact front-view
 * mistake already eliminated once for window/painting/mirror/clock. What a bird's-eye
 * view actually shows is each panel's thin top edge, foreshortened by the fold angle
 * into a diagonal stroke, tracing the zigzag the whole run makes as it stands open.
 * Panels alternate diagonal direction (`down` below) so consecutive strokes land on the
 * same near/far edge at each boundary, chaining into one continuous zigzag across the
 * run; a small `SCREEN_ACCENT` dot bridges the small gap at each hinge. Degrades
 * gracefully like rug/sofa — even a single panel (one stray diagonal leaf) is still a
 * recognizable screen (see `growScreen`), unlike `bed`/`piano`. `axis` is which way the
 * panels line up ('h' for the solo icon and horizontal runs, 'v' for vertical runs). */
function screenMotif(c, axis) {
  const w = c[0].length
  const h = c.length
  const m = FURNITURE_MARGIN
  const panelCount = axis === 'h' ? w / 16 : h / 16
  const near = m
  const far = (axis === 'h' ? h : w) - 1 - m

  for (let i = 0; i < panelCount; i++) {
    const a0 = i * 16 + m
    const a1 = i * 16 + 15 - m
    const down = i % 2 === 0 // '\' from the near edge to the far edge, vs '/' the reverse
    const b0 = down ? near : far
    const b1 = down ? far : near

    if (axis === 'h') thickLine(c, a0, b0, a1, b1, 2, SCREEN_FRAME)
    else thickLine(c, b0, a0, b1, a1, 2, SCREEN_FRAME)

    if (i > 0) {
      // b0 here equals the previous panel's b1 by construction — the shared hinge point.
      if (axis === 'h') circle(c, i * 16 + 0.5, b0 + 0.5, 1, SCREEN_ACCENT)
      else circle(c, b0 + 0.5, i * 16 + 0.5, 1, SCREEN_ACCENT)
    }
  }
}

async function screenSolo() {
  const c = newCanvas(16, 16)
  screenMotif(c, 'h')
  center(c)
  outline(c, DARK)
  await render(c, 'screen-solo.png')
}

async function screenPairH() {
  const c = newCanvas(32, 16)
  screenMotif(c, 'h')
  outline(c, DARK)
  await render(c, 'screen-pair-h.png')
}

async function screenPairV() {
  const c = newCanvas(16, 32)
  screenMotif(c, 'v')
  outline(c, DARK)
  await render(c, 'screen-pair-v.png')
}

async function screenTripleH() {
  const c = newCanvas(48, 16)
  screenMotif(c, 'h')
  outline(c, DARK)
  await render(c, 'screen-triple-h.png')
}

async function screenTripleV() {
  const c = newCanvas(16, 48)
  screenMotif(c, 'v')
  outline(c, DARK)
  await render(c, 'screen-triple-v.png')
}

/** Sofa, top-down, 3 distinct value zones so each part of the silhouette actually
 * reads as a different piece of furniture instead of one flat rect: a dark backrest
 * band along one edge, light rounded armrest caps at the two ends (poking 1px past the
 * seat's own edge, so they read as a separate raised shape, not a color patch), and the
 * mid-tone seat filling what's left. The backrest is genuinely asymmetric (only on one
 * edge, not a uniform rim) — that only became safe once every multi-cell shape became
 * its own pre-baked bitmap; nothing here relies on rotating a shared image at render
 * time to face a different direction (that's exactly what broke the first version of
 * this redesign — see `sofaLMotif()` and docs/visual-design.md). `backrest` is which
 * edge ('top' or 'left') the band sits on. */
function sofaMotif(c, backrest) {
  const w = c[0].length
  const h = c.length
  const m = FURNITURE_MARGIN
  const x1 = w - 1 - m
  const y1 = h - 1 - m
  const alongLen = backrest === 'top' ? x1 - m + 1 : y1 - m + 1

  rect(c, m, m, x1, y1, SOFA) // seat fill, base layer
  if (backrest === 'top') {
    rect(c, m, m, x1, m + 4, SOFA_DK) // backrest
    clipCorners(c, m, m, x1, m + 4, 1, { bottom: true })
    rect(c, m - 1, m + 4, m + 2, y1, SOFA_LT) // left armrest
    clipCorners(c, m - 1, m + 4, m + 2, y1, 1, { right: true })
    rect(c, x1 - 2, m + 4, x1 + 1, y1, SOFA_LT) // right armrest
    clipCorners(c, x1 - 2, m + 4, x1 + 1, y1, 1, { left: true })
  } else {
    rect(c, m, m, m + 4, y1, SOFA_DK)
    clipCorners(c, m, m, m + 4, y1, 1, { right: true })
    rect(c, m + 4, m - 1, x1, m + 2, SOFA_LT)
    clipCorners(c, m + 4, m - 1, x1, m + 2, 1, { bottom: true })
    rect(c, m + 4, y1 - 2, x1, y1 + 1, SOFA_LT)
    clipCorners(c, m + 4, y1 - 2, x1, y1 + 1, 1, { top: true })
  }

  // seam(s) marking individual cushions along the run
  const segments = Math.max(1, Math.round(alongLen / 14))
  for (let i = 1; i < segments; i++) {
    const t = Math.round(m + (alongLen * i) / segments)
    if (backrest === 'top') rect(c, t, m + 4, t, y1, SOFA_DK)
    else rect(c, m + 4, t, x1, t, SOFA_DK)
  }
}

async function sofaSolo() {
  const c = newCanvas(16, 16)
  sofaMotif(c, 'top')
  center(c)
  outline(c, DARK)
  await render(c, 'sofa-solo.png')
}

async function sofaPairH() {
  const c = newCanvas(32, 16)
  sofaMotif(c, 'top')
  outline(c, DARK)
  await render(c, 'sofa-pair-h.png')
}

async function sofaPairV() {
  const c = newCanvas(16, 32)
  sofaMotif(c, 'left')
  outline(c, DARK)
  await render(c, 'sofa-pair-v.png')
}

/** L-shaped 3-cell sofa, canonical orientation: corner at top-left, arms extending
 * right and down, bottom-right quadrant empty. The backrest wraps the two outer
 * (top+left) edges of the whole L — matching `sofaMotif`'s "one edge, not a uniform
 * rim" language — with an armrest cap at the true end of each arm. Baked once here and
 * rotated as raw pixel data (`rotate90CW`, in `sofaLVariants`) into the other 3
 * possible missing-corner orientations, instead of a CSS `transform: rotate` at render
 * time — see `rotate90CW`'s doc comment for why that matters for an asymmetric design
 * like this one. */
function sofaLMotif() {
  const c = newCanvas(32, 32)
  const m = FURNITURE_MARGIN
  const far = 32 - 1 - m
  const elbow = 15 // last column/row still shared by both arms of the L
  rect(c, m, m, elbow, far, SOFA) // left arm (vertical bar of the L)
  rect(c, m, m, far, elbow, SOFA) // top arm (horizontal bar of the L)
  rect(c, m, m, far, m + 3, SOFA_DK) // backrest along the top
  rect(c, m, m, m + 3, far, SOFA_DK) // backrest along the left
  rect(c, far - 2, m + 4, far, elbow, SOFA_LT) // armrest at the far end of the top arm
  rect(c, m + 4, far - 2, elbow, far, SOFA_LT) // armrest at the far end of the left arm
  for (const [x, y] of [[m, m], [far, m], [m, far]]) px(c, x, y, null)
  outline(c, DARK)
  return c
}

async function sofaLVariants() {
  let c = sofaLMotif()
  const rotationByMissingCorner = { bottomRight: 0, bottomLeft: 90, topLeft: 180, topRight: 270 }
  const byRotation = new Map([[0, c]])
  for (const rotation of [90, 180, 270]) {
    c = rotate90CW(c)
    byRotation.set(rotation, c)
  }
  for (const [missingCorner, rotation] of Object.entries(rotationByMissingCorner)) {
    await render(byRotation.get(rotation), `sofa-l-${missingCorner}.png`)
  }
}

/** Bed, top-down: a headboard cap at one end of the run — not a strip along a whole
 * side like `sofaMotif`'s backrest, since a real bed's headboard sits at one end of its
 * long axis, not along its length — then a pale pillow just past it (the dominant
 * shape) and a blanket filling the rest of the run with a soft fold line. Grows to a
 * straight 2-cell footprint like `rug` (see `generator/furniture.ts`): a 1-cell square
 * bed cramped headboard+pillow+blanket into a 1:1 box, when a real bed reads as a long
 * rectangle — the 2-cell versions just let the blanket stretch to fill the extra
 * length, everything else unchanged. `headEnd` is which end the headboard band sits on
 * ('top' for the solo icon and the vertical pair, 'left' for the horizontal pair) —
 * same convention as `sofaMotif`'s `backrest` parameter. */
function bedMotif(c, headEnd) {
  const w = c[0].length
  const h = c.length
  const m = FURNITURE_MARGIN
  const x1 = w - 1 - m
  const y1 = h - 1 - m

  if (headEnd === 'top') {
    rect(c, m, m, x1, m + 1, BED_FRAME) // headboard — thin, so it doesn't compete with the pillow
    clipCorners(c, m, m, x1, m + 1, 1, { bottom: true })
    rect(c, m + 1, m + 2, x1 - 1, m + 7, PILLOW) // pillow — big and pale, the dominant shape
    rect(c, m + 1, m + 6, x1 - 1, m + 7, PILLOW_SHADOW)
    clipCorners(c, m + 1, m + 2, x1 - 1, m + 7, 1)
    rect(c, m, m + 8, x1, y1, BLANKET) // blanket fills the rest of the run
    clipCorners(c, m, m + 8, x1, y1, 1, { top: true })
    rect(c, m + 3, y1 - 1, x1 - 3, y1 - 1, BLANKET_DK) // one soft wrinkle, not a hard segment line
  } else {
    rect(c, m, m, m + 1, y1, BED_FRAME)
    clipCorners(c, m, m, m + 1, y1, 1, { right: true })
    rect(c, m + 2, m + 1, m + 7, y1 - 1, PILLOW)
    rect(c, m + 6, m + 1, m + 7, y1 - 1, PILLOW_SHADOW)
    clipCorners(c, m + 2, m + 1, m + 7, y1 - 1, 1)
    rect(c, m + 8, m, x1, y1, BLANKET)
    clipCorners(c, m + 8, m, x1, y1, 1, { left: true })
    rect(c, x1 - 1, m + 3, x1 - 1, y1 - 3, BLANKET_DK)
  }
}

async function bedSolo() {
  const c = newCanvas(16, 16)
  bedMotif(c, 'top')
  center(c)
  outline(c, DARK)
  await render(c, 'bed-solo.png')
}

async function bedPairH() {
  const c = newCanvas(32, 16)
  bedMotif(c, 'left')
  outline(c, DARK)
  await render(c, 'bed-pair-h.png')
}

async function bedPairV() {
  const c = newCanvas(16, 32)
  bedMotif(c, 'top')
  outline(c, DARK)
  await render(c, 'bed-pair-v.png')
}

/** Chest/trunk, top-down: a domed lid (`bevel()` for the pseudo-3D curve), a single
 * metal strap near the front third with a latch, and corner guards. Reference chests
 * (front-facing dungeon-crawler style) get their pop from the metal being a distinctly
 * *cool* tone against warm wood — `CHEST_METAL` was a warm gray close in value to the
 * wood and read as flat/washed-out; shifted to a cooler steel-blue so the straps and
 * latch actually separate from the wood instead of blending into it. */
async function chest() {
  const c = newCanvas()
  const m = FURNITURE_MARGIN
  const x1 = 15 - m
  const y1 = 15 - m
  const cx = Math.round((m + x1) / 2)

  bevel(c, m, m, x1, y1, CHEST_WOOD, CHEST_WOOD_LT, CHEST_WOOD_DK)
  clipCorners(c, m, m, x1, y1, 1)
  // single strap near the front third — a real trunk's lid seam, not a full cross
  // (a cross reads as a window/tic-tac-toe grid instead of a chest)
  rect(c, m, y1 - 4, x1, y1 - 3, CHEST_METAL)
  rect(c, m, y1 - 4, x1, y1 - 4, CHEST_METAL_LT) // lit edge on the strap, reads as raised metal
  rect(c, cx - 1, y1 - 5, cx + 1, y1 - 2, CHEST_METAL_DK) // latch, straddling the strap
  px(c, cx, y1 - 4, CHEST_METAL_LT) // keyhole glint
  for (const [x, y] of [[m, m], [x1 - 1, m], [m, y1 - 1], [x1 - 1, y1 - 1]]) {
    rect(c, x, y, x + 1, y + 1, CHEST_METAL_DK) // corner guards, bigger so they actually read
  }

  center(c)
  outline(c, DARK)
  await render(c, 'chest.png')
}

async function lamp() {
  const c = newCanvas()
  circle(c, 8, 8, 5.5, LAMP_DK)
  circle(c, 7.7, 7.7, 4.6, LAMP_SHADE)
  circle(c, 8, 8, 2.6, LAMP_GLOW)
  circle(c, 7, 7, 1, hex('#fffdf5'))
  center(c)
  outline(c, DARK)
  await render(c, 'lamp.png')
}

/** Round table, top-down: a wood rim + surface, and one off-center grain knot pair (our
 * usual light-from-top-left highlight). No legs poking past the edge, unlike
 * chair/sofa/globe — a round tabletop typically overhangs its base (most have a single
 * central pedestal, not 4 corner legs), so directly from above the base is fully hidden
 * under the top; 4 legs peeking out here read more like debris on the rim than
 * furniture. A first pass used a tight stack of same-sized rings (rim/surface/ring/
 * surface all within ~2px of each other), which read as a mottled blob/rock instead of
 * wood — fixed by dropping to a single rim + surface pair. */
async function table() {
  const c = newCanvas()
  circle(c, 8, 8, 6, TABLE_DK) // rim
  circle(c, 8, 8, 5.2, TABLE) // surface
  circle(c, 6.3, 6.3, 1.4, TABLE_LT) // grain knot, lit side
  circle(c, 10, 10, 1, TABLE_DK) // grain knot, shaded side
  center(c)
  outline(c, DARK)
  await render(c, 'table.png')
}

/** Statue on a pedestal, top-down: a rounded square base with a "figure" on top — a
 * shoulder-width circle overlapped by a smaller head circle, so the silhouette reads
 * as two stacked circles (a shape none of the other round pieces — lamp, table, globe
 * — use, all of which are a single circle) instead of just another plain disc. */
async function statue() {
  const c = newCanvas()
  const m = FURNITURE_MARGIN
  const x1 = 15 - m
  const y1 = 15 - m

  bevel(c, m, m, x1, y1, PEDESTAL, PEDESTAL_LT, PEDESTAL_DK)
  clipCorners(c, m, m, x1, y1, 1)
  circle(c, 8, 9, 3.2, MARBLE) // shoulders
  circle(c, 9, 8, 1.4, MARBLE_SHADOW)
  circle(c, 8, 6, 2.1, MARBLE) // head, peeking above the shoulders
  circle(c, 8.7, 5.3, 0.9, MARBLE_SHADOW)

  center(c)
  outline(c, DARK)
  await render(c, 'statue.png')
}

/** Globe on a stand, top-down: looking straight down you mostly see the sphere's top
 * (continents scattered over ocean) ringed by the brass meridian band, with the wooden
 * stand's foot peeking out at the bottom (1px past `FURNITURE_MARGIN`, same convention
 * as the chair's legs and the table's). */
async function globe() {
  const c = newCanvas()
  const y1 = 15 - FURNITURE_MARGIN
  const cx = 8

  rect(c, cx - 2, y1 - 1, cx + 1, y1 + 1, GLOBE_STAND)
  circle(c, 8, 8, 5.5, GLOBE_RING)
  circle(c, 8, 8, 4.7, GLOBE_OCEAN)
  circle(c, 6, 6, 1.6, GLOBE_LAND)
  circle(c, 10.5, 7, 1.3, GLOBE_LAND_DK)
  circle(c, 7.5, 10.5, 1.4, GLOBE_LAND)

  center(c)
  outline(c, DARK)
  await render(c, 'globe.png')
}

async function vase() {
  const c = newCanvas()
  bevel(c, 5, 9, 10, 13, VASE_BODY, VASE_LT, VASE_DK)
  clipCorners(c, 5, 9, 10, 13, 1)
  rect(c, 6, 6, 9, 9, VASE_DK)
  bevel(c, 6, 4, 9, 6, VASE_BODY, VASE_LT, VASE_DK)
  circle(c, 5.5, 4, 1.2, LEAF)
  circle(c, 8, 3.8, 1.2, LEAF_LT)
  circle(c, 10.5, 4, 1.2, LEAF)
  center(c)
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
await rugSolo()
await rugPairH()
await rugPairV()
await chair()
await pianoSolo()
await pianoPairH()
await pianoPairV()
await sofaSolo()
await sofaPairH()
await sofaPairV()
await sofaLVariants()
await bedSolo()
await bedPairH()
await bedPairV()
await chest()
await lamp()
await table()
await statue()
await globe()
await vase()
await screenSolo()
await screenPairH()
await screenPairV()
await screenTripleH()
await screenTripleV()
await suspectFaces()
await victimFace()
await floorDither()
