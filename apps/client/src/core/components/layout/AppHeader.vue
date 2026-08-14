<script setup lang="ts">
import { ref } from 'vue';
import { MenuIcon, BellIcon, UserCircleIcon } from '@lucide/vue';
import IconButton from '#/core/components/IconButton.vue';
import { cn } from '#/lib/utils';
import MobileNavDrawer from './MobileNavDrawer.vue';

const isDrawerOpen = ref(false);
</script>

<template>
  <header
    :class="
      cn(
        'sticky top-0 z-40 flex items-center justify-between',
        'border-b bg-background px-4 py-3',
        'md:px-6',
      )
    "
  >
    <div class="flex items-center gap-2 md:gap-6">
      <IconButton
        :icon="MenuIcon"
        ariaLabel="Open menu"
        class="md:hidden"
        @click="isDrawerOpen = true"
      />

      <RouterLink to="/" class="font-semibold text-lg"> YourLogo </RouterLink>

      <nav class="hidden md:flex md:items-center md:gap-6">
        <RouterLink to="/bookings" class="text-sm font-medium">Bookings</RouterLink>
        <RouterLink to="/favorites" class="text-sm font-medium">Favorites</RouterLink>
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <IconButton :icon="BellIcon" ariaLabel="Notifications" />
      <IconButton :icon="UserCircleIcon" ariaLabel="Account" />
    </div>
  </header>

  <MobileNavDrawer v-model:open="isDrawerOpen" />
</template>
