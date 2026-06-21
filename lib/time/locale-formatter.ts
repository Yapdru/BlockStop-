/**
 * BlockStop Phase 28.5 - Locale Formatter
 * Format dates, numbers, and currencies per locale
 */

import { SupportedLanguage } from '@/lib/i18n/translations';
import { TimezoneCode } from './timezone-service';

export interface LocaleFormatOptions {
  language: SupportedLanguage;
  timezone?: TimezoneCode;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  numberFormat?: 'decimal' | 'percent' | 'currency';
  currency?: string;
}

export class LocaleFormatter {
  /**
   * Get locale string from language
   */
  private getLocale(language: SupportedLanguage): string {
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
   * Format date with locale
   */
  public formatDate(
    date: Date,
    language: SupportedLanguage,
    style: 'full' | 'long' | 'medium' | 'short' = 'long'
  ): string {
    const locale = this.getLocale(language);
    const options: Intl.DateTimeFormatOptions = {};

    switch (style) {
      case 'full':
        options.weekday = 'long';
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'medium':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        break;
      case 'short':
        options.year = '2-digit';
        options.month = '2-digit';
        options.day = '2-digit';
        break;
    }

    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return date.toISOString().split('T')[0];
    }
  }

  /**
   * Format time with locale
   */
  public formatTime(
    date: Date,
    language: SupportedLanguage,
    style: 'full' | 'long' | 'medium' | 'short' = 'medium'
  ): string {
    const locale = this.getLocale(language);
    const options: Intl.DateTimeFormatOptions = {};

    switch (style) {
      case 'full':
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.timeZoneName = 'long';
        break;
      case 'long':
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        break;
      case 'medium':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'short':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }

    try {
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return date.toLocaleTimeString();
    }
  }

  /**
   * Format date and time combined
   */
  public formatDateTime(
    date: Date,
    language: SupportedLanguage,
    dateStyle: 'full' | 'long' | 'medium' | 'short' = 'medium',
    timeStyle: 'full' | 'long' | 'medium' | 'short' = 'medium'
  ): string {
    const formattedDate = this.formatDate(date, language, dateStyle);
    const formattedTime = this.formatTime(date, language, timeStyle);
    return `${formattedDate} ${formattedTime}`;
  }

