/** Bornes pour input[type=date] (format yyyy-MM-dd). */
export const HTML_DATE_INPUT_MIN = '1900-01-01';
export const HTML_DATE_INPUT_MAX = '2099-12-31';

/**
 * Corrige une date au format yyyy-MM-dd (appelé au blur uniquement).
 * Ne modifie pas une année incomplète (moins de 4 chiffres) pour ne pas bloquer la saisie manuelle.
 */
export function normalizeHtmlDateInput(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }
  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  const iso = raw.match(/^(\d+)-(\d{1,2})-(\d{1,2})$/);
  if (!iso) {
    return '';
  }

  const yearStr = iso[1];
  // Saisie en cours ou année invalide : ne pas forcer 1900
  if (yearStr.length < 4) {
    return raw;
  }

  let year = parseInt(yearStr.length > 4 ? yearStr.slice(0, 4) : yearStr, 10);
  if (Number.isNaN(year)) {
    return '';
  }
  year = Math.min(2099, Math.max(1900, year));

  const month = Math.min(12, Math.max(1, parseInt(iso[2], 10) || 1));
  const maxDay = new Date(year, month, 0).getDate();
  const day = Math.min(maxDay, Math.max(1, parseInt(iso[3], 10) || 1));
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
