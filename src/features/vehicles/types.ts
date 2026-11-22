export type Energy = 'electric' | 'hybrid' | 'petrol' | 'diesel';

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  energy: Energy;
  /** Autonomie annoncée par le constructeur (km), saisie par l'utilisateur. */
  rangeKm: number | null;
  connector: string | null;
  maxChargeKw: number | null;
  isDemo: boolean;
}
