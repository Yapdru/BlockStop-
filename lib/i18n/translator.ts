/**
 * BlockStop Phase 28.5 - Translation Service
 * Manages translations and provides translation utilities
 */

import { SupportedLanguage, TRANSLATIONS, getTranslation, SUPPORTED_LANGUAGES } from './translations';
import { languageDetector } from './language-detector';

export interface TranslatorOptions {
  language: SupportedLanguage;
  fallbackLanguage?: SupportedLanguage;
}

export class Translator {
  private currentLanguage: SupportedLanguage;
  private fallbackLanguage: SupportedLanguage;

  constructor(options: TranslatorOptions) {
    this.currentLanguage = options.language;
    this.fallbackLanguage = options.fallbackLanguage || 'en';
  }

  /**
   * Translate a key
   */
  public t(key: string, defaultValue?: string): string {
    const translation = getTranslation(this.currentLanguage, key, undefined);
    if (translation !== key) {
      return translation;
    }

    // Try fallback language
    const fallbackTranslation = getTranslation(this.fallbackLanguage, key, undefined);
    if (fallbackTranslation !== key) {
      return fallbackTranslation;
    }

    return defaultValue || key;
  }

  /**
   * Translate with interpolation
   */
  public ti(key: string, variables: Record<string, string | number>, defaultValue?: string): string {
    let translated = this.t(key, defaultValue);

    for (const [key, value] of Object.entries(variables)) {
      translated = translated.replace(`{{${key}}}`, String(value));
    }

    return translated;
  }

  /**
   * Get all translations for current language
   */
  public getAll() {
    return TRANSLATIONS[this.currentLanguage];
  }

  /**
   * Change language
   */
  public setLanguage(language: SupportedLanguage): void {
    if (Object.keys(SUPPORTED_LANGUAGES).includes(language)) {
      this.currentLanguage = language;
    }
  }

  /**
   * Get current language
   */
  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get language metadata
   */
  public getLanguageMetadata(language?: SupportedLanguage) {
    const lang = language || this.currentLanguage;
    return SUPPORTED_LANGUAGES[lang];
  }

  /**
   * Get text direction (ltr/rtl)
   */
  public getTextDirection(): 'ltr' | 'rtl' {
    return SUPPORTED_LANGUAGES[this.currentLanguage].direction;
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages() {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  /**
   * Check if language is RTL
   */
  public isRTL(language?: SupportedLanguage): boolean {
    const lang = language || this.currentLanguage;
    return SUPPORTED_LANGUAGES[lang].direction === 'rtl';
  }
}

/**
 * Initialize translator from browser/request context
 */
export function initializeTranslator(
  explicitLanguage?: SupportedLanguage,
  headers?: Record<string, string>,
  cookieString?: string
): Translator {
  let language: SupportedLanguage;

  // Priority: explicit > cookie > browser/headers > default
  if (explicitLanguage) {
    language = explicitLanguage;
  } else {
    const cookieLang = languageDetector.getLanguageFromCookie(cookieString);
    if (cookieLang) {
      language = cookieLang;
    } else {
      const detected = languageDetector.detectLanguage(headers);
      language = detected.language;
    }
  }

  return new Translator({ language });
}

/**
 * Global translator instance (for SSR compatibility)
 */
let globalTranslator: Translator | null = null;

export function setGlobalTranslator(translator: Translator): void {
  globalTranslator = translator;
}

export function getGlobalTranslator(): Translator {
  if (!globalTranslator) {
    globalTranslator = new Translator({ language: 'en' });
  }
  return globalTranslator;
}

/**
 * Helper for Next.js server components
 */
export async function getServerTranslator(
  language?: SupportedLanguage,
  cookieString?: string
): Promise<Translator> {
  if (!language) {
    language = languageDetector.getLanguageFromCookie(cookieString) || 'en';
  }
  return new Translator({ language });
}

/**
 * Helper for React hooks
 */
export function useTranslator(language?: SupportedLanguage): Translator {
  if (!language && typeof window !== 'undefined') {
    const detected = languageDetector.detectFromBrowser();
    language = detected.language;
  }

  return new Translator({ language: language || 'en' });
}
