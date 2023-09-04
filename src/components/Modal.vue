<script setup lang="ts">
import { useModal } from '../composables/useModal'

const { isOpen, result, close } = useModal()
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal">
      <div class="modal-card">
        <p>- Result -</p>
        <p>{{ result }}</p>
        <a @click="close">Close</a>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  z-index: 999;
  height: 100vh;
  width: 100vw;
  padding-top: 50vh;
  padding-left: calc(50vw - 100px);
  background-color: rgba(0, 0, 0, .2);
}
.modal-card {
  width: 280px;
  background-color: #ddd;
  text-align: center;
  padding: 8px 16px 16px;
}
</style>
