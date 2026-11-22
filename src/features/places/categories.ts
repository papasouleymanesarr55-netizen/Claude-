import {
  Disc3,
  Droplets,
  EvCharger,
  Fuel,
  SquareParking,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId } from './types';

export interface CategoryDef {
  id: CategoryId;
  icon: LucideIcon;
}

export const categories: CategoryDef[] = [
  { id: 'charging', icon: EvCharger },
  { id: 'fuel', icon: Fuel },
  { id: 'parking', icon: SquareParking },
  { id: 'garage', icon: Wrench },
  { id: 'wash', icon: Droplets },
  { id: 'tyres', icon: Disc3 },
];

export const categoryIds = categories.map((c) => c.id);

export function getCategory(id: CategoryId): CategoryDef {
  const found = categories.find((c) => c.id === id);
  if (!found) throw new Error(`Catégorie inconnue : ${id}`);
  return found;
}

export function isCategoryId(value: string): value is CategoryId {
  return (categoryIds as string[]).includes(value);
}