  /**
   * Format number with locale
   */
  public formatNumber(
    value: number,
    language: SupportedLanguage,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      useGrouping?: boolean;
    }
  ): string {
    const locale = this.getLocale(language);

    try {
      const formatter = new Intl.NumberFormat(locale, {
        useGrouping: options?.useGrouping !== false,
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits,
      });

      return formatter.format(value);
    } catch (error) {
      return value.toString();
    }
  }

  /**
   * Format percentage
   */
  public formatPercent(
    value: number,
    language: SupportedLanguage,
    decimalPlaces: number = 2
  ): string {
    const locale = this.getLocale(language);

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

      return formatter.format(value / 100);
    } catch (error) {
      return `${(value * 100).toFixed(decimalPlaces)}%`;
    }
  }

  /**
   * Format currency
   */
  public formatCurrency(
    value: number,
    currency: string,
    language: SupportedLanguage,
    decimalPlaces: number = 2
  ): string {
    const locale = this.getLocale(language);

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

      return formatter.format(value);
    } catch (error) {
      return `${currency} ${value.toFixed(decimalPlaces)}`;
    }
  }

  /**
   * Format list with locale
   */
  public formatList(
    items: string[],
    language: SupportedLanguage,
    style: 'long' | 'short' | 'narrow' = 'long'
  ): string {
    const locale = this.getLocale(language);

    try {
      const formatter = new Intl.ListFormat(locale, { style });
      return formatter.format(items);
    } catch (error) {
      return items.join(', ');
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  public formatRelativeTime(
    value: number,
    unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year',
    language: SupportedLanguage,
    style: 'long' | 'short' | 'narrow' = 'long'
  ): string {
    const locale = this.getLocale(language);

    try {
      const formatter = new Intl.RelativeTimeFormat(locale, { style });
      return formatter.format(value, unit);
    } catch (error) {
      const units: Record<string, string> = {
        second: 'seconds',
        minute: 'minutes',
        hour: 'hours',
        day: 'days',
        week: 'weeks',
        month: 'months',
        year: 'years',
      };
      return `${Math.abs(value)} ${units[unit]} ${value < 0 ? 'ago' : 'from now'}`;
    }
  }

  /**
   * Format duration in locale
   */
  public formatDuration(
    milliseconds: number,
    language: SupportedLanguage
  ): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return this.formatRelativeTime(-days, 'day', language, 'short');
    } else if (hours > 0) {
      return this.formatRelativeTime(-hours, 'hour', language, 'short');
    } else if (minutes > 0) {
      return this.formatRelativeTime(-minutes, 'minute', language, 'short');
    } else {
      return this.formatRelativeTime(-seconds, 'second', language, 'short');
    }
  }

  /**
   * Parse localized number
   */
  public parseLocalizedNumber(
    value: string,
    language: SupportedLanguage
  ): number | null {
    const locale = this.getLocale(language);

    // Get locale decimal separator
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
    const decimalPart = parts.find(part => part.type === 'decimal');
    const decimalSeparator = decimalPart?.value || '.';

    // Get locale thousands separator
    const numberParts = new Intl.NumberFormat(locale).formatToParts(1111);
    const groupPart = numberParts.find(part => part.type === 'group');
    const groupSeparator = groupPart?.value || ',';

    // Clean the string
    let cleaned = value
      .replace(new RegExp(`\\${groupSeparator}`, 'g'), '') // Remove thousands separator
      .replace(decimalSeparator, '.'); // Replace decimal separator with dot

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Format address with locale rules
   */
  public formatAddress(
    addressParts: {
      streetNumber?: string;
      streetName?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    },
    language: SupportedLanguage
  ): string {
    // Different formats for different regions
    const locale = this.getLocale(language);

    // US format: Street, City, State ZIP
    if (locale.includes('en')) {
      return [
        addressParts.streetNumber && addressParts.streetName
          ? `${addressParts.streetNumber} ${addressParts.streetName}`
          : '',
        addressParts.city,
        addressParts.state && addressParts.postalCode
          ? `${addressParts.state} ${addressParts.postalCode}`
          : addressParts.postalCode,
        addressParts.country,
      ]
        .filter(Boolean)
        .join(', ');
    }

    // European format: Street street_number, postal_code City
    if (locale.includes('en-GB') || locale.includes('de') || locale.includes('fr')) {
      return [
        addressParts.streetName && addressParts.streetNumber
          ? `${addressParts.streetName} ${addressParts.streetNumber}`
          : '',
        addressParts.postalCode && addressParts.city
          ? `${addressParts.postalCode} ${addressParts.city}`
          : addressParts.city,
        addressParts.country,
      ]
        .filter(Boolean)
        .join(', ');
    }

    // Default format
    return [
      addressParts.streetNumber && addressParts.streetName
        ? `${addressParts.streetNumber} ${addressParts.streetName}`
        : '',
      addressParts.city,
      addressParts.state,
      addressParts.postalCode,
      addressParts.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Format phone number
   */
  public formatPhoneNumber(
    phone: string,
    language: SupportedLanguage,
    countryCode?: string
  ): string {
    // Basic formatting - in production, use libphonenumber-js
    const cleaned = phone.replace(/\D/g, '');

    if (language === 'en' || countryCode === 'US') {
      // US format: (XXX) XXX-XXXX
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
    }

    if (language === 'de' || countryCode === 'DE') {
      // German format: +49 XXX XXXXXXX
      if (cleaned.length === 11) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
      }
    }

    return phone;
  }

  /**
   * Get text direction for language
   */
  public getTextDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
    return ['ar'].includes(language) ? 'rtl' : 'ltr';
  }

  /**
   * Format name with locale conventions
   */
  public formatName(
    firstName: string,
    lastName: string,
    language: SupportedLanguage
  ): string {
    // Some Asian languages put family name first
    if (['zh', 'ja', 'ko'].includes(language)) {
      return `${lastName} ${firstName}`;
    }

    return `${firstName} ${lastName}`;
  }

  /**
   * Get ordinal number for locale
   */
  public getOrdinalNumber(value: number, language: SupportedLanguage): string {
    const ordinalRules = new Intl.PluralRules(this.getLocale(language), { type: 'ordinal' });
    const rule = ordinalRules.select(value);

    const suffixes: Record<SupportedLanguage, Record<string, string>> = {
      en: { one: 'st', two: 'nd', few: 'rd', other: 'th' },
      es: { one: 'º', two: 'º', few: 'º', other: 'º' },
      fr: { one: 'er', two: 'e', few: 'e', other: 'e' },
      de: { one: '.', two: '.', few: '.', other: '.' },
      zh: { one: '第', two: '第', few: '第', other: '第' },
      // Add more languages as needed
    };

    const languageSuffixes = suffixes[language] || suffixes.en;
    const suffix = languageSuffixes[rule] || '';

    return `${value}${suffix}`;
  }
}

export const localeFormatter = new LocaleFormatter();
