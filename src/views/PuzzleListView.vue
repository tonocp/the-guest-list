<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Difficulty } from '../types/puzzle'
import { generatePuzzle } from '../lib/generator/generatePuzzle'
import { gameRepository, type SavedGame } from '../lib/persistence'

const router = useRouter()

const games = ref<SavedGame[]>([])
const loading = ref(true)
const generating = ref<Difficulty | null>(null)
const generateError = ref(false)

async function refresh() {
  const list = await gameRepository.list()
  games.value = list.sort((a, b) => b.updatedAt - a.updatedAt)
}

onMounted(async () => {
  await refresh()
  loading.value = false
})

function openGame(id: string) {
  router.push(`/play/${id}`)
}

async function removeGame(event: Event, id: string) {
  event.stopPropagation()
  await gameRepository.remove(id)
  await refresh()
}

async function generateAndPlay(difficulty: Difficulty) {
  generating.value = difficulty
  generateError.value = false
  try {
    const id = crypto.randomUUID()
    const seed = Math.floor(Math.random() * 2 ** 31)
    const puzzle = generatePuzzle({ difficulty, seed, id })

    const now = Date.now()
    await gameRepository.save({
      id: puzzle.id,
      difficulty: puzzle.difficulty,
      seed,
      title: puzzle.title,
      size: puzzle.size,
      suspectsCount: puzzle.suspects.length,
      placements: Object.fromEntries(puzzle.suspects.map((s) => [s.id, null])),
      hintsUsed: 0,
      won: false,
      elapsedMs: 0,
      updatedAt: now,
    })

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
      <h1 class="pixel-heading text-2xl text-[#3d3428]">🔍 The Guest List</h1>
      <p class="text-sm text-[#7a6f5c] mt-2">Tus casos</p>
    </header>

    <p v-if="!loading && games.length === 0" class="text-center text-sm text-[#7a6f5c] py-6">
      Todavía no tienes ningún caso. Genera uno abajo para empezar.
    </p>

    <div v-else class="grid gap-3">
      <button
        v-for="g in games"
        :key="g.id"
        type="button"
        class="text-left rounded-md border-2 border-[#3d3428]/20 bg-[#fdf8ee] p-4 shadow-[0_3px_0_rgba(61,52,40,0.2)] hover:border-[#3d3428]/50 transition-colors"
        @click="openGame(g.id)"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-semibold text-[#3d3428]">{{ g.title }}</h2>
          <div class="flex items-center gap-2 shrink-0">
            <span v-if="g.won" class="text-emerald-700 text-sm">✔ resuelto</span>
            <span v-else class="text-[#7a6f5c] text-sm">en progreso</span>
            <button
              type="button"
              class="text-[#7a6f5c] hover:text-red-700 text-xs px-1"
              title="Borrar caso"
              @click="removeGame($event, g.id)"
            >
              🗑️
            </button>
          </div>
        </div>
        <p class="text-xs text-[#7a6f5c] mt-1">
          {{ DIFFICULTY_LABEL[g.difficulty] }} · {{ g.size }}x{{ g.size }} · {{ g.suspectsCount }} sospechosos
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
