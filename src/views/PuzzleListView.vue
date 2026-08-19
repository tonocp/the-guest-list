<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Difficulty } from '../types/puzzle'
import { puzzles, registerGeneratedPuzzle } from '../data/puzzles'
import { generatePuzzle } from '../lib/generator/generatePuzzle'
import { usePuzzleStore } from '../stores/puzzleStore'

const router = useRouter()
const store = usePuzzleStore()

const generating = ref<Difficulty | null>(null)
const generateError = ref(false)

function openPuzzle(id: string) {
  router.push(`/play/${id}`)
}

async function generateAndPlay(difficulty: Difficulty) {
  generating.value = difficulty
  generateError.value = false
  try {
    const puzzle = generatePuzzle({ difficulty })
    registerGeneratedPuzzle(puzzle)
    router.push(`/play/${puzzle.id}`)
  } catch {
    generateError.value = true
  } finally {
    generating.value = null
  }
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  'muy-facil': 'Muy fácil',
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
  experto: 'Experto',
}

const DIFFICULTIES: Difficulty[] = ['muy-facil', 'facil', 'medio', 'dificil', 'experto']
</script>

<template>
  <main class="max-w-2xl mx-auto p-4">
    <header class="mb-6 text-center">
      <h1 class="pixel-heading text-2xl text-[#3d3428]">🔍 MurDoku</h1>
      <p class="text-sm text-[#7a6f5c] mt-2">Elige un caso para investigar</p>
    </header>

    <div class="grid gap-3">
      <button
        v-for="p in puzzles"
        :key="p.id"
        type="button"
        class="text-left rounded-md border-2 border-[#3d3428]/20 bg-[#fdf8ee] p-4 shadow-[0_3px_0_rgba(61,52,40,0.2)] hover:border-[#3d3428]/50 transition-colors"
        @click="openPuzzle(p.id)"
      >
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-[#3d3428]">{{ p.title }}</h2>
          <span v-if="store.isPuzzleCompleted(p.id)" class="text-emerald-700 text-sm">✔ resuelto</span>
        </div>
        <p class="text-xs text-[#7a6f5c] mt-1">
          {{ DIFFICULTY_LABEL[p.difficulty] }} · {{ p.size }}x{{ p.size }} · {{ p.suspects.length }} sospechosos
        </p>
      </button>
    </div>

    <section class="mt-8">
      <h2 class="pixel-heading text-xs text-[#7a6f5c] mb-2">Generar un caso nuevo</h2>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          v-for="d in DIFFICULTIES"
          :key="d"
          type="button"
          class="rounded-md border-2 border-[#3d3428]/20 bg-[#fdf8ee] py-2 text-sm font-semibold text-[#3d3428] disabled:opacity-50"
          :disabled="generating !== null"
          @click="generateAndPlay(d)"
        >
          {{ generating === d ? '…' : DIFFICULTY_LABEL[d] }}
        </button>
      </div>
      <p v-if="generateError" class="text-xs text-red-700 mt-2">
        No se pudo generar el caso, inténtalo de nuevo.
      </p>
    </section>
  </main>
</template>
