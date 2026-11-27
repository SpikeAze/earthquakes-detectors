import type { USGSResponse, FilterState } from '../types/earthquake';

const BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

// Module-level AbortControllers for request deduplication
let earthquakeAbortController: AbortController | null = null;
let geocodeAbortController: AbortController | null = null;

/**
 * Cancel any in-flight earthquake fetch request
 */
export function cancelEarthquakeFetch(): void {
  if (earthquakeAbortController) {
    earthquakeAbortController.abort();
    earthquakeAbortController = null;
  }
}

/**
 * Cancel any in-flight geocoding request
 */
export function cancelGeocode(): void {
  if (geocodeAbortController) {
    geocodeAbortController.abort();
    geocodeAbortController = null;
  }
}

// ─── API Helper ──────────────────────────────────────────────────────────────
export async function fetchEarthquakes(
  filters: Partial<FilterState>,
  location?: { latitude: number; longitude: number; radiusKm: number }
): Promise<USGSResponse> {
  // Cancel any previous in-flight request
  cancelEarthquakeFetch();
  earthquakeAbortController = new AbortController();

  const params = new URLSearchParams({ format: 'geojson' });

  if (filters.startDate) params.set('starttime', filters.startDate);
  if (filters.endDate)   params.set('endtime',   filters.endDate);
  if (filters.minMagnitude !== undefined && filters.minMagnitude > 0)
    params.set('minmagnitude', String(filters.minMagnitude));
  if (filters.maxMagnitude !== undefined && filters.maxMagnitude < 10)
    params.set('maxmagnitude', String(filters.maxMagnitude));
  if (filters.minDepth !== undefined && filters.minDepth > 0)
    params.set('mindepth', String(filters.minDepth));
  if (filters.maxDepth !== undefined && filters.maxDepth < 700)
    params.set('maxdepth', String(filters.maxDepth));
  if (filters.orderBy) params.set('orderby', filters.orderBy);
  if (filters.limit)   params.set('limit',   String(filters.limit));

  if (location) {
    params.set('latitude',     String(location.latitude));
    params.set('longitude',    String(location.longitude));
    params.set('maxradiuskm',  String(location.radiusKm));
  }

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      signal: earthquakeAbortController.signal,
    });
    if (!response.ok) {
      throw new Error(`USGS API error ${response.status}`);
    }
    return response.json() as Promise<USGSResponse>;
  } finally {
    earthquakeAbortController = null;
  }
}

// ─── Geocoding: resolve city → lat/lng using nominatim (free, no key) ────────
export async function geocodeCity(
  query: string
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  // Cancel any previous in-flight request
  cancelGeocode();
  geocodeAbortController = new AbortController();

  const params = new URLSearchParams({ q: query, format: 'json', limit: '1' });
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          // Note: browsers forbid overriding `User-Agent`; it is intentionally
          // omitted (fetch silently strips it). Accept-Language is allowed.
          'Accept-Language': 'en',
        },
        signal: geocodeAbortController.signal,
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } finally {
    geocodeAbortController = null;
  }
}
