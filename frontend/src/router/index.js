import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GenerateView from '../views/GenerateView.vue'
import PayView from '../views/PayView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/generate/:id',
    name: 'generate',
    component: GenerateView,
    props: true
  },
  {
    path: '/pay/:id',
    name: 'pay',
    component: PayView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router