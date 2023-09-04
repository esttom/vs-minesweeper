<script setup lang="ts">
import { useRoute } from 'vue-router'
import { provideSupabase } from './composables/useSupabase'
import { provideModal } from './composables/useModal'
import ResultModal from './components/Modal.vue'

const route = useRoute()

provideSupabase()
provideModal()
</script>

<template>
  <ResultModal />
  
  <div v-if="route.path !== '/'" class="back">
    <router-link to="/">
      &lt;- Back
    </router-link>
  </div>
  <h2 class="title">
    VS Minesweeper
  </h2>
  <router-view />
</template>

<style scoped>
.title {
  padding-bottom: 4px;
  color: rgba(42, 42, 42, .82);
}
.back {
  display: flex;
  justify-content: start;
}
</style>
