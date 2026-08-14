<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '#/core/components/layout/AppHeader.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <main class="grow container mx-auto px-6 py-10">
      <RouterView />
    </main>
  </div>
</template>
