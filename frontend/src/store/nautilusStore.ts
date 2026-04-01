import { create } from 'zustand';

export interface CoordinatorSummary {
  situation_summary: string;
  agent_breakdown: string;
  outlook_48hr: string;
  recommended_action: string;
  score: number;
  tier: 'critical' | 'advisory' | 'watch' | 'normal';
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
  id: string;
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
  setCoordinatorSummary: (s: CoordinatorSummary) => void;
  addMission: (m: Mission) => void;
  setWsStatus: (s: string) => void;
  setZones: (zones: Zone[]) => void;
  updateZoneTier: (zone_id: string, tier: string, score: number) => void;
  setAgentStates: (states: AgentState[]) => void;
}

export const useNautilusStore = create<NautilusStore>((set) => ({
  coordinatorSummary: null,
  missions: [],
  zones: [],
  agentStates: [],
  wsStatus: 'disconnected',
  setCoordinatorSummary: (s) => set({ coordinatorSummary: s }),
  addMission: (m) => set((state) => ({ missions: [...state.missions, m] })),
  setWsStatus: (s) => set({ wsStatus: s as any }),
  setZones: (zones) => set({ zones }),
  updateZoneTier: (zone_id, tier, score) => set((state) => ({
    zones: state.zones.map(z => z.id === zone_id ? { ...z, tier: tier as any, score } : z)
  })),
  setAgentStates: (states) => set({ agentStates: states }),
}));
