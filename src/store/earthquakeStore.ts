import { create } from 'zustand';
import type { ProcessedEarthquake, FilterState, LocationState, ViewMode } from '../types/earthquake';
import { fetchEarthquakes } from '../services/api';
import { processFeature, daysAgoDateString, todayDateString } from '../utils/helpers';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type FeedSort = 'newest' | 'strongest' | 'nearest';

interface MapFocus {
  latitude: number;
  longitude: number;
  nonce: number;
}

interface EarthquakeStore {
  earthquakes: ProcessedEarthquake[];
  selectedEarthquake: ProcessedEarthquake | null;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  filters: FilterState;
  location: LocationState;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  feedOpen: boolean;
  filterPanelOpen: boolean;
  toasts: Toast[];
  alertThreshold: number;
  autoRefresh: boolean;
  feedSort: FeedSort;
  mapFocus: MapFocus | null;

  setFilters: (filters: Partial<FilterState>) => void;
  setLocation: (location: Partial<LocationState>) => void;
  setSelectedEarthquake: (eq: ProcessedEarthquake | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  toggleFeed: () => void;
  toggleFilterPanel: () => void;
  fetchData: () => Promise<void>;
  setAlertThreshold: (v: number) => void;
  setAutoRefresh: (v: boolean) => void;
  setFeedSort: (v: FeedSort) => void;
  focusOnMap: (latitude: number, longitude: number) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  resetLocation: () => void;
}

const defaultFilters: FilterState = {
  minMagnitude: 0,
  maxMagnitude: 10,
  minDepth: 0,
  maxDepth: 700,
  startDate: daysAgoDateString(7),
  endDate: todayDateString(),
  limit: 200,
  orderBy: 'time',
};

const defaultLocation: LocationState = {
  name: '',
  latitude: null,
  longitude: null,
  radiusKm: 1000,
};

// Generate cryptographically secure unique IDs for toasts
function generateToastId(): string {
  // crypto.randomUUID() is available in all modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useEarthquakeStore = create<EarthquakeStore>((set, get) => ({
  earthquakes: [],
  selectedEarthquake: null,
  totalCount: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: defaultFilters,
  location: defaultLocation,
  viewMode: 'map',
  sidebarOpen: true,
  feedOpen: false,
  filterPanelOpen: false,
  toasts: [],
  alertThreshold: 5.0,
  autoRefresh: true,
  feedSort: 'newest',
  mapFocus: null,

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setLocation: (location) =>
    set((state) => ({ location: { ...state.location, ...location } })),

  resetLocation: () => set({ location: defaultLocation }),

  setSelectedEarthquake: (eq) => set({ selectedEarthquake: eq }),

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleFeed: () =>
    set((state) => ({ feedOpen: !state.feedOpen, filterPanelOpen: state.feedOpen ? state.filterPanelOpen : false })),

  toggleFilterPanel: () =>
    set((state) => ({ filterPanelOpen: !state.filterPanelOpen, feedOpen: state.filterPanelOpen ? state.feedOpen : false })),

  setAlertThreshold: (v) => set({ alertThreshold: v }),

  setAutoRefresh: (v) => set({ autoRefresh: v }),

  setFeedSort: (v) => set({ feedSort: v }),

  focusOnMap: (latitude, longitude) =>
    set({ mapFocus: { latitude, longitude, nonce: Date.now() } }),

  addToast: (message, type) => {
    const id = generateToastId();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  fetchData: async () => {
    const { filters, location, alertThreshold, addToast } = get();
    set({ isLoading: true, error: null });
    try {
      const locationParam =
        location.latitude !== null && location.longitude !== null
          ? { latitude: location.latitude, longitude: location.longitude, radiusKm: location.radiusKm }
          : undefined;

      const response = await fetchEarthquakes(filters, locationParam);

      const processed = response.features.map((f) =>
        processFeature(f, location.latitude ?? undefined, location.longitude ?? undefined)
      );

      const prevIds = new Set(get().earthquakes.map((e) => e.id));
      const newBig = processed.filter(
        (e) => !prevIds.has(e.id) && e.magnitude >= alertThreshold
      );
      if (newBig.length > 0 && get().earthquakes.length > 0) {
        newBig.forEach((e) =>
          addToast(`⚠️ M${e.magnitude.toFixed(1)} — ${e.place}`, 'warning')
        );
      }

      set({ earthquakes: processed, totalCount: response.metadata.count, lastUpdated: Date.now(), isLoading: false });
    } catch (err) {
      // Ignore AbortError from request deduplication (not a real error)
      if (err instanceof DOMException && err.name === 'AbortError') {
        set({ isLoading: false });
        return;
      }
      // Security: sanitize error messages — don't leak internal details
      const message = err instanceof Error ? err.message : 'Unknown error';
      const sanitized = message.includes('USGS API error')
        ? 'Failed to load earthquake data. Please try again.'
        : message.includes('fetch')
          ? 'Network error. Check your connection and try again.'
          : 'An unexpected error occurred. Please try again.';
      set({ error: sanitized, isLoading: false });
    }
  },
}));
