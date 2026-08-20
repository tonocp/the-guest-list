<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    @click.self="emit('close')"
  >
    <div
      class="bg-[#fdf8ee] border-2 border-[#3d3428]/30 rounded-md max-w-md w-full p-6 max-h-[85vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between gap-3 mb-4">
        <h2 class="pixel-heading text-base text-[#3d3428]">¿Cómo se juega?</h2>
        <button
          type="button"
          class="text-[#7a6f5c] text-2xl leading-none shrink-0"
          aria-label="Cerrar"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div class="space-y-4 text-sm text-[#5c5342] leading-relaxed">
        <p>
          Ha habido un asesinato. Coloca a cada sospechoso en la cuadrícula siguiendo
          sus pistas — el que acabe compartiendo sala con la víctima es el asesino.
        </p>

        <div>
          <p class="font-semibold text-[#3d3428]">Una persona por fila y por columna</p>
          <p>
            Cada sospechoso ocupa una fila y una columna distinta de los demás — como
            piezas en un tablero, nunca dos en la misma línea.
          </p>
        </div>

        <div>
          <p class="font-semibold text-[#3d3428]">Las salas</p>
          <p>
            El tablero se divide en salas irregulares. Varias personas pueden estar en
            la misma sala a la vez — no hay límite de ocupación.
          </p>
        </div>

        <div>
          <p class="font-semibold text-[#3d3428]">"Junto a" en las pistas</p>
          <p>
            Significa estar en la misma sala, o en la casilla justo al lado — aunque
            estén en extremos opuestos de una sala con forma rara, cuenta igual.
          </p>
        </div>

        <div>
          <p class="font-semibold text-[#3d3428]">La víctima</p>
          <p>
            No trae pista propia — se deduce por eliminación, colocando a todos los
            demás primero. Quien acabe compartiendo su sala es el asesino.
          </p>
        </div>

        <div>
          <p class="font-semibold text-[#3d3428]">Controles</p>
          <p>
            Toca un sospechoso para seleccionarlo, toca una casilla para colocarlo (o
            para quitarlo si ya hay alguien). Resetear, Deshacer y Pista están siempre
            a mano.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="mt-5 w-full rounded-md border-2 border-[#a5813a] bg-[#e8c15a] text-[#5f3c24] font-semibold py-2 text-sm shadow-[0_3px_0_#a5813a]"
        @click="emit('close')"
      >
        Entendido
      </button>
    </div>
  </div>
</template>
