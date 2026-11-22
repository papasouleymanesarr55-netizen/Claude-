import {
  CircleUserRound,
  Compass,
  CreditCard,
  EvCharger,
  Heart,
  LayoutDashboard,
  CarFront,
  SquareParking,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string;
  shortLabelKey?: string;
  icon: LucideIcon;
}

const dashboard: NavItem = {
  to: '/',
  labelKey: 'nav.dashboard',
  shortLabelKey: 'nav.home',
  icon: LayoutDashboard,
};
const explorer: NavItem = { to: '/explorer', labelKey: 'nav.explorer', icon: Compass };
const charging: NavItem = {
  to: '/recharge',
  labelKey: 'nav.charging',
  shortLabelKey: 'nav.chargingShort',
  icon: EvCharger,
};
const favorites: NavItem = {
  to: '/favoris',
  labelKey: 'nav.favorites',
  shortLabelKey: 'nav.favoritesShort',
  icon: Heart,
};
const account: NavItem = {
  to: '/compte',
  labelKey: 'nav.account',
  shortLabelKey: 'nav.accountShort',
  icon: CircleUserRound,
};

export const mainNav: NavItem[] = [
  dashboard,
  explorer,
  charging,
  { to: '/parkings', labelKey: 'nav.parking', icon: SquareParking },
  { to: '/services', labelKey: 'nav.services', icon: Wrench },
];

export const personalNav: NavItem[] = [
  favorites,
  { to: '/vehicules', labelKey: 'nav.vehicles', icon: CarFront },
  account,
  { to: '/abonnement', labelKey: 'nav.subscription', icon: CreditCard },
];

/** Cinq entrées de la barre de navigation mobile. */
export const mobileNav: NavItem[] = [dashboard, explorer, charging, favorites, account];
