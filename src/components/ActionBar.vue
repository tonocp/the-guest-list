<script setup lang="ts">
import { usePuzzleStore } from '../stores/puzzleStore'

const store = usePuzzleStore()
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      type="button"
      class="flex flex-col items-center gap-1 rounded-md border-2 border-[#3d3428]/20 bg-[#fdf8ee] py-2 text-[#3d3428] disabled:opacity-40"
      @click="store.clearAll()"
    >
      <span class="text-lg leading-none">🗑️</span>
      <span class="text-[0.65rem] font-semibold uppercase tracking-wide">Resetear</span>
    </button>

    <button
      type="button"
      class="flex flex-col items-center gap-1 rounded-md border-2 border-[#3d3428]/20 bg-[#fdf8ee] py-2 text-[#3d3428] disabled:opacity-40"
      :disabled="store.history.length === 0"
      @click="store.undo()"
    >
      <span class="text-lg leading-none">↩️</span>
      <span class="text-[0.65rem] font-semibold uppercase tracking-wide">Deshacer</span>
    </button>

    <button
      type="button"
      class="relative flex flex-col items-center gap-1 rounded-md border-2 border-[#a5813a] bg-[#e8c15a] py-2 text-[#5f3c24] shadow-[0_3px_0_#a5813a]"
      @click="store.hint()"
    >
      <span class="text-lg leading-none">💡</span>
      <span class="text-[0.65rem] font-semibold uppercase tracking-wide">Pista</span>
      <span
        v-if="store.hintsUsed > 0"
        class="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#3d3428] text-white text-[0.6rem] font-bold flex items-center justify-center"
      >
        {{ store.hintsUsed }}
      </span>
    </button>
  </div>
</template>
