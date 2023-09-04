<script setup lang="ts">
//@ts-ignore
import SvgIcon from '@jamescoyle/vue-icon';
import { ref } from 'vue';
import { mdiMine } from '@mdi/js';
import MineBlock from './MineBlock.vue'
import { useGame } from '../composables/useGame'

const props = defineProps<{
  row: number,
  col: number,
  mines: number,
  roomId?: string
}>()

const mines = ref(props.mines)

const { row, col, game, onlineStatus, counter, check, flag, initialize, changeConfig } = useGame({
  row: props.row,
  col: props.col,
  mines: props.mines,
  roomId: props.roomId
})

initialize()

function onClick(r: number, c: number) {
  check(r, c)
}

function onRightClick(r: number, c: number) {
  flag(r, c);
}

function onClickReset() {
  initialize()
}

function onClickLevel(level: number) {
  mines.value = level === 1 ? 10 : level === 2 ? 30 : 50
  changeConfig({
    row: level === 1 ? 9 : level === 2 ? 12 : 15,
    col: level === 1 ? 9 : level === 2 ? 12 : 15,
    mines: mines.value,
  })
}
</script>

<template>
  <div class="flex-end">
    <svg-icon class="icon-mine" type="mdi" :path="mdiMine" />
    {{ `:${mines}` }}
  </div>
  <div v-if="props.roomId">
    <div class="header-row">
      <div :class="{red: onlineStatus === 'disconnect', blue: onlineStatus === 'Your turn'}">{{ onlineStatus }}</div>
      <div>{{ counter }}</div>
    </div>
  </div>
  <div v-else>
    <div class="header-row">
      <a @click="onClickLevel(1)">LEVEL1</a>
      <a @click="onClickLevel(2)">LEVEL2</a>
      <a @click="onClickLevel(3)">LEVEL3</a>
      <a @click="onClickReset">RESET</a>
    </div>
  </div>
  <div class="game-field">
    <div class="flex-center" v-for="r in row" :key="r">
      <MineBlock
        v-for="c in col" 
        :key="c"
        :state="game.fields[r - 1][c - 1]" 
        @click.prevent="onClick(r - 1, c - 1)"
        @click.right.prevent="onRightClick(r - 1, c - 1)"
      />
    </div>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 4px 12px 4px;
}
.game-field {
  max-width: 90vw;
  overflow-x: auto;
}
.flex-center {
  display: flex;
  justify-content: center;
}
.flex-end {
  display: flex;
  justify-content: flex-end;
}
.red {
  color: #cc4444;
}
.blue {
  color: #4444cc;
}
.icon-mine {
  width: 1.1em;
  height: 1.1em;
  color: #444444;
}
</style>
