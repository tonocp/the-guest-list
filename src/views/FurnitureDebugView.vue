<script setup lang="ts">
import { computed } from 'vue'
import type { FurnitureType } from '../types/puzzle'
import { CONNECTABLE_FURNITURE_SPRITES, FURNITURE_SPRITES } from '../lib/furnitureIcons'
import { MUST_GROW_TYPES } from '../lib/generator/furniture'
import { HAIR_COUNT, SKIN_COUNT, VICTIM_FACE } from '../lib/suspectFace'

/** Debug-only route (`/furni`, see router/index.ts) — not linked from anywhere in the
 * app UI. Shows every furniture sprite a generated map can actually produce (and every
 * suspect face sprite) at the exact size/placement BoardGrid.vue uses (`w-full h-full`,
 * same floor-dither cell background — every sprite, solo or multi-cell, is drawn at
 * 100% of its cell and relies entirely on its own baked-in `FURNITURE_MARGIN` inset for
 * the gap to the cell edge, see gen-sprites.mjs), so a visual glitch or style tweak can
 * be checked here without generating puzzles until one happens to include the right
 * furniture/face combo. "A generated map can actually produce" excludes `bed`/`piano`
 * from the 1-cell section (see `SOLO_ONLY_TYPES`) but not from multi-cell, since e.g.
 * `bed-h2/v2` are exactly what the generator does produce. Delete this file + its route
 * once the art is settled — see AGENTS.md on not leaving one-off debug scaffolding past
 * its usefulness. */

const WALL_COLOR = '#3d3428'
const DIVIDER_COLOR = 'rgba(61,52,40,0.25)'
const ROOM_COLOR = '#dbe7f7'
const CELL_REM = 6

// `bed`/`piano` are excluded here even though `FURNITURE_SPRITES` has entries for both
// (kept for type completeness and as a safety net for a possible future hand-authored
// puzzle) — the procedural generator never actually places either at 1 cell:
// `assignMustGrow` in generator/furniture.ts drops them from the puzzle entirely
// instead of falling back, unlike `rug`/`sofa`/`screen`, which do legitimately end up
// at 1 cell sometimes and so still belong here. This list is "what a generated map can
// actually show", not "every type FURNITURE_SPRITES happens to have an entry for".
const SOLO_ONLY_TYPES = (Object.keys(FURNITURE_SPRITES) as FurnitureType[]).filter(
  (type) => !MUST_GROW_TYPES.includes(type),
)

interface Swatch {
  label: string
  cols: number
  rows: number
  src: string
}

const soloSwatches = computed<Swatch[]>(() =>
  SOLO_ONLY_TYPES.map((type) => ({ label: type, cols: 1, rows: 1, src: FURNITURE_SPRITES[type] })),
)

const rugSprites = CONNECTABLE_FURNITURE_SPRITES.rug!
const bedSprites = CONNECTABLE_FURNITURE_SPRITES.bed!
const pianoSprites = CONNECTABLE_FURNITURE_SPRITES.piano!
const sofaSprites = CONNECTABLE_FURNITURE_SPRITES.sofa!
const screenSprites = CONNECTABLE_FURNITURE_SPRITES.screen!

const multiCellSwatches: Swatch[] = [
  { label: 'rug — h2', cols: 2, rows: 1, src: rugSprites.h2 },
  { label: 'rug — v2', cols: 1, rows: 2, src: rugSprites.v2 },
  { label: 'bed — h2', cols: 2, rows: 1, src: bedSprites.h2 },
  { label: 'bed — v2', cols: 1, rows: 2, src: bedSprites.v2 },
  { label: 'piano — h2', cols: 2, rows: 1, src: pianoSprites.h2 },
  { label: 'piano — v2', cols: 1, rows: 2, src: pianoSprites.v2 },
  { label: 'sofa — h2', cols: 2, rows: 1, src: sofaSprites.h2 },
  { label: 'sofa — v2', cols: 1, rows: 2, src: sofaSprites.v2 },
  { label: 'sofa — L (falta arriba-izda)', cols: 2, rows: 2, src: sofaSprites.L!.topLeft },
  { label: 'sofa — L (falta arriba-dcha)', cols: 2, rows: 2, src: sofaSprites.L!.topRight },
  { label: 'sofa — L (falta abajo-izda)', cols: 2, rows: 2, src: sofaSprites.L!.bottomLeft },
  { label: 'sofa — L (falta abajo-dcha)', cols: 2, rows: 2, src: sofaSprites.L!.bottomRight },
  { label: 'screen — h2', cols: 2, rows: 1, src: screenSprites.h2 },
  { label: 'screen — v2', cols: 1, rows: 2, src: screenSprites.v2 },
  { label: 'screen — h3', cols: 3, rows: 1, src: screenSprites.h3! },
  { label: 'screen — v3', cols: 1, rows: 3, src: screenSprites.v3! },
]

