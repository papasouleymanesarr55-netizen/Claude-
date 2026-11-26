import { useMemo } from 'react';

import { computeMonth, netFrom, type PeriodSummary } from '../domain/calc';
import { selectPremium, useAppStore } from './store';

/** Totaux du mois, recalculés seulement si les données utiles changent. */
export function useMonthSummary(
  year: number,
  month0: number,
): PeriodSummary & { net: number; advanced: boolean } {
  const shifts = useAppStore((s) => s.shifts);
  const days = useAppStore((s) => s.days);
  const rules = useAppStore((s) => s.rules);
  const charges = useAppStore((s) => s.settings.charges);
  const premium = useAppStore(selectPremium);
  return useMemo(() => {
    const advanced = premium && rules.enabled;
    const summary = computeMonth({ shifts, days, rules, advanced: premium }, year, month0);
    return { ...summary, net: netFrom(summary.gross, charges), advanced };
  }, [shifts, days, rules, charges, premium, year, month0]);
}
