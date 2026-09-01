<script setup lang="ts">
import { computed } from 'vue'
import type { Position, Puzzle } from '../types/puzzle'
import { usePuzzleStore } from '../stores/puzzleStore'
import { cellKey, getCell, gridLine, multiCellFurniturePlacements } from '../lib/gridLogic'
import { CONNECTABLE_FURNITURE_SPRITES, FURNITURE_SPRITES } from '../lib/furnitureIcons'
import { facePathForSuspect, VICTIM_FACE } from '../lib/suspectFace'

const props = defineProps<{ puzzle: Puzzle }>()
const store = usePuzzleStore()

const ROOM_COLORS = ['#dbe7f7', '#f3ddef', '#d9f0e3', '#fbe7cf', '#e6dff5', '#fdf1c7']

const WALL_COLOR = '#3d3428'
const DIVIDER_COLOR = 'rgba(61,52,40,0.25)'

const roomColorMap = computed(() => {
  const map: Record<string, string> = {}
  props.puzzle.rooms.forEach((r, i) => {
    map[r.id] = ROOM_COLORS[i % ROOM_COLORS.length]
  })
  return map
})

const roomLabelCell = computed(() => {
  const seen = new Set<string>()
  const map: Record<string, string> = {}
  for (const cell of props.puzzle.cells) {
    if (!seen.has(cell.roomId)) {
      seen.add(cell.roomId)
      map[`${cell.row}-${cell.col}`] = cell.roomId
    }
  }
  return map
})

const conflictedSuspectIds = computed(() => new Set(store.conflicts.map((c) => c.suspectId)))

function suspectById(id: string) {
  return props.puzzle.suspects.find((s) => s.id === id)
}

const multiCellPlacements = computed(() => multiCellFurniturePlacements(props.puzzle))

const multiCellPieces = computed(() => {
  return multiCellPlacements.value.map((piece) => {
    const sprites = CONNECTABLE_FURNITURE_SPRITES[piece.type]
    const src =
      piece.shape === 'L'
        ? (sprites?.L?.[piece.missingCorner!] ?? FURNITURE_SPRITES[piece.type])
        : (sprites?.[piece.shape as 'h2' | 'v2' | 'h3' | 'v3'] ?? FURNITURE_SPRITES[piece.type])
    return {
      key: `${piece.type}-${piece.cells[0].row}-${piece.cells[0].col}`,
      src,
      gridColumn: piece.gridColumn,
      gridRow: piece.gridRow,
    }
  })
})

const multiCellCellKeys = computed(() => {
  const keys = new Set<string>()
  for (const piece of multiCellPlacements.value) {
    for (const c of piece.cells) keys.add(cellKey(c.row, c.col))
  }
  return keys
})

/** Placed suspects as their own grid overlays, drawn on top of the cell and furniture
 * layers so a face is never hidden by a spanning piece. */
const placedSuspects = computed(() => {
  return Object.entries(store.placements)
    .filter((e): e is [string, Position] => e[1] !== null)
    .map(([suspectId, pos]) => ({ suspectId, pos, suspect: suspectById(suspectId)! }))
})

function cellStyle(row: number, col: number) {
  const cell = getCell(props.puzzle, row, col)!
  const neighbor = (r: number, c: number) => getCell(props.puzzle, r, c)
  const thick = `3px solid ${WALL_COLOR}`
  const thin = `1px solid ${DIVIDER_COLOR}`

  const top = neighbor(row - 1, col)
  const left = neighbor(row, col - 1)
  const right = neighbor(row, col + 1)
  const bottom = neighbor(row + 1, col)

  return {
    gridColumn: gridLine(col),
    gridRow: gridLine(row),
    borderTop: !top || top.roomId !== cell.roomId ? thick : thin,
    borderLeft: !left || left.roomId !== cell.roomId ? thick : thin,
    borderRight: !right || right.roomId !== cell.roomId ? thick : thin,
    borderBottom: !bottom || bottom.roomId !== cell.roomId ? thick : thin,
    backgroundColor: roomColorMap.value[cell.roomId],
    backgroundImage: 'url(/sprites/floor-dither.png)',
    backgroundSize: '16px 16px',
    backgroundRepeat: 'repeat',
  }
}

function onCellClick(row: number, col: number) {
  store.placeAt(row, col)
}
</script>

<template>
  <div
    class="grid mx-auto select-none rounded-sm shadow-[0_6px_0_rgba(61,52,40,0.35)]"
    :style="{
      gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
      gridTemplateRows: `repeat(${puzzle.size}, 1fr)`,
      aspectRatio: '1 / 1',
      width: `min(92vw, ${puzzle.size * 4}rem)`,
      border: `3px solid ${WALL_COLOR}`,
    }"
  >
    <div
      v-for="cell in puzzle.cells"
      :key="`${cell.row}-${cell.col}`"
      class="relative flex items-center justify-center cursor-pointer overflow-hidden"
      :style="cellStyle(cell.row, cell.col)"
      @click="onCellClick(cell.row, cell.col)"
    >
      <span
        v-if="roomLabelCell[`${cell.row}-${cell.col}`]"
        class="absolute top-0.5 left-1 text-[0.5rem] font-bold uppercase tracking-wide text-[#3d3428]/60 leading-none pointer-events-none"
      >
        {{ puzzle.rooms.find((r) => r.id === cell.roomId)?.name }}
      </span>

      <img
        v-if="cell.furniture && !multiCellCellKeys.has(cellKey(cell.row, cell.col))"
        :src="FURNITURE_SPRITES[cell.furniture]"
        class="w-full h-full object-contain opacity-90 [image-rendering:pixelated] pointer-events-none"
        :alt="cell.furniture"
      />
    </div>

    <img
      v-for="piece in multiCellPieces"
      :key="piece.key"
      :src="piece.src"
      class="w-full h-full object-fill opacity-90 [image-rendering:pixelated] pointer-events-none"
      :style="{ gridColumn: piece.gridColumn, gridRow: piece.gridRow }"
      :alt="piece.key"
    />

    <div
      v-for="p in placedSuspects"
      :key="p.suspectId"
      class="relative flex items-center justify-center pointer-events-none"
      :style="{ gridColumn: gridLine(p.pos.col), gridRow: gridLine(p.pos.row) }"
    >
      <img
        :src="p.suspect.isVictim ? VICTIM_FACE : facePathForSuspect(p.suspectId, p.suspect.gender)"
        class="w-[78%] h-[78%] object-contain [image-rendering:pixelated] drop-shadow-md"
        :style="{
          filter: conflictedSuspectIds.has(p.suspectId) ? 'drop-shadow(0 0 4px #dc2626) drop-shadow(0 0 4px #dc2626)' : '',
        }"
        :alt="p.suspect.name"
      />
      <span
        v-if="!p.suspect.isVictim"
        class="absolute bottom-[6%] right-[6%] w-[34%] aspect-square rounded-full bg-[#3d3428] text-white flex items-center justify-center text-[0.5rem] font-bold leading-none ring-1 ring-[#fdf8ee]"
      >
        {{ p.suspect.name.charAt(0) }}
      </span>
    </div>
  </div>
</template>
