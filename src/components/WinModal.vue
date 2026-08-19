<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePuzzleStore } from '../stores/puzzleStore'
import { hueOffsetForSuspect } from '../lib/suspectTint'

const store = usePuzzleStore()
const router = useRouter()

const murderer = computed(() =>
  store.puzzle?.suspects.find((s) => s.id === store.murdererId),
)
const victim = computed(() => store.puzzle?.suspects.find((s) => s.isVictim))

const seconds = computed(() => Math.round(store.elapsedMs / 1000))

function backToList() {
  router.push('/')
}
</script>

<template>
  <div
    v-if="store.won"
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
  >
    <div class="bg-[#fdf8ee] border-2 border-[#3d3428]/30 rounded-md max-w-sm w-full p-6 text-center shadow-xl">
      <p class="text-3xl">🔍</p>
      <h2 class="pixel-heading text-base mt-2 text-[#3d3428]">¡Caso resuelto!</h2>

      <div class="flex items-center justify-center gap-3 mt-4">
        <img
          v-if="murderer"
          src="/sprites/token.png"
          class="w-12 h-12 [image-rendering:pixelated]"
          :style="{ filter: `hue-rotate(${hueOffsetForSuspect(murderer.id)}deg)` }"
          :alt="murderer.name"
        />
        <span class="text-xl text-[#7a6f5c]">→</span>
        <img
          v-if="victim"
          src="/sprites/token-victim.png"
          class="w-12 h-12 [image-rendering:pixelated]"
          :alt="victim.name"
        />
      </div>

      <p class="text-sm text-[#5c5342] mt-3">
        <strong>{{ murderer?.name }}</strong> asesinó a <strong>{{ victim?.name }}</strong>.
      </p>
      <p class="text-xs text-[#7a6f5c] mt-3">
        Tiempo: {{ seconds }}s · Pistas usadas: {{ store.hintsUsed }}
      </p>
      <button
        type="button"
        class="mt-5 w-full rounded-md border-2 border-[#a5813a] bg-[#e8c15a] text-[#5f3c24] font-semibold py-2 text-sm shadow-[0_3px_0_#a5813a]"
        @click="backToList"
      >
        Volver a los casos
      </button>
    </div>
  </div>
</template>
