<script setup lang="ts">
import { cn } from '#/lib/utils';
</script>

<template>
  <footer :class="cn('border-t bg-background py-4 w-full')">
    <div class="container mx-auto px-4 md:px-6">
      <div class="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
        <p class="text-sm font-medium text-foreground">© 2026 Booking Co.</p>
        <nav class="flex gap-4 text-sm text-muted-foreground">
          <a href="#" class="hover:text-foreground">Terms</a>
          <a href="#" class="hover:text-foreground">Privacy</a>
          <a href="#" class="hover:text-foreground">Support</a>
        </nav>
      </div>
    </div>
  </footer>
</template>
