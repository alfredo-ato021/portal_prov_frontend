import es419 from './locales/es-419.json';

type TranslationDictionary = typeof es419;

/**
 * Resolves a nested key in the translation dictionary, e.g. 'supplier.upload_title'
 */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const parts = key.split('.');
  let current: any = es419;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key; // Fallback to raw key if not found
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  // Replace {param} placeholders
  let result = current;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
  }

  return result;
}

/**
 * Formats a monetary amount using the client country and currency
 */
export function formatCurrency(amount: number, currency: string = 'PEN', locale: string = 'es-PE'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats an ISO date string (YYYY-MM-DD) according to regional rules
 */
export function formatDate(dateStr: string, locale: string = 'es-PE'): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export { es419 };
export type { TranslationDictionary };
