<script setup lang="ts">
import { computed } from 'vue'
import type { Suspect } from '../types/puzzle'
import { usePuzzleStore } from '../stores/puzzleStore'
import { facePathForSuspect, VICTIM_FACE } from '../lib/suspectFace'

const props = defineProps<{ suspect: Suspect }>()
const store = usePuzzleStore()

const facePath = computed(() =>
  props.suspect.isVictim ? VICTIM_FACE : facePathForSuspect(props.suspect.id, props.suspect.gender),
)

const isSelected = computed(() => store.selectedSuspectId === props.suspect.id)
const isPlaced = computed(() => !!store.placements[props.suspect.id])

function onClick() {
  if (isPlaced.value) {
    store.removeSuspect(props.suspect.id)
  } else {
    store.selectSuspect(props.suspect.id)
  }
}
</script>

<template>
  <button
    type="button"
    class="w-full text-left rounded-md border-2 p-2.5 transition-colors"
    :class="[
      isSelected ? 'border-[#3d3428] bg-[#fdf8ee]' : 'border-transparent bg-[#efe7d5]',
      isPlaced ? 'opacity-60' : '',
      suspect.isVictim ? 'ring-1 ring-[#7a6f5c]' : '',
    ]"
    @click="onClick"
  >
    <div class="flex items-center gap-2">
      <img :src="facePath" class="w-8 h-8 shrink-0 [image-rendering:pixelated]" :alt="suspect.name" />
      <span class="font-semibold text-sm text-[#3d3428]">{{ suspect.name }}</span>
      <span v-if="isPlaced" class="ml-auto text-[0.65rem] text-[#7a6f5c]">colocado</span>
    </div>
    <p class="mt-1 text-xs text-[#5c5342] leading-snug">{{ suspect.clue }}</p>
  </button>
</template>
