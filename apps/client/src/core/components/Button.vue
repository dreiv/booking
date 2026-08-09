<script setup lang="ts">
export type ButtonVariant = 'primary' | 'secondary';

const {
  variant = 'primary',
  disabled = false,
  type = 'button',
} = defineProps<{
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>();

defineEmits<{ click: [MouseEvent] }>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
    :class="
      variant === 'primary'
        ? 'bg-accent text-white hover:brightness-110 active:brightness-95'
        : 'border border-accent-border text-accent-text bg-accent-bg hover:bg-accent/10 active:bg-accent/15'
    "
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
