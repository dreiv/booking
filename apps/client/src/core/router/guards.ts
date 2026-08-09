import type { NavigationGuardWithThis } from 'vue-router';
import { useSessionStore, type UserRole } from '#/core/stores/useSessionStore';
import { Routes } from '#/core/router/routeNames';

export const requireRole: NavigationGuardWithThis<undefined> = (to) => {
  const roles = to.meta.roles as UserRole[] | undefined;
  if (!roles) return true;

  const session = useSessionStore();
  const isLoggedIn = session.currentUserId !== null;
  const hasRole = isLoggedIn && roles.includes(session.currentUserRole);

  if (!hasRole) {
    return { name: Routes.AUTH, query: { redirect: to.fullPath } };
  }

  return true;
};
