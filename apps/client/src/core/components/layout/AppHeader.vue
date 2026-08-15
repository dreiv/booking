<script setup lang="ts">
import { ref } from 'vue';
import { MenuIcon, BellIcon, UserCircleIcon } from '@lucide/vue';
import IconButton from '#/core/components/IconButton.vue';
import { cn } from '#/lib/utils';
import { navItems } from '#/core/router/nav-items';
import MobileNavDrawer from './MobileNavDrawer.vue';

const isDrawerOpen = ref(false);
</script>

<template>
  <header
    :class="
      cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between',
        'border-b bg-background px-4',
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

      <RouterLink
        to="/"
        class="rounded-md px-2 py-2 text-lg font-semibold tracking-tight focus-ring"
      >
        <span class="text-foreground">Va</span><span class="text-primary">yo</span>
      </RouterLink>

      <nav class="hidden md:flex md:items-center md:gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          :aria-current="$route.name === item.name ? 'page' : undefined"
          :class="
            cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring',
              $route.name === item.name
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            )
          "
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <IconButton :icon="BellIcon" ariaLabel="Notifications" />
      <IconButton :icon="UserCircleIcon" ariaLabel="Account" />
    </div>
  </header>

  <MobileNavDrawer v-model:open="isDrawerOpen" />
</template>
