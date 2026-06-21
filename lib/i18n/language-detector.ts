/**
 * BlockStop Phase 28.5 - Auto Language Detection
 * Detect user language from browser, user agent, geolocation
 */

import { SupportedLanguage, SUPPORTED_LANGUAGES } from './translations';

export type LanguageDetectionSource = 'browser' | 'cookie' | 'header' | 'geolocation' | 'manual';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  source: LanguageDetectionSource;
  confidence: number; // 0-1
}

export class LanguageDetector {
  private readonly DEFAULT_LANGUAGE: SupportedLanguage = 'en';
  private readonly SUPPORTED_LANG_CODES = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];

  /**
   * Detect user language from all available sources
   */
  public detectLanguage(headers?: Record<string, string>, ipAddress?: string): LanguageDetectionResult {
    // Try in order of preference
    const browserLang = this.detectFromBrowser();
    if (browserLang.confidence > 0.7) {
      return browserLang;
    }

    const headerLang = headers ? this.detectFromHeaders(headers) : null;
    if (headerLang && headerLang.confidence > 0.7) {
      return headerLang;
    }

    // Fallback to default
    return {
      language: this.DEFAULT_LANGUAGE,
      source: 'browser',
      confidence: 0.5,
    };
  }

  /**
   * Detect language from browser navigator
   */
  public detectFromBrowser(): LanguageDetectionResult {
    if (typeof navigator === 'undefined') {
      return {
        language: this.DEFAULT_LANGUAGE,
        source: 'browser',
        confidence: 0,
      };
    }

    // Get browser language
    const browserLang = navigator.language || navigator.languages?.[0];
    if (!browserLang) {
      return {
        language: this.DEFAULT_LANGUAGE,
        source: 'browser',
        confidence: 0,
      };
    }

    return {
      language: this.parseLanguageCode(browserLang),
      source: 'browser',
      confidence: 0.8,
    };
  }

  /**
   * Detect language from HTTP headers
   */
  public detectFromHeaders(headers: Record<string, string>): LanguageDetectionResult | null {
    const acceptLanguage = headers['accept-language'];
    if (!acceptLanguage) {
      return null;
    }

    const languages = this.parseAcceptLanguage(acceptLanguage);
    if (languages.length === 0) {
      return null;
    }

    return {
      language: languages[0],
      source: 'header',
      confidence: 0.75,
    };
  }

  /**
   * Get language from cookie
   */
  public getLanguageFromCookie(cookieString?: string): SupportedLanguage | null {
    if (!cookieString) {
      if (typeof document === 'undefined') {
        return null;
      }
      cookieString = document.cookie;
    }

    const match = cookieString.match(/blockstop_lang=([^;]+)/);
    if (match && this.isSupportedLanguage(match[1])) {
      return match[1] as SupportedLanguage;
    }

    return null;
  }

  /**
   * Set language cookie
   */
  public setLanguageCookie(language: SupportedLanguage, maxAge: number = 365 * 24 * 60 * 60): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.cookie = `blockstop_lang=${language}; max-age=${maxAge}; path=/; SameSite=Lax`;
  }

  /**
   * Parse Accept-Language header
   */
  private parseAcceptLanguage(header: string): SupportedLanguage[] {
    const languages: Array<{ lang: SupportedLanguage; quality: number }> = [];

    const parts = header.split(',');
    for (const part of parts) {
      const [lang, q] = part.split(';');
      const language = this.parseLanguageCode(lang.trim());
      const quality = q ? parseFloat(q.split('=')[1]) : 1;

      if (this.isSupportedLanguage(language)) {
        languages.push({ lang: language, quality });
      }
    }

    // Sort by quality descending
    return languages.sort((a, b) => b.quality - a.quality).map(l => l.lang);
  }

  /**
   * Parse language code from various formats (en, en-US, en_US, etc)
   */
  private parseLanguageCode(code: string): SupportedLanguage {
    if (!code) {
      return this.DEFAULT_LANGUAGE;
    }

    // Normalize the code
    const normalized = code.toLowerCase().split(/[-_]/)[0];

    // Check for exact match
    if (this.isSupportedLanguage(normalized)) {
      return normalized as SupportedLanguage;
    }

    // Check for partial matches
    const partial = this.SUPPORTED_LANG_CODES.find(lang => lang.startsWith(normalized));
    if (partial) {
      return partial;
    }

    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Check if language code is supported
   */
  private isSupportedLanguage(code: string): code is SupportedLanguage {
    return this.SUPPORTED_LANG_CODES.includes(code as SupportedLanguage);
  }

  /**
   * Get closest related language if exact match not available
   */
  public getClosestLanguage(desiredLang: string): SupportedLanguage {
    const base = desiredLang.toLowerCase().split(/[-_]/)[0];

    // Try exact match first
    if (this.isSupportedLanguage(base)) {
      return base as SupportedLanguage;
    }

    // Language family mappings
    const families: Record<string, SupportedLanguage[]> = {
      en: ['en'],
      es: ['es', 'pt'], // Spanish to Portuguese
      fr: ['fr', 'it'], // French to Italian
      de: ['de', 'nl'], // German to Dutch
      zh: ['zh'],
      ja: ['ja', 'ko'], // Japanese to Korean
      hi: ['hi'],
      ar: ['ar'],
      ru: ['ru'],
      ko: ['ko', 'ja'],
      tr: ['tr'],
      it: ['it', 'fr'],
      nl: ['nl', 'de'],
      pl: ['pl'],
      vi: ['vi', 'th'],
      th: ['th', 'vi'],
      id: ['id', 'fil'],
      fil: ['fil', 'id'],
      sv: ['sv'],
    };

    const family = families[base];
    if (family && family.length > 0) {
      return family[0];
    }

    return this.DEFAULT_LANGUAGE;
  }
}

export const languageDetector = new LanguageDetector();
