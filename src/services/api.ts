import type { USGSResponse, FilterState } from '../types/earthquake';

const BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

// ─── API Helper ──────────────────────────────────────────────────────────────
export async function fetchEarthquakes(
  filters: Partial<FilterState>,
  location?: { latitude: number; longitude: number; radiusKm: number }
): Promise<USGSResponse> {
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

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`USGS API error ${response.status}`);
  }
  return response.json() as Promise<USGSResponse>;
}

// ─── Geocoding: resolve city → lat/lng using nominatim (free, no key) ────────
export async function geocodeCity(
  query: string
): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '1' });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SeismoScope/1.0 (earthquake monitoring app)',
      },
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
}
