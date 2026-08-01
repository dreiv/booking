<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchBookings } from './api/bookings.ts';
import type { Booking } from './api/bookings.ts';

const bookings = ref<Booking[]>([]);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    bookings.value = await fetchBookings();
  } catch {
    error.value = 'Failed to connect to backend server';
  }
});
</script>

<template>
  <main>
    <h1>Booking Client</h1>
    <p v-if="error" role="alert">{{ error }}</p>
    <ul v-else>
      <li v-for="booking in bookings" :key="booking.id">
        {{ booking.guestName }} — ({{ booking.status }})
      </li>
    </ul>
  </main>
</template>
