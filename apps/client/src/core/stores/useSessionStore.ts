import { ref } from 'vue';
import { defineStore } from 'pinia';

export type UserRole = 'guest' | 'host' | 'admin';

export const useSessionStore = defineStore('session', () => {
  const currentUserId = ref<number | null>(null);
  const currentUserRole = ref<UserRole>('guest');

  function authHeaders(): HeadersInit {
    const headers: Record<string, string> = {};
    if (currentUserId.value !== null) headers['x-user-id'] = String(currentUserId.value);
    if (currentUserRole.value !== 'guest') headers['x-user-role'] = currentUserRole.value;
    return headers;
  }

  return { currentUserId, currentUserRole, authHeaders };
});
