<script setup lang="ts">
import type { Component } from 'vue';
import { Button } from '#/core/components/ui/button';
import { cn } from '#/lib/utils';

interface IconButtonProps {
  icon: Component;
  ariaLabel: string;
  variant?: 'default' | 'outline' | 'ghost';
}

withDefaults(defineProps<IconButtonProps>(), { variant: 'ghost' });
</script>

<template>
  <Button :variant="variant" size="icon" :aria-label="ariaLabel" :class="cn('rounded-full')">
    <component :is="icon" class="size-5" />
  </Button>
</template>
