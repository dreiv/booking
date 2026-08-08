<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchBookings, createBooking } from './api/bookings.ts';
import type { Booking, CreateBookingInput } from './api/bookings.ts';
import { currentUserId, currentUserRole } from './api/identity.ts';

const bookings = ref<Booking[]>([]);
const listError = ref<string | null>(null);
const isLoading = ref(false);

const form = ref({
  hotelId: '',
  roomTypeId: '',
  guestEmail: '',
  guestFirstName: '',
  guestLastName: '',
  checkIn: '',
  checkOut: '',
});
const createError = ref<string | null>(null);
const isCreating = ref(false);

function guestFullName(booking: Booking): string {
  const name = [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(' ');
  return name || 'Guest';
}

async function loadBookings() {
  isLoading.value = true;
  listError.value = null;
  try {
    const result = await fetchBookings();
    bookings.value = result.data;
  } catch (err) {
    listError.value = err instanceof Error ? err.message : 'Failed to connect to backend server';
  } finally {
    isLoading.value = false;
  }
}

async function submitBooking() {
  if (currentUserId.value === null) {
    createError.value = 'Set a user id above before creating a booking';
    return;
  }

  const input: CreateBookingInput = {
    hotelId: Number(form.value.hotelId),
    roomTypeId: Number(form.value.roomTypeId),
    userId: currentUserId.value,
    guestEmail: form.value.guestEmail,
    guestFirstName: form.value.guestFirstName || undefined,
    guestLastName: form.value.guestLastName || undefined,
    checkIn: form.value.checkIn,
    checkOut: form.value.checkOut,
  };

  isCreating.value = true;
  createError.value = null;
  try {
    await createBooking(input);
    await loadBookings();
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create booking';
  } finally {
    isCreating.value = false;
  }
}

onMounted(loadBookings);
</script>

<template>
  <main>
    <h1>Booking Client</h1>

    <!-- Placeholder for real auth: the server reads identity off these headers. -->
    <section aria-label="Current user">
      <label>
        User ID
        <input v-model.number="currentUserId" type="number" min="1" placeholder="e.g. 1" />
      </label>
      <label>
        Role
        <select v-model="currentUserRole">
          <option value="guest">guest</option>
          <option value="host">host</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <button type="button" @click="loadBookings">Refresh</button>
    </section>

    <section aria-label="Bookings">
      <p v-if="isLoading">Loading…</p>
      <p v-else-if="listError" role="alert">{{ listError }}</p>
      <ul v-else>
        <li v-for="booking in bookings" :key="booking.bookingId">
          {{ guestFullName(booking) }} — {{ booking.checkIn }} to {{ booking.checkOut }} ({{
            booking.status
          }})
        </li>
      </ul>
    </section>

    <section aria-label="Create a booking">
      <h2>New booking</h2>
      <form @submit.prevent="submitBooking">
        <label>
          Hotel ID
          <input v-model="form.hotelId" type="number" required />
        </label>
        <label>
          Room Type ID
          <input v-model="form.roomTypeId" type="number" required />
        </label>
        <label>
          Guest Email
          <input v-model="form.guestEmail" type="email" required />
        </label>
        <label>
          Guest First Name
          <input v-model="form.guestFirstName" type="text" />
        </label>
        <label>
          Guest Last Name
          <input v-model="form.guestLastName" type="text" />
        </label>
        <label>
          Check In
          <input v-model="form.checkIn" type="date" required />
        </label>
        <label>
          Check Out
          <input v-model="form.checkOut" type="date" required />
        </label>
        <button type="submit" :disabled="isCreating">
          {{ isCreating ? 'Creating…' : 'Create booking' }}
        </button>
        <p v-if="createError" role="alert">{{ createError }}</p>
      </form>
    </section>
  </main>
</template>
