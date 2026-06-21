/**
 * BlockStop Phase 28.5 - Currency Formatting
 * Format prices for 150+ currencies with locale-specific rules
 */

import { CurrencyCode, SUPPORTED_CURRENCIES } from './currency-converter';
import { SupportedLanguage } from '@/lib/i18n/translations';

export interface FormattedPrice {
  formatted: string;
  amount: number;
  currency: CurrencyCode;
  locale: string;
}

export class CurrencyFormatter {
  /**
   * Format price with currency symbol and locale rules
   */
  public formatPrice(
    amount: number,
    currency: CurrencyCode,
    language: SupportedLanguage = 'en'
  ): FormattedPrice {
    const metadata = SUPPORTED_CURRENCIES[currency];
    if (!metadata) {
      return {
        formatted: `${amount.toFixed(2)} ${currency}`,
        amount,
        currency,
        locale: language,
      };
    }

    const locale = this.getLocaleFromLanguage(language);
    const formatted = this.formatWithLocale(amount, currency, locale, metadata.decimalPlaces);

    return {
      formatted,
      amount,
      currency,
      locale,
    };
  }

  /**
   * Format using Intl.NumberFormat for proper locale handling
   */
  private formatWithLocale(
    amount: number,
    currency: CurrencyCode,
    locale: string,
    decimalPlaces: number
  ): string {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
      return formatter.format(amount);
    } catch (error) {
      // Fallback for unsupported locales
      const metadata = SUPPORTED_CURRENCIES[currency];
      const symbol = metadata?.symbol || currency;
      const formatted = amount.toFixed(decimalPlaces);

      // Determine symbol position based on currency
      if (['JPY', 'CNY', 'KRW'].includes(currency)) {
        return `${symbol}${formatted}`;
      }

      return `${symbol}${formatted}`;
    }
  }

  /**
   * Format as compact notation (e.g., $1.2M)
   */
  public formatCompact(
    amount: number,
    currency: CurrencyCode,
    language: SupportedLanguage = 'en'
  ): string {
    const locale = this.getLocaleFromLanguage(language);
    const metadata = SUPPORTED_CURRENCIES[currency];
    const symbol = metadata?.symbol || currency;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'decimal',
        notation: 'compact',
        maximumFractionDigits: 1,
      });
      return `${symbol}${formatter.format(amount)}`;
    } catch (error) {
      return this.formatPrice(amount, currency, language).formatted;
    }
  }

  /**
   * Format range of prices
   */
  public formatPriceRange(
    minAmount: number,
    maxAmount: number,
    currency: CurrencyCode,
    language: SupportedLanguage = 'en'
  ): string {
    const min = this.formatPrice(minAmount, currency, language).formatted;
    const max = this.formatPrice(maxAmount, currency, language).formatted;
    return `${min} - ${max}`;
  }

  /**
   * Parse currency string to number
   */
  public parseCurrencyString(value: string, currency: CurrencyCode): number | null {
    const metadata = SUPPORTED_CURRENCIES[currency];
    if (!metadata) {
      return null;
    }

    // Remove currency symbol and whitespace
    let cleaned = value.replace(new RegExp(`\\${metadata.symbol}|\\s`, 'g'), '');

    // Remove thousands separators
    cleaned = cleaned.replace(/,/g, '');
    cleaned = cleaned.replace(/\./g, '');

    // Handle decimal separator
    if (metadata.decimalPlaces > 0) {
      const lastChar = value[value.length - 1];
      if (['.', ','].includes(lastChar)) {
        cleaned = cleaned.slice(0, -metadata.decimalPlaces) + '.' + cleaned.slice(-metadata.decimalPlaces);
      }
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get minimum price for currency
   */
  public getMinimumPrice(currency: CurrencyCode): number {
    const metadata = SUPPORTED_CURRENCIES[currency];
    if (!metadata) {
      return 0.01;
    }

    // Some currencies don't have decimal places
    if (metadata.decimalPlaces === 0) {
      return 1;
    }

    return 1 / Math.pow(10, metadata.decimalPlaces);
  }

  /**
   * Format price for invoice
   */
  public formatInvoicePrice(
    amount: number,
    currency: CurrencyCode,
    language: SupportedLanguage = 'en',
    includeDecimal: boolean = true
  ): string {
    const metadata = SUPPORTED_CURRENCIES[currency];
    if (!metadata) {
      return `${amount} ${currency}`;
    }

    const decimals = includeDecimal ? metadata.decimalPlaces : 0;
    const locale = this.getLocaleFromLanguage(language);

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return formatter.format(amount);
    } catch (error) {
      const formatted = amount.toFixed(decimals);
      return `${metadata.symbol}${formatted}`;
    }
  }

  /**
   * Get locale string from language
   */
  private getLocaleFromLanguage(language: SupportedLanguage): string {
    const localeMap: Record<SupportedLanguage, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ja: 'ja-JP',
      hi: 'hi-IN',
      pt: 'pt-BR',
      ar: 'ar-SA',
      ru: 'ru-RU',
      ko: 'ko-KR',
      tr: 'tr-TR',
      it: 'it-IT',
      nl: 'nl-NL',
      pl: 'pl-PL',
      vi: 'vi-VN',
      th: 'th-TH',
      id: 'id-ID',
      fil: 'fil-PH',
      sv: 'sv-SE',
    };

    return localeMap[language] || 'en-US';
  }

  /**
   * Get currency symbol
   */
  public getSymbol(currency: CurrencyCode): string {
    const metadata = SUPPORTED_CURRENCIES[currency];
    return metadata?.symbol || currency;
  }

  /**
   * Get decimal places for currency
   */
  public getDecimalPlaces(currency: CurrencyCode): number {
    const metadata = SUPPORTED_CURRENCIES[currency];
    return metadata?.decimalPlaces ?? 2;
  }

  /**
   * Format for database storage
   */
  public serializeForDatabase(amount: number, currency: CurrencyCode): string {
    const metadata = SUPPORTED_CURRENCIES[currency];
    if (!metadata) {
      return `${amount}|${currency}`;
    }

    const fixed = amount.toFixed(metadata.decimalPlaces);
    return `${fixed}|${currency}`;
  }

  /**
   * Parse from database storage
   */
  public deserializeFromDatabase(value: string): { amount: number; currency: CurrencyCode } | null {
    const [amountStr, currency] = value.split('|');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || !currency) {
      return null;
    }

    return { amount, currency: currency as CurrencyCode };
  }

  /**
   * Get price in different format styles
   */
  public formatWithStyle(
    amount: number,
    currency: CurrencyCode,
    style: 'standard' | 'compact' | 'accounting',
    language: SupportedLanguage = 'en'
  ): string {
    const locale = this.getLocaleFromLanguage(language);

    switch (style) {
      case 'compact':
        return this.formatCompact(amount, currency, language);
      case 'accounting':
        // Negative amounts in accounting style show as (amount)
        if (amount < 0) {
          const formatted = this.formatPrice(Math.abs(amount), currency, language).formatted;
          return `(${formatted})`;
        }
        return this.formatPrice(amount, currency, language).formatted;
      default:
        return this.formatPrice(amount, currency, language).formatted;
    }
  }
}

export const currencyFormatter = new CurrencyFormatter();
