<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '#/core/components/layout/AppHeader.vue';
</script>

<template>
  <a
    href="#main-content"
    class="absolute -top-12 left-0 z-50 px-4 py-2 bg-text-h text-bg font-semibold transition-[top] duration-200 ease-out focus:top-0"
  >
    Skip to main content
  </a>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <main
      id="main-content"
      tabindex="-1"
      class="grow container mx-auto px-6 py-10 focus:outline-none"
    >
      <RouterView />
    </main>
  </div>
</template>
