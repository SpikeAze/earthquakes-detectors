import type { EarthquakeFeature, ProcessedEarthquake, MagnitudeCategory } from '../types/earthquake';

// ─── Magnitude category classifier ──────────────────────────────────────────
export function getMagnitudeCategory(mag: number): MagnitudeCategory {
  if (mag < 1.0) return 'micro';
  if (mag < 2.0) return 'minor';
  if (mag < 4.0) return 'light';
  if (mag < 5.0) return 'moderate';
  if (mag < 6.0) return 'strong';
  if (mag < 7.0) return 'major';
  return 'great';
}

export function getMagnitudeColor(mag: number): string {
  if (mag < 1.0) return '#22c55e';
  if (mag < 2.0) return '#84cc16';
  if (mag < 4.0) return '#eab308';
  if (mag < 5.0) return '#f97316';
  if (mag < 6.0) return '#ef4444';
  if (mag < 7.0) return '#dc2626';
  return '#991b1b';
}

export function getMagnitudeGlow(mag: number): string {
  if (mag < 4.0) return 'transparent';
  if (mag < 5.0) return 'rgba(249,115,22,0.4)';
  if (mag < 6.0) return 'rgba(239,68,68,0.5)';
  if (mag < 7.0) return 'rgba(220,38,38,0.6)';
  return 'rgba(153,27,27,0.7)';
}

export function getMarkerSize(mag: number): number {
  if (mag < 1.0) return 10;
  if (mag < 2.0) return 14;
  if (mag < 3.0) return 18;
  if (mag < 4.0) return 22;
  if (mag < 5.0) return 28;
  if (mag < 6.0) return 36;
  if (mag < 7.0) return 46;
  return 58;
}

// ─── Feature → ProcessedEarthquake ──────────────────────────────────────────
export function processFeature(
  feature: EarthquakeFeature,
  searchLat?: number,
  searchLng?: number
): ProcessedEarthquake {
  const { properties, geometry, id } = feature;
  const [lng, lat, depthKm] = geometry.coordinates;
  const mag = properties.mag ?? 0;

  return {
    id,
    magnitude: mag,
    magnitudeType: properties.magType,
    place: properties.place ?? 'Unknown location',
    time: properties.time,
    updated: properties.updated,
    latitude: lat,
    longitude: lng,
    depth: depthKm,
    depthMiles: depthKm * 0.621371,
    felt: properties.felt,
    cdi: properties.cdi,
    tsunami: properties.tsunami === 1,
    alert: properties.alert,
    status: properties.status,
    url: properties.url,
    title: properties.title,
    category: getMagnitudeCategory(mag),
    distanceKm:
      searchLat !== undefined && searchLng !== undefined
        ? haversineKm(searchLat, searchLng, lat, lng)
        : undefined,
    network: properties.net ?? null,
    stationCount: properties.nst ?? null,
  };
}

// ─── Haversine distance ──────────────────────────────────────────────────────
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg: number) { return (deg * Math.PI) / 180; }

// ─── Time helpers ────────────────────────────────────────────────────────────
export function formatTimeAgo(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDateTimeISO(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

export function formatLocalDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function daysAgoDateString(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Depth label ────────────────────────────────────────────────────────────
export function getDepthLabel(km: number): string {
  if (km <= 70) return 'Shallow';
  if (km <= 300) return 'Intermediate';
  return 'Deep';
}

// ─── External URL validation ────────────────────────────────────────────────
// Event URLs come from the USGS API response. Validate the scheme + host
// before rendering them as links so a compromised/malicious payload can
// never turn into a `javascript:` / `data:` / phishing href.
export function safeUsgsUrl(url: unknown): string | null {
  if (typeof url !== 'string' || url.length > 2048) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return null;
    if (u.hostname !== 'usgs.gov' && !u.hostname.endsWith('.usgs.gov')) return null;
    return u.href;
  } catch {
    return null;
  }
}

// ─── CSV sanitization ────────────────────────────────────────────────────────
const FORMULA_CHARS = ['=', '+', '-', '@', '\t', '\r', '\n'];

function sanitizeCsvField(field: string | number): string {
  const str = String(field);
  // Prefix with a single quote to neutralize formula injection attempts
  if (FORMULA_CHARS.some((c) => str.startsWith(c))) {
    return `'${str}`;
  }
  return str;
}

// ─── CSV export ─────────────────────────────────────────────────────────────
function toCsvCell(value: string | number): string {
  const str = sanitizeCsvField(value);
  // Quote fields containing delimiters/quotes/line-breaks (RFC 4180) so a
  // place name like "10 km SSW of Town, Region" can't shift columns.
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function exportToCSV(earthquakes: ProcessedEarthquake[]): void {
  const headers = [
    'ID', 'Title', 'Magnitude', 'Category', 'Place',
    'Latitude', 'Longitude', 'Depth (km)', 'Depth (mi)',
    'Time (UTC)', 'Felt', 'Alert', 'Tsunami', 'URL',
  ];
  const rows = earthquakes.map((eq) => [
    sanitizeCsvField(eq.id),
    sanitizeCsvField(eq.title),
    eq.magnitude,
    sanitizeCsvField(eq.category),
    sanitizeCsvField(eq.place),
    eq.latitude,
    eq.longitude,
    eq.depth.toFixed(1),
    eq.depthMiles.toFixed(1),
    sanitizeCsvField(formatDateTimeISO(eq.time)),
    eq.felt ?? '',
    eq.alert ?? '',
    eq.tsunami ? 'Yes' : 'No',
    sanitizeCsvField(eq.url),
  ]);
  const csv = [headers, ...rows].map((r) => r.map(toCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `earthquakes_${todayDateString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
