<script setup lang="ts">
import { ref, onMounted } from 'vue';

const serverMessage = ref('Connecting to server...');

onMounted(async () => {
  try {
    const res = await fetch('/api');
    const data = await res.json();
    serverMessage.value = data.message;
  } catch {
    serverMessage.value = 'Failed to connect to backend server';
  }
});
</script>

<template>
  <main>
    <h1>Booking Client</h1>
    <p>
      Server Status: <strong>{{ serverMessage }}</strong>
    </p>
  </main>
</template>

<style scoped>
main {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  text-align: center;
}
</style>
