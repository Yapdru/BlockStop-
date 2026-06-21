/**
 * BlockStop Phase 28.5 - Timezone Service
 * Handle timezone detection, conversion, and formatting
 */

export type TimezoneCode = string;

export interface TimezoneMetadata {
  code: TimezoneCode;
  name: string;
  offset: number; // hours from UTC
  dstOffset?: number; // daylight saving time offset
  region: string;
  countries: string[];
}

export const COMMON_TIMEZONES: Record<TimezoneCode, TimezoneMetadata> = {
  'UTC': {
    code: 'UTC',
    name: 'Coordinated Universal Time',
    offset: 0,
    region: 'Global',
    countries: [],
  },
  'US/Eastern': {
    code: 'US/Eastern',
    name: 'Eastern Time',
    offset: -5,
    dstOffset: -4,
    region: 'North America',
    countries: ['US'],
  },
  'US/Central': {
    code: 'US/Central',
    name: 'Central Time',
    offset: -6,
    dstOffset: -5,
    region: 'North America',
    countries: ['US'],
  },
  'US/Mountain': {
    code: 'US/Mountain',
    name: 'Mountain Time',
    offset: -7,
    dstOffset: -6,
    region: 'North America',
    countries: ['US'],
  },
  'US/Pacific': {
    code: 'US/Pacific',
    name: 'Pacific Time',
    offset: -8,
    dstOffset: -7,
    region: 'North America',
    countries: ['US'],
  },
  'Canada/Eastern': {
    code: 'Canada/Eastern',
    name: 'Canada Eastern Time',
    offset: -5,
    dstOffset: -4,
    region: 'North America',
    countries: ['CA'],
  },
  'Canada/Pacific': {
    code: 'Canada/Pacific',
    name: 'Canada Pacific Time',
    offset: -8,
    dstOffset: -7,
    region: 'North America',
    countries: ['CA'],
  },
  'America/Mexico_City': {
    code: 'America/Mexico_City',
    name: 'Mexico City Time',
    offset: -6,
    dstOffset: -5,
    region: 'North America',
    countries: ['MX'],
  },
  'America/Sao_Paulo': {
    code: 'America/Sao_Paulo',
    name: 'Brasília Time',
    offset: -3,
    dstOffset: -2,
    region: 'South America',
    countries: ['BR'],
  },
  'America/Argentina/Buenos_Aires': {
    code: 'America/Argentina/Buenos_Aires',
    name: 'Argentina Time',
    offset: -3,
    region: 'South America',
    countries: ['AR'],
  },
  'Europe/London': {
    code: 'Europe/London',
    name: 'Greenwich Mean Time',
    offset: 0,
    dstOffset: 1,
    region: 'Europe',
    countries: ['GB'],
  },
  'Europe/Paris': {
    code: 'Europe/Paris',
    name: 'Central European Time',
    offset: 1,
    dstOffset: 2,
    region: 'Europe',
    countries: ['FR', 'DE', 'BE', 'NL'],
  },
  'Europe/Berlin': {
    code: 'Europe/Berlin',
    name: 'Central European Time',
    offset: 1,
    dstOffset: 2,
    region: 'Europe',
    countries: ['DE', 'AT'],
  },
  'Europe/Madrid': {
    code: 'Europe/Madrid',
    name: 'Central European Time',
    offset: 1,
    dstOffset: 2,
    region: 'Europe',
    countries: ['ES'],
  },
  'Europe/Rome': {
    code: 'Europe/Rome',
    name: 'Central European Time',
    offset: 1,
    dstOffset: 2,
    region: 'Europe',
    countries: ['IT'],
  },
  'Europe/Amsterdam': {
    code: 'Europe/Amsterdam',
    name: 'Central European Time',
    offset: 1,
    dstOffset: 2,
    region: 'Europe',
    countries: ['NL'],
  },
  'Europe/Stockholm': {
    code: 'Europe/Stockholm',
    name: 'Central European Time',
    offset: 1,
    dstOffset: 2,
    region: 'Europe',
    countries: ['SE', 'FI'],
  },
  'Europe/Moscow': {
    code: 'Europe/Moscow',
    name: 'Moscow Standard Time',
    offset: 3,
    region: 'Europe/Asia',
    countries: ['RU'],
  },
  'Europe/Istanbul': {
    code: 'Europe/Istanbul',
    name: 'Eastern European Time',
    offset: 3,
    region: 'Europe/Asia',
    countries: ['TR'],
  },
  'Asia/Dubai': {
    code: 'Asia/Dubai',
    name: 'Gulf Standard Time',
    offset: 4,
    region: 'Middle East',
    countries: ['AE'],
  },
  'Asia/Riyadh': {
    code: 'Asia/Riyadh',
    name: 'Arabia Standard Time',
    offset: 3,
    region: 'Middle East',
    countries: ['SA'],
  },
  'Asia/Kolkata': {
    code: 'Asia/Kolkata',
    name: 'Indian Standard Time',
    offset: 5.5,
    region: 'Asia',
    countries: ['IN'],
  },
  'Asia/Bangkok': {
    code: 'Asia/Bangkok',
    name: 'Indochina Time',
    offset: 7,
    region: 'Asia',
    countries: ['TH', 'VN', 'LA'],
  },
  'Asia/Jakarta': {
    code: 'Asia/Jakarta',
    name: 'Western Indonesia Time',
    offset: 7,
    region: 'Asia',
    countries: ['ID'],
  },
  'Asia/Hong_Kong': {
    code: 'Asia/Hong_Kong',
    name: 'Hong Kong Time',
    offset: 8,
    region: 'Asia',
    countries: ['HK'],
  },
  'Asia/Shanghai': {
    code: 'Asia/Shanghai',
    name: 'China Standard Time',
    offset: 8,
    region: 'Asia',
    countries: ['CN'],
  },
  'Asia/Singapore': {
    code: 'Asia/Singapore',
    name: 'Singapore Standard Time',
    offset: 8,
    region: 'Asia',
    countries: ['SG'],
  },
  'Asia/Manila': {
    code: 'Asia/Manila',
    name: 'Philippine Time',
    offset: 8,
    region: 'Asia',
    countries: ['PH'],
  },
  'Asia/Kuala_Lumpur': {
    code: 'Asia/Kuala_Lumpur',
    name: 'Malaysia Time',
    offset: 8,
    region: 'Asia',
    countries: ['MY'],
  },
  'Asia/Tokyo': {
    code: 'Asia/Tokyo',
    name: 'Japan Standard Time',
    offset: 9,
    region: 'Asia',
    countries: ['JP'],
  },
  'Asia/Seoul': {
    code: 'Asia/Seoul',
    name: 'Korea Standard Time',
    offset: 9,
    region: 'Asia',
    countries: ['KR'],
  },
  'Australia/Sydney': {
    code: 'Australia/Sydney',
    name: 'Australian Eastern Time',
    offset: 10,
    dstOffset: 11,
    region: 'Asia-Pacific',
    countries: ['AU'],
  },
  'Australia/Melbourne': {
    code: 'Australia/Melbourne',
    name: 'Australian Eastern Time',
    offset: 10,
    dstOffset: 11,
    region: 'Asia-Pacific',
    countries: ['AU'],
  },
  'Pacific/Auckland': {
    code: 'Pacific/Auckland',
    name: 'New Zealand Standard Time',
    offset: 12,
    dstOffset: 13,
    region: 'Asia-Pacific',
    countries: ['NZ'],
  },
  'Africa/Cairo': {
    code: 'Africa/Cairo',
    name: 'Eastern European Time',
    offset: 2,
    region: 'Africa',
    countries: ['EG'],
  },
  'Africa/Johannesburg': {
    code: 'Africa/Johannesburg',
    name: 'South Africa Standard Time',
    offset: 2,
    region: 'Africa',
    countries: ['ZA'],
  },
};

