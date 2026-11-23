export interface ValueWithUnit {
  value: string;
  unit: string;
}

const LOCALE = 'fr-FR';

/** Distance lisible : « 650 m », « 1,5 km », « 12 km ». */
export function formatDistance(meters: number): ValueWithUnit {
  if (meters < 1000) {
    const rounded = Math.max(10, Math.round(meters / 10) * 10);
    return { value: new Intl.NumberFormat(LOCALE).format(rounded), unit: 'm' };
  }
  const km = meters / 1000;
  const digits = km < 10 ? 1 : 0;
  return {
    value: new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(km),
    unit: 'km',
  };
}

/** Prix : « 1,79 » + « €/L ». */
export function formatPrice(amount: number, unit: string, decimals = 2): ValueWithUnit {
  return {
    value: new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount),
    unit: `€${unit ? `/${unit}` : ''}`,
  };
}

export function joinValue({ value, unit }: ValueWithUnit): string {
  return `${value}\u202f${unit}`;
}
