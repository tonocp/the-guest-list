import { createRouter, createWebHistory } from 'vue-router'
import PuzzleListView from '../views/PuzzleListView.vue'
import PlayView from '../views/PlayView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'list', component: PuzzleListView },
    { path: '/play/:id', name: 'play', component: PlayView },
  ],
})
