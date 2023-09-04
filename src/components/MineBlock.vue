<script setup lang="ts">
//@ts-ignore
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiFlag, mdiMine } from '@mdi/js';
import type { BlockState } from '../composables/useGame'

defineProps<{ state: BlockState }>()

const colors = ['#4444cc', '#44cc44', '#cc4444', '#cccc44', '#cc44cc', '#44cccc', '#444444', '#000000']
</script>

<template>
  <button
    class="mine-button"
    :class="{ open: state.open }"
  >
    <template v-if="state.open">
      <svg-icon v-if="state.mine" class="icon mine" type="mdi" :path="mdiMine" />
      <span v-else-if="state.mineNumber !== 0" :style="`color: ${colors[state.mineNumber - 1]}`">{{ state.mineNumber }}</span>
    </template>
    <svg-icon v-else-if="state.flag" class="icon flag" type="mdi" :path="mdiFlag" />
    <div v-else />
  </button>
</template>

<style scoped>
.mine-button {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: PixelMplus10-Bold;
  border: 1px solid rgba(0, 0, 0, .12);
  padding: 0;
  margin: 1px;
  min-width: 2rem;
  min-height: 2rem;
  outline: 0;
}
.mine-button.open {
  background-color: #fff;
}
.icon {
  width: 1.1em;
  height: 1.1em;
}
.icon.flag {
  color: #cc4444;
}
.icon.mine {
  color: #444444;
}
</style>