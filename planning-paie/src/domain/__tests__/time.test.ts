import { easterSunday, frenchHolidays, isHoliday } from '../holidays';
import {
  addDays,
  isDayKey,
  isoWeek,
  isoWeekStart,
  normalizeTimeInput,
  parseHHMM,
  toHHMM,
} from '../time';
import { formatHours, formatMoney, parseDecimal } from '../format';

describe('heures', () => {
  it('lit et écrit HH:MM', () => {
    expect(parseHHMM('08:30')).toBe(510);
    expect(parseHHMM('8:05')).toBe(485);
    expect(parseHHMM('24:00')).toBeNull();
    expect(toHHMM(510)).toBe('08:30');
  });
  it('valide les clés de jour', () => {
    expect(isDayKey('2026-02-29')).toBe(false);
    expect(isDayKey('2028-02-29')).toBe(true);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30'); // passage à l'heure d'été
  });
});

describe('semaines ISO', () => {
  it.each([
    ['2026-01-01', 2026, 1],
    ['2027-01-01', 2026, 53],
    ['2026-10-06', 2026, 41],
    ['2024-12-30', 2025, 1],
  ])('%s → semaine %i-%i', (key, year, week) => {
    const [y, m, d] = key.split('-').map(Number);
    expect(isoWeek(new Date(y!, m! - 1, d!))).toEqual({ year, week });
  });
  it('trouve le lundi', () => {
    expect(isoWeekStart('2026-10-04')).toBe('2026-09-28');
    expect(isoWeekStart('2026-10-05')).toBe('2026-10-05');
  });
});

describe('jours fériés', () => {
  it('calcule Pâques', () => {
    expect(easterSunday(2025)).toBe('2025-04-20');
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
  });
  it('liste les 11 jours fériés de 2026', () => {
    const h = frenchHolidays(2026);
    expect(h.size).toBe(11);
    expect(h.get('2026-04-06')).toBe('easterMonday');
    expect(h.get('2026-05-14')).toBe('ascension');
    expect(h.get('2026-05-25')).toBe('whitMonday');
  });
  it('gère Alsace-Moselle et les jours ajoutés', () => {
    expect(isHoliday('2026-04-03', true, [])).toBe(true);
    expect(isHoliday('2026-04-03', false, [])).toBe(false);
    expect(isHoliday('2026-06-02', false, ['2026-06-02'])).toBe(true);
  });
});

describe('formats', () => {
  it('formate en français', () => {
    expect(formatMoney(1234.56)).toBe('1 234,56 €');
    expect(formatMoney(93.75)).toBe('93,75 €');
    expect(formatHours(7.5)).toBe('7 h 30');
    expect(formatHours(8)).toBe('8 h');
  });
  it('formate en anglais', () => {
    expect(formatMoney(1234.5, 'en')).toBe('€1,234.50');
    expect(formatHours(7.5, 'en')).toBe('7h30');
  });
  it('lit les décimales françaises', () => {
    expect(parseDecimal('12,50')).toBe(12.5);
    expect(parseDecimal('abc')).toBeNull();
  });
});

describe('saisie rapide des heures', () => {
  it.each([
    ['8', 480],
    ['830', 510],
    ['0830', 510],
    ['8h30', 510],
    ['8:3', 510],
    ['22.15', 1335],
    ['24', 0],
    ['2460', null],
    ['abc', null],
    ['', null],
  ])('%s → %p', (input, expected) => {
    expect(normalizeTimeInput(input)).toBe(expected);
  });
});
