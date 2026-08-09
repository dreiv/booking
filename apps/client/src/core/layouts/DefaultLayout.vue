<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- TODO: NavBar goes here once the component library exists -->
    <main class="grow container mx-auto px-6 py-10">
      <RouterView />
    </main>
  </div>
</template>
