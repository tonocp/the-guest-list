<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePuzzleStore } from '../stores/puzzleStore'
import BoardGrid from '../components/BoardGrid.vue'
import SuspectCard from '../components/SuspectCard.vue'
import ActionBar from '../components/ActionBar.vue'
import WinModal from '../components/WinModal.vue'

const route = useRoute()
const router = useRouter()
const store = usePuzzleStore()

const nowMs = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | undefined

const elapsedLabel = computed(() => {
  const ms = store.won ? store.elapsedMs : nowMs.value - store.startedAt
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

async function loadFromRoute() {
  const id = route.params.id as string
  const ok = await store.load(id)
  if (!ok) {
    router.replace('/')
    return
  }
  nowMs.value = Date.now()
}

onMounted(() => {
  loadFromRoute()
  ticker = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  if (ticker) clearInterval(ticker)
})
watch(() => route.params.id, loadFromRoute)
</script>

<template>
  <main v-if="store.puzzle" class="board-layout">
    <header class="area-header flex items-center gap-3 px-4 py-3 border-b-2 border-[#3d3428]/15 md:border-0 md:px-0">
      <button type="button" class="text-[#7a6f5c] text-sm shrink-0" @click="router.push('/')">← Casos</button>
      <h1 class="pixel-heading text-xs text-[#3d3428] flex-1 truncate">{{ store.puzzle.title }}</h1>
      <span class="font-mono text-sm text-[#7a6f5c] tabular-nums shrink-0">{{ elapsedLabel }}</span>
    </header>

    <div class="area-board flex justify-center pt-3 md:pt-0">
      <BoardGrid :puzzle="store.puzzle" />
    </div>

    <section class="area-suspects px-4 md:px-0">
      <h2 class="pixel-heading text-[0.65rem] text-[#7a6f5c] mb-2 sticky top-0 bg-[#e8e0cf] md:static py-1">
        Sospechosos
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-1 gap-2 pb-3">
        <SuspectCard v-for="s in store.puzzle.suspects" :key="s.id" :suspect="s" />
      </div>
    </section>

    <div class="area-actions px-4 pb-3 md:px-0">
      <ActionBar />
    </div>

    <WinModal />
  </main>
  <main v-else class="min-h-dvh flex items-center justify-center text-[#7a6f5c] text-sm">
    Cargando…
  </main>
</template>

<style scoped>
.board-layout {
  display: grid;
  grid-template-areas: 'header' 'board' 'suspects' 'actions';
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  height: 100dvh;
  background: #e8e0cf;
}

.area-header {
  grid-area: header;
}
.area-board {
  grid-area: board;
}
.area-suspects {
  grid-area: suspects;
  min-height: 0;
  overflow-y: auto;
}
.area-actions {
  grid-area: actions;
  border-top: 2px solid rgba(61, 52, 40, 0.15);
  background: #e8e0cf;
  padding-top: 0.75rem;
}

@media (min-width: 768px) {
  .board-layout {
    grid-template-areas: 'header header' 'board suspects' 'board actions';
    grid-template-columns: 1fr 18rem;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: auto;
    max-width: 64rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    gap: 1.5rem;
    background: transparent;
  }
  .area-board {
    align-items: flex-start;
  }
  .area-actions {
    border-top: none;
    background: transparent;
    padding-top: 0;
  }
}
</style>
