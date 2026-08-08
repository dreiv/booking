import { ref } from 'vue';

export type UserRole = 'guest' | 'host' | 'admin';

/**
 * Stand-in for real auth. The server's `authenticate` middleware is a documented
 * placeholder that reads identity off `x-user-id` / `x-user-role` headers — this
 * module holds whatever the client should send until real auth exists.
 */
export const currentUserId = ref<number | null>(null);
export const currentUserRole = ref<UserRole>('guest');

export function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (currentUserId.value !== null) headers['x-user-id'] = String(currentUserId.value);
  if (currentUserRole.value !== 'guest') headers['x-user-role'] = currentUserRole.value;
  return headers;
}
