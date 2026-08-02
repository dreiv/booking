<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchBookings } from './api/bookings.ts';
import type { Booking } from './api/bookings.ts';

const bookings = ref<Booking[]>([]);
const error = ref<string | null>(null);

function guestFullName(booking: Booking): string {
  const name = [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(' ');
  return name || 'Guest';
}

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
      <li v-for="booking in bookings" :key="booking.bookingId">
        {{ guestFullName(booking) }} — ({{ booking.status }})
      </li>
    </ul>
  </main>
</template>
