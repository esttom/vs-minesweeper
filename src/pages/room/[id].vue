<script setup lang="ts">
import { ref } from 'vue';
import GameStage from '../../components/Game.vue'

defineProps<{id: string}>()

const linkVisible = ref(false)

function onClickInvite() {
  navigator.clipboard.writeText(window.location.href)
  linkVisible.value = true
  setTimeout(() => linkVisible.value = false, 1000)
}
</script>

<template>
  <p>
    <a class="invite" @click="onClickInvite">
      Invite
    </a>
    <div v-if="linkVisible" class="link-copy">LINK COPIED!</div>
  </p>
  <GameStage :row="10" :col="10" :mines="15" :room-id="id"  />
</template>

<style scoped>
.invite {
  cursor: pointer;
}
.link-copy {
  height: 2rem;
  position: relative;
  top: 2.5rem;
  margin-top: -2rem;
}
</style>
