import { createRouter, createWebHistory } from 'vue-router'
import PuzzleListView from '../views/PuzzleListView.vue'
import PlayView from '../views/PlayView.vue'
import FurnitureDebugView from '../views/FurnitureDebugView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'list', component: PuzzleListView },
    { path: '/play/:id', name: 'play', component: PlayView },
    // Debug-only, not linked from the UI — see FurnitureDebugView.vue's doc comment.
    { path: '/furni', name: 'furniture-debug', component: FurnitureDebugView },
  ],
})
