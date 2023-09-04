<script setup lang="ts">
const uuid = window.crypto.randomUUID()
</script>

<template>
  <p>
    <router-link to="/single">
      Single
    </router-link>
  </p>
  <p>
    <router-link :to="`/room/${uuid}`">
      Create Room
    </router-link>
  </p>
</template>
