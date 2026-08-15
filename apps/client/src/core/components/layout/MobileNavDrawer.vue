<script setup lang="ts">
import { Sheet, SheetContent } from '#/core/components/ui/sheet';
import { navItems } from '#/core/router/nav-items';
import { cn } from '#/lib/utils';

const open = defineModel<boolean>('open', { required: true });
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="left" class="w-64">
      <nav class="flex flex-col gap-1 mt-8">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          :aria-current="$route.name === item.name ? 'page' : undefined"
          :class="
            cn(
              'text-base font-medium transition-colors px-4 py-2',
              $route.name === item.name
                ? 'bg-accent text-foreground font-semibold'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )
          "
          @click="open = false"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </SheetContent>
  </Sheet>
</template>