export interface UserTimezonePreference {
  userId: string;
  timezoneCode: TimezoneCode;
  detectedTimezone?: TimezoneCode;
  overrideTimezone: boolean;
  autoDetect: boolean;
  updatedAt: Date;
}

export class TimezoneService {
  private userPreferences: Map<string, UserTimezonePreference> = new Map();

  /**
   * Detect user's timezone from browser
   */
  public detectTimezoneFromBrowser(): TimezoneCode {
    if (typeof Intl === 'undefined') {
      return 'UTC';
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return this.normalizeTimezoneCode(timezone);
    } catch (error) {
      return 'UTC';
    }
  }

  /**
   * Get timezone from IP geolocation
   */
  public getTimezoneFromCountry(countryCode: string): TimezoneCode {
    const countryMap: Record<string, TimezoneCode> = {
      US: 'US/Eastern',
      CA: 'Canada/Eastern',
      MX: 'America/Mexico_City',
      BR: 'America/Sao_Paulo',
      AR: 'America/Argentina/Buenos_Aires',
      GB: 'Europe/London',
      FR: 'Europe/Paris',
      DE: 'Europe/Berlin',
      ES: 'Europe/Madrid',
      IT: 'Europe/Rome',
      NL: 'Europe/Amsterdam',
      SE: 'Europe/Stockholm',
      RU: 'Europe/Moscow',
      TR: 'Europe/Istanbul',
      AE: 'Asia/Dubai',
      SA: 'Asia/Riyadh',
      IN: 'Asia/Kolkata',
      TH: 'Asia/Bangkok',
      VN: 'Asia/Bangkok',
      ID: 'Asia/Jakarta',
      HK: 'Asia/Hong_Kong',
      CN: 'Asia/Shanghai',
      SG: 'Asia/Singapore',
      PH: 'Asia/Manila',
      MY: 'Asia/Kuala_Lumpur',
      JP: 'Asia/Tokyo',
      KR: 'Asia/Seoul',
      AU: 'Australia/Sydney',
      NZ: 'Pacific/Auckland',
      EG: 'Africa/Cairo',
      ZA: 'Africa/Johannesburg',
    };

    return countryMap[countryCode] || 'UTC';
  }

