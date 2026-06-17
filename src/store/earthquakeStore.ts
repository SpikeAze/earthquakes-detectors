import { create } from 'zustand';
import type { ProcessedEarthquake, FilterState, LocationState, ViewMode } from '../types/earthquake';
import { fetchEarthquakes } from '../services/api';
import { processFeature, daysAgoDateString, todayDateString } from '../utils/helpers';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
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
  filterPanelOpen: boolean;
  toasts: Toast[];
  alertThreshold: number;

  setFilters: (filters: Partial<FilterState>) => void;
  setLocation: (location: Partial<LocationState>) => void;
  setSelectedEarthquake: (eq: ProcessedEarthquake | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  toggleFilterPanel: () => void;
  fetchData: () => Promise<void>;
  setAlertThreshold: (v: number) => void;
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
  filterPanelOpen: false,
  toasts: [],
  alertThreshold: 5.0,

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  setLocation: (location) =>
    set((state) => ({ location: { ...state.location, ...location } })),

  resetLocation: () => set({ location: defaultLocation }),

  setSelectedEarthquake: (eq) => set({ selectedEarthquake: eq }),

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleFilterPanel: () => set((state) => ({ filterPanelOpen: !state.filterPanelOpen })),

  setAlertThreshold: (v) => set({ alertThreshold: v }),

  addToast: (message, type) => {
    const id = Date.now().toString();
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },
}));
