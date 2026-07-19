<script setup lang="ts">
import { ref, onMounted } from "vue";

const statusMessage = ref("Connecting to server...");
const statusColor = ref("#fff");

async function checkBackend() {
  try {
    const response = await fetch("/api/"); // Routes through proxy to backend
    const data = await response.json();
    statusMessage.value = `Server response: "${data.message}"`;
    statusColor.value = "#4ade80"; // Green
  } catch (error) {
    statusMessage.value = "Failed to connect to backend server.";
    statusColor.value = "#f87171"; // Red
  }
}

onMounted(() => {
  checkBackend();
});
</script>

<template>
  <div class="container">
    <h1>Booking Client Active</h1>
    <p :style="{ color: statusColor }">{{ statusMessage }}</p>
  </div>
</template>

<style scoped>
.container {
  /* Using global styles from your existing css */
  text-align: center;
  padding: 2rem;
}
</style>