  /**
   * Set user timezone preference
   */
  public setUserTimezonePreference(
    userId: string,
    timezoneCode: TimezoneCode,
    overrideTimezone: boolean = true,
    autoDetect: boolean = false
  ): UserTimezonePreference {
    const preference: UserTimezonePreference = {
      userId,
      timezoneCode,
      overrideTimezone,
      autoDetect,
      updatedAt: new Date(),
    };

    this.userPreferences.set(userId, preference);
    return preference;
  }

  /**
   * Get user's effective timezone
   */
  public getUserTimezone(userId: string, fallbackDetect: boolean = true): TimezoneCode {
    const preference = this.userPreferences.get(userId);

    if (preference && preference.overrideTimezone) {
      return preference.timezoneCode;
    }

    if (preference?.detectedTimezone) {
      return preference.detectedTimezone;
    }

    if (fallbackDetect) {
      return this.detectTimezoneFromBrowser();
    }

    return 'UTC';
  }

  /**
   * Convert date to timezone
   */
  public convertToTimezone(date: Date, timezoneCode: TimezoneCode): {
    date: Date;
    offset: number;
    formatted: string;
  } {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: this.denormalizeTimezoneCode(timezoneCode),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const formatted = formatter.format(date);
      const metadata = COMMON_TIMEZONES[timezoneCode];
      const offset = metadata?.offset || 0;

      return {
        date: new Date(formatted),
        offset,
        formatted,
      };
    } catch (error) {
      return {
        date: new Date(),
        offset: 0,
        formatted: date.toISOString(),
      };
    }
  }

  /**
   * Format date for timezone
   */
  public formatForTimezone(
    date: Date,
    timezoneCode: TimezoneCode,
    format: 'long' | 'short' | 'full' = 'long'
  ): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: this.denormalizeTimezoneCode(timezoneCode),
    };

    switch (format) {
      case 'full':
        options.weekday = 'long';
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        break;
      case 'short':
        options.year = '2-digit';
        options.month = '2-digit';
        options.day = '2-digit';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'long':
      default:
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }

    try {
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      return date.toISOString();
    }
  }

  /**
   * Get offset between two timezones
   */
  public getTimezoneOffset(fromTimezone: TimezoneCode, toTimezone: TimezoneCode): number {
    const from = COMMON_TIMEZONES[fromTimezone]?.offset || 0;
    const to = COMMON_TIMEZONES[toTimezone]?.offset || 0;
    return to - from;
  }

  /**
   * Check if timezone observes daylight saving time
   */
  public observesDST(timezoneCode: TimezoneCode): boolean {
    const metadata = COMMON_TIMEZONES[timezoneCode];
    return !!metadata?.dstOffset;
  }

  /**
   * Get timezone metadata
   */
  public getTimezoneMetadata(timezoneCode: TimezoneCode): TimezoneMetadata | null {
    return COMMON_TIMEZONES[timezoneCode] || null;
  }

  /**
   * List all supported timezones
   */
  public getSupportedTimezones(): TimezoneMetadata[] {
    return Object.values(COMMON_TIMEZONES);
  }

  /**
   * Get timezones by region
   */
  public getTimezonesByRegion(region: string): TimezoneMetadata[] {
    return Object.values(COMMON_TIMEZONES).filter(tz => tz.region === region);
  }

  /**
   * Get timezones by country
   */
  public getTimezonesByCountry(countryCode: string): TimezoneMetadata[] {
    return Object.values(COMMON_TIMEZONES).filter(tz => tz.countries.includes(countryCode));
  }

  /**
   * Normalize timezone code
   */
  private normalizeTimezoneCode(code: string): TimezoneCode {
    // IANA timezone names are already in the correct format
    const found = Object.keys(COMMON_TIMEZONES).find(key =>
      key.toLowerCase() === code.toLowerCase()
    );
    return (found as TimezoneCode) || 'UTC';
  }

  /**
   * Denormalize timezone code for Intl API
   */
  private denormalizeTimezoneCode(code: TimezoneCode): string {
    return code;
  }

  /**
   * Get user's local time
   */
  public getUserLocalTime(userId: string): Date {
    const timezone = this.getUserTimezone(userId);
    const now = new Date();
    const converted = this.convertToTimezone(now, timezone);
    return converted.date;
  }

  /**
   * Calculate business hours in timezone
   */
  public isWithinBusinessHours(
    date: Date,
    timezoneCode: TimezoneCode,
    startHour: number = 9,
    endHour: number = 17
  ): boolean {
    const converted = this.convertToTimezone(date, timezoneCode);
    const hour = converted.date.getHours();
    const day = converted.date.getDay();

    // Skip weekends
    if (day === 0 || day === 6) {
      return false;
    }

    return hour >= startHour && hour < endHour;
  }

  /**
   * Convert to UTC
   */
  public toUTC(date: Date, fromTimezoneCode: TimezoneCode): Date {
    const metadata = COMMON_TIMEZONES[fromTimezoneCode];
    if (!metadata) {
      return date;
    }

    const offset = metadata.offset * 60 * 60 * 1000;
    return new Date(date.getTime() - offset);
  }

  /**
   * From UTC
   */
  public fromUTC(date: Date, toTimezoneCode: TimezoneCode): Date {
    const metadata = COMMON_TIMEZONES[toTimezoneCode];
    if (!metadata) {
      return date;
    }

    const offset = metadata.offset * 60 * 60 * 1000;
    return new Date(date.getTime() + offset);
  }
}

export const timezoneService = new TimezoneService();
