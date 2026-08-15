import { Routes } from './routeNames';

export const navItems = [
  { to: { name: Routes.BOOKINGS }, name: Routes.BOOKINGS, label: 'Bookings' },
  { to: { name: Routes.FAVORITES }, name: Routes.FAVORITES, label: 'Favorites' },
] as const;
