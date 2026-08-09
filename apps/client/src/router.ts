import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '#/core/layouts/DefaultLayout.vue';
import { requireRole } from '#/core/router/guards';
import { Routes } from '#/core/router/routeNames';

export { Routes };

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: Routes.AUTH,
      component: () => import('#/domains/auth/views/LoginView.vue'),
    },
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: Routes.GUEST,
          component: () => import('#/domains/guest/views/GuestHomeView.vue'),
        },
        {
          path: 'checkout',
          name: Routes.CHECKOUT,
          component: () => import('#/domains/guest/views/CheckoutView.vue'),
          meta: { roles: ['guest', 'host', 'admin'] },
        },
        {
          path: 'admin',
          name: Routes.ADMIN,
          component: () => import('#/domains/admin/views/AdminDashboardView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'host',
          name: Routes.HOST,
          component: () => import('#/domains/host/views/HostDashboardView.vue'),
          meta: { roles: ['host', 'admin'] },
        },
      ],
    },
    {
      path: '/error',
      name: Routes.ERROR,
      component: () => import('#/core/views/ErrorView.vue'),
    },
    {
      path: '/:catchAll(.*)*',
      name: Routes.NOT_FOUND,
      component: () => import('#/core/views/NotFoundView.vue'),
    },
  ],
});

router.beforeEach(requireRole);

export default router;
