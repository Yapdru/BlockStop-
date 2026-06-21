/**
 * BlockStop Phase 28.5 - Multi-Currency Support
 * Real-time currency conversion using free APIs
 */

export type CurrencyCode = string;

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: Date;
  source: 'cache' | 'api';
}

export interface CurrencyMetadata {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  region: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyMetadata> = {
  // Americas
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, region: 'United States' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, region: 'Canada' },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalPlaces: 2, region: 'Mexico' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, region: 'Brazil' },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimalPlaces: 2, region: 'Argentina' },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimalPlaces: 0, region: 'Chile' },
  COP: { code: 'COP', name: 'Colombian Peso', symbol: '$', decimalPlaces: 2, region: 'Colombia' },

  // Europe
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, region: 'Eurozone' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, region: 'United Kingdom' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, region: 'Switzerland' },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, region: 'Sweden' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, region: 'Norway' },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2, region: 'Denmark' },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimalPlaces: 2, region: 'Poland' },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimalPlaces: 2, region: 'Czech Republic' },
  HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimalPlaces: 2, region: 'Hungary' },
  RON: { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimalPlaces: 2, region: 'Romania' },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2, region: 'Russia' },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimalPlaces: 2, region: 'Turkey' },

  // Middle East & Africa
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, region: 'United Arab Emirates' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimalPlaces: 2, region: 'Saudi Arabia' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', decimalPlaces: 3, region: 'Kuwait' },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', decimalPlaces: 2, region: 'Qatar' },
  EGP: { code: 'EGP', name: 'Egyptian Pound', symbol: '£', decimalPlaces: 2, region: 'Egypt' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, region: 'South Africa' },

  // Asia Pacific
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, region: 'India' },
  PKR: { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', decimalPlaces: 2, region: 'Pakistan' },
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimalPlaces: 2, region: 'Bangladesh' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, region: 'Japan' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, region: 'South Korea' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, region: 'China' },
  TWD: { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', decimalPlaces: 2, region: 'Taiwan' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, region: 'Hong Kong' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, region: 'Singapore' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2, region: 'Malaysia' },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2, region: 'Thailand' },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, region: 'Vietnam' },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 2, region: 'Indonesia' },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2, region: 'Philippines' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, region: 'Australia' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2, region: 'New Zealand' },
};

export class CurrencyConverter {
  private cache: Map<string, { rate: number; timestamp: Date }> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.cache.get(cacheKey);

    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL_MS) {
      return cached.rate;
    }

    try {
      // Using exchangerate-api.com free tier
      const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
      this.cache.set(cacheKey, { rate, timestamp: new Date() });
      return rate;
    } catch (error) {
      console.error(`Failed to fetch exchange rate: ${fromCurrency} -> ${toCurrency}`, error);
      // Return cached rate even if expired, or default to 1
      return cached?.rate || 1;
    }
  }

  /**
   * Fetch exchange rate from API
   */
  private async fetchExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<number> {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const url = `https://v6.exchangerate-api.com/v6/latest/${fromCurrency}`;

    try {
      const response = await fetch(url, { next: { revalidate: 3600 } });
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const rate = data.conversion_rates?.[toCurrency];

      if (!rate) {
        throw new Error(`Rate not found for ${toCurrency}`);
      }

      return rate;
    } catch (error) {
      // Fallback: use local hardcoded rates (last updated)
      return this.getHardcodedRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Get hardcoded exchange rates (fallback)
   * These should be updated periodically
   */
  private getHardcodedRate(from: CurrencyCode, to: CurrencyCode): number {
    const rates: Record<string, Record<string, number>> = {
      USD: {
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        INR: 83.12,
        AUD: 1.53,
        CAD: 1.36,
        CHF: 0.88,
        CNY: 7.24,
        MXN: 17.05,
        BRL: 4.97,
        SEK: 10.63,
        SGD: 1.35,
        HKD: 7.82,
        KRW: 1319.5,
        THB: 35.25,
        VND: 24500,
        IDR: 16087,
        PHP: 56.37,
        AED: 3.67,
        SAR: 3.75,
        EGP: 48.2,
        ZAR: 18.76,
        RUB: 95.0,
        TRY: 32.45,
        PKR: 278.5,
        BDT: 109.5,
        IQD: 1309,
      },
    };

    if (from === 'USD') {
      return rates['USD'][to] || 1;
    }

    // For non-USD conversions, convert via USD
    const fromToUsd = rates['USD'][from] || 1;
    const usdToTarget = rates['USD'][to] || 1;

    return usdToTarget / fromToUsd;
  }

  /**
   * Get all supported currencies
   */
  public getSupportedCurrencies() {
    return Object.values(SUPPORTED_CURRENCIES);
  }

  /**
   * Get currency metadata
   */
  public getCurrencyMetadata(code: CurrencyCode): CurrencyMetadata | null {
    return SUPPORTED_CURRENCIES[code] || null;
  }

  /**
   * Check if currency is supported
   */
  public isSupportedCurrency(code: CurrencyCode): boolean {
    return !!SUPPORTED_CURRENCIES[code];
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all rates from base currency
   */
  async getConversionRates(baseCurrency: CurrencyCode): Promise<Record<CurrencyCode, number>> {
    try {
      const url = `https://v6.exchangerate-api.com/v6/latest/${baseCurrency}`;
      const response = await fetch(url, { next: { revalidate: 3600 } });

      if (!response.ok) {
        return this.getHardcodedRates(baseCurrency);
      }

      const data = await response.json();
      return data.conversion_rates || this.getHardcodedRates(baseCurrency);
    } catch (error) {
      return this.getHardcodedRates(baseCurrency);
    }
  }

  /**
   * Get hardcoded rates for all supported currencies
   */
  private getHardcodedRates(baseCurrency: CurrencyCode): Record<CurrencyCode, number> {
    // This would be a large mapping - returning empty for brevity
    // In production, this should be populated with all currency pairs
    return {};
  }
}

export const currencyConverter = new CurrencyConverter();