const faceSwatches: Swatch[] = ['short', 'long'].flatMap((style) =>
  Array.from({ length: SKIN_COUNT * HAIR_COUNT }, (_, i) => {
    const skinIdx = Math.floor(i / HAIR_COUNT)
    const hairIdx = i % HAIR_COUNT
    return { label: `${skinIdx}-${hairIdx}-${style}`, cols: 1, rows: 1, src: `/sprites/face-${skinIdx}-${hairIdx}-${style}.png` }
  }),
)
const victimSwatch: Swatch = { label: 'víctima', cols: 1, rows: 1, src: VICTIM_FACE }

function cellStyle() {
  return {
    border: `1px solid ${DIVIDER_COLOR}`,
    backgroundColor: ROOM_COLOR,
    backgroundImage: 'url(/sprites/floor-dither.png)',
    backgroundSize: '16px 16px',
    backgroundRepeat: 'repeat',
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 space-y-10">
    <div>
      <h1 class="text-lg font-bold">/furni — depuración de sprites de mobiliario</h1>
      <p class="text-sm text-[#3d3428]/70">
        Cada muestra usa el mismo tamaño/recorte que BoardGrid.vue — 100% de su celda, mismo fondo de
        suelo — así que el margen respecto al borde es el que trae dibujado el propio sprite
        (`FURNITURE_MARGIN` en gen-sprites.mjs), igual para mobiliario de una celda y multi-celda.
      </p>
    </div>

    <section>
      <h2 class="text-sm font-bold uppercase tracking-wide mb-3">Mobiliario de una celda</h2>
      <div class="flex flex-wrap gap-6">
        <div v-for="s in soloSwatches" :key="s.label" class="flex flex-col items-center gap-1">
          <div
            class="grid"
            :style="{
              gridTemplateColumns: `repeat(${s.cols}, ${CELL_REM}rem)`,
              gridTemplateRows: `repeat(${s.rows}, ${CELL_REM}rem)`,
              border: `3px solid ${WALL_COLOR}`,
            }"
          >
            <div v-for="i in s.cols * s.rows" :key="i" :style="cellStyle()" />
            <img
              :src="s.src"
              :alt="s.label"
              class="[image-rendering:pixelated] opacity-90 object-contain w-full h-full"
              :style="{ gridColumn: `1 / ${s.cols + 1}`, gridRow: `1 / ${s.rows + 1}` }"
            />
          </div>
          <span class="text-xs">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-bold uppercase tracking-wide mb-3">Mobiliario multi-celda</h2>
      <div class="flex flex-wrap gap-6 items-end">
        <div v-for="s in multiCellSwatches" :key="s.label" class="flex flex-col items-center gap-1">
          <div
            class="grid"
            :style="{
              gridTemplateColumns: `repeat(${s.cols}, ${CELL_REM}rem)`,
              gridTemplateRows: `repeat(${s.rows}, ${CELL_REM}rem)`,
              border: `3px solid ${WALL_COLOR}`,
            }"
          >
            <div v-for="i in s.cols * s.rows" :key="i" :style="cellStyle()" />
            <img
              :src="s.src"
              :alt="s.label"
              class="[image-rendering:pixelated] opacity-90 object-fill w-full h-full"
              :style="{ gridColumn: `1 / ${s.cols + 1}`, gridRow: `1 / ${s.rows + 1}` }"
            />
          </div>
          <span class="text-xs text-center max-w-[10rem]">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-bold uppercase tracking-wide mb-3">Caras de sospechosos</h2>
      <div class="flex flex-wrap gap-3">
        <div v-for="s in [victimSwatch, ...faceSwatches]" :key="s.label" class="flex flex-col items-center gap-1">
          <div
            class="grid"
            :style="{
              gridTemplateColumns: `repeat(${s.cols}, ${CELL_REM}rem)`,
              gridTemplateRows: `repeat(${s.rows}, ${CELL_REM}rem)`,
              border: `3px solid ${WALL_COLOR}`,
            }"
          >
            <div v-for="i in s.cols * s.rows" :key="i" :style="cellStyle()" />
            <img
              :src="s.src"
              :alt="s.label"
              class="[image-rendering:pixelated] opacity-90 object-contain w-full h-full"
              :style="{ gridColumn: `1 / ${s.cols + 1}`, gridRow: `1 / ${s.rows + 1}` }"
            />
          </div>
          <span class="text-xs">{{ s.label }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
