/**
 * Region Selector
 * Determines the nearest region for a user based on geolocation
 */

import { Region, RegionConfig, regionConfigManager } from './region-config';

export interface UserLocation {
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  ip?: string;
}

export interface RegionSelection {
  primaryRegion: Region;
  secondaryRegion: Region;
  tertiaryRegion: Region;
  distance: number;
  estimatedLatency: number;
  reason: string;
}

export class RegionSelector {
  private static readonly BASE_LATENCY_MS = 10; // Base latency in ms
  private static readonly MS_PER_KM = 0.003; // Approximate ms per km

  /**
   * Select nearest region based on user location
   */
  static selectNearestRegion(location: UserLocation): RegionSelection {
    const activeRegions = regionConfigManager.getActiveRegions();
    if (activeRegions.length === 0) {
      throw new Error('No active regions available');
    }

    // Calculate distance to each region
    const distances = activeRegions.map((config) => ({
      region: config.name,
      distance: regionConfigManager.calculateDistance(
        location.latitude,
        location.longitude,
        config.coordinates.latitude,
        config.coordinates.longitude,
      ),
      config,
    }));

    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance);

    const primary = distances[0];
    const secondary = distances[1] || distances[0];
    const tertiary = distances[2] || distances[1];

    const estimatedLatency =
      RegionSelector.BASE_LATENCY_MS +
      primary.distance * RegionSelector.MS_PER_KM;

    return {
      primaryRegion: primary.region,
      secondaryRegion: secondary.region,
      tertiaryRegion: tertiary.region,
      distance: primary.distance,
      estimatedLatency: Math.round(estimatedLatency),
      reason: `Selected based on ${primary.distance.toFixed(0)}km distance`,
    };
  }

  /**
   * Select region by country code
   */
  static selectRegionByCountry(countryCode: string): Region {
    const regionMap: Record<string, Region> = {
      // US regions
      US: Region.US_EAST,
      CA: Region.US_EAST,
      MX: Region.US_WEST,
      // Europe regions
      GB: Region.EUROPE,
      FR: Region.EUROPE,
      DE: Region.EUROPE,
      IT: Region.EUROPE,
      ES: Region.EUROPE,
      NL: Region.EUROPE,
      SE: Region.EUROPE,
      // Asia regions
      JP: Region.ASIA,
      KR: Region.ASIA,
      CN: Region.ASIA,
      SG: Region.ASIA,
      // India
      IN: Region.INDIA,
    };

    return regionMap[countryCode.toUpperCase()] || Region.US_EAST;
  }

  /**
   * Select region based on headers (for server-side requests)
   */
  static selectRegionFromHeaders(headers: Record<string, string>): Region {
    // Try CloudFlare country header
    const cfCountry = headers['cf-ipcountry'] || headers['x-vercel-ip-country'];
    if (cfCountry) {
      return RegionSelector.selectRegionByCountry(cfCountry);
    }

    // Try geo-location header
    const geoIp = headers['x-real-ip'] || headers['x-forwarded-for'];
    if (geoIp) {
      // In production, you would use a GeoIP service to get country from IP
      return Region.US_EAST;
    }

    return Region.US_EAST; // Default fallback
  }

  /**
   * Get fallback regions in order of preference
   */
  static getFallbackRegions(primaryRegion: Region): Region[] {
    const fallbackMap: Record<Region, Region[]> = {
      [Region.US_EAST]: [Region.US_WEST, Region.EUROPE, Region.ASIA, Region.INDIA],
      [Region.US_WEST]: [Region.US_EAST, Region.ASIA, Region.EUROPE, Region.INDIA],
      [Region.EUROPE]: [Region.US_EAST, Region.ASIA, Region.INDIA, Region.US_WEST],
      [Region.ASIA]: [Region.INDIA, Region.EUROPE, Region.US_EAST, Region.US_WEST],
      [Region.INDIA]: [Region.ASIA, Region.EUROPE, Region.US_EAST, Region.US_WEST],
    };

    return fallbackMap[primaryRegion] || [];
  }

  /**
   * Estimate latency to region
   */
  static estimateLatency(
    userLocation: UserLocation,
    region: Region,
  ): number {
    const config = regionConfigManager.getRegionConfig(region);
    if (!config) {
      return 0;
    }

    const distance = regionConfigManager.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      config.coordinates.latitude,
      config.coordinates.longitude,
    );

    return (
      RegionSelector.BASE_LATENCY_MS +
      distance * RegionSelector.MS_PER_KM
    );
  }

  /**
   * Get best region based on health metrics
   */
  static getBestHealthyRegion(): Region {
    const regions = regionConfigManager.getActiveRegions();
    const metrics = regionConfigManager.getAllMetrics();

    // Sort by status and error rate
    const sortedRegions = regions.sort((a, b) => {
      const metricsA = metrics.get(a.name);
      const metricsB = metrics.get(b.name);

      if (!metricsA || !metricsB) return 0;

      // Prefer healthy regions
      if (metricsA.status !== metricsB.status) {
        const statusPriority = { healthy: 0, degraded: 1, unhealthy: 2 };
        return statusPriority[metricsA.status] - statusPriority[metricsB.status];
      }

      // Then by error rate
      return metricsA.errorRate - metricsB.errorRate;
    });

    return sortedRegions[0]?.name || Region.US_EAST;
  }

  /**
   * Get nearest region from client-side (requires geolocation API)
   */
  static async selectNearestRegionClientSide(): Promise<RegionSelection> {
    if (typeof window === 'undefined') {
      return {
        primaryRegion: Region.US_EAST,
        secondaryRegion: Region.US_WEST,
        tertiaryRegion: Region.EUROPE,
        distance: 0,
        estimatedLatency: 0,
        reason: 'Server-side fallback',
      };
    }

    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            resolve(RegionSelector.selectNearestRegion(location));
          },
          () => {
            resolve({
              primaryRegion: Region.US_EAST,
              secondaryRegion: Region.US_WEST,
              tertiaryRegion: Region.EUROPE,
              distance: 0,
              estimatedLatency: 0,
              reason: 'Geolocation failed, using default',
            });
          },
        );
      } else {
        resolve({
          primaryRegion: Region.US_EAST,
          secondaryRegion: Region.US_WEST,
          tertiaryRegion: Region.EUROPE,
          distance: 0,
          estimatedLatency: 0,
          reason: 'Geolocation not available',
        });
      }
    });
  }
}

// Export singleton for use
export const regionSelector = new RegionSelector();
