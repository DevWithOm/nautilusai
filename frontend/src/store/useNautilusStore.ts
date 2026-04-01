import { create } from 'zustand';

export interface CoordinatorSummary {
  situation_summary: string;
  agent_breakdown: string;
  outlook_48hr: string;
  recommended_action: string;
  score: number;
  tier: 'critical' | 'advisory' | 'watch' | 'normal';
  zone_id?: string;
}

export interface Mission {
  zone_id: string;
  date: string;
  tier: string;
  score: number;
  agents_converged: number;
  outlook: string;
  status: 'pending' | 'dispatched' | 'completed';
}

export interface Zone {
  zone_id: string;
  lat: number;
  lng: number;
  name: string;
  region: string;
  tier?: 'critical' | 'advisory' | 'watch' | 'normal';
  score?: number;
}

export interface AgentState {
  agent: string;
  status: 'thinking' | 'voting' | 'idle';
  reading?: string;
  confidence?: number;
}

interface NautilusStore {
  coordinatorSummary: CoordinatorSummary | null;
  missions: Mission[];
  zones: Zone[];
  agentStates: AgentState[];
  wsStatus: 'live' | 'reconnecting' | 'disconnected' | 'connected';
  zonesProcessed: number;
  totalZones: number;
  setCoordinatorSummary: (s: CoordinatorSummary) => void;
  addMission: (m: Mission) => void;
  setWsStatus: (s: string) => void;
  setZones: (zones: Zone[]) => void;
  updateZoneTier: (zone_id: string, tier: string, score: number) => void;
  setAgentStates: (states: AgentState[]) => void;
  incrementZonesProcessed: () => void;
  resetZonesProcessed: () => void;
  updateMissionStatus: (zoneId: string, status: 'pending' | 'dispatched') => void;
  validatedZones: Record<string, string>;
  validateZone: (zoneId: string, validatorName: string) => void;
}

export const useNautilusStore = create<NautilusStore>((set) => ({
  coordinatorSummary: null,
  missions: [],
  zones: [],
  agentStates: [],
  wsStatus: 'disconnected',
  zonesProcessed: 0,
  totalZones: 25,
  validatedZones: {},
  validateZone: (zoneId: string, validatorName: string) =>
    set(state => ({
      validatedZones: { ...state.validatedZones, [zoneId]: validatorName }
    })),
  setCoordinatorSummary: (s) => set({ coordinatorSummary: s }),
  addMission: (newMission: Mission) =>
    set(state => {
      // Check if a mission for this zone already exists from today
      const today = new Date().toDateString()
      const existingIndex = state.missions.findIndex(m => {
        const mDate = new Date(m.date).toDateString()
        return m.zone_id === newMission.zone_id && mDate === today
      })

      if (existingIndex >= 0) {
        // Update existing mission instead of adding duplicate
        const updated = [...state.missions]
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...newMission,
          // Keep the original timestamp
          date: updated[existingIndex].date
        }
        return { missions: updated }
      }

      // New mission — add it
      return { missions: [...state.missions, newMission] }
    }),
  setWsStatus: (s) => set({ wsStatus: s as any }),
  setZones: (zones) => set({ zones }),
  updateZoneTier: (zone_id, tier, score) => set((state) => ({
    zones: state.zones.map(z => z.zone_id === zone_id ? { ...z, tier: tier as any, score } : z)
  })),
  setAgentStates: (states) => set({ agentStates: states }),
  incrementZonesProcessed: () => set(state => ({
    zonesProcessed: Math.min(state.zonesProcessed + 1, state.totalZones)
  })),
  resetZonesProcessed: () => set({ zonesProcessed: 0 }),
  updateMissionStatus: (zoneId: string, status: 'pending' | 'dispatched') =>
    set(state => ({
      missions: state.missions.map(m =>
        m.zone_id === zoneId ? { ...m, status } : m
      )
    })),
}));
