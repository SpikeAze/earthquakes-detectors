// USGS GeoJSON API types
export interface USGSResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: EarthquakeFeature[];
  bbox?: [number, number, number, number, number, number];
}

export interface EarthquakeFeature {
  type: 'Feature';
  properties: EarthquakeProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

export interface EarthquakeProperties {
  mag: number | null;
  place: string | null;
  time: number; // milliseconds since epoch
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  status: 'automatic' | 'reviewed' | 'deleted';
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string | null;
  type: string;
  title: string;
}

// App-specific processed earthquake type
export interface ProcessedEarthquake {
  id: string;
  magnitude: number;
  magnitudeType: string | null;
  place: string;
  time: number;
  updated: number;
  latitude: number;
  longitude: number;
  depth: number; // km
  depthMiles: number;
  felt: number | null;
  cdi: number | null;
  tsunami: boolean;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  status: string;
  url: string;
  title: string;
  category: MagnitudeCategory;
  distanceKm?: number;
}

export type MagnitudeCategory =
  | 'micro'
  | 'minor'
  | 'light'
  | 'moderate'
  | 'strong'
  | 'major'
  | 'great';

// Filter state
export interface FilterState {
  minMagnitude: number;
  maxMagnitude: number;
  minDepth: number;
  maxDepth: number;
  startDate: string;
  endDate: string;
  limit: number;
  orderBy: 'time' | 'magnitude' | 'time-asc' | 'magnitude-asc';
}

// Location search
export interface LocationState {
  name: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
}

export type ViewMode = 'map' | 'list' | 'charts';
