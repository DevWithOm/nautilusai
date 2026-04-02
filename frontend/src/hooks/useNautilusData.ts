import { useState, useEffect, useRef } from 'react';

export interface AgentReading {
  confidence: number;
  reading: string;
}

export interface AgentVotes {
  sst: AgentReading;
  chl: AgentReading;
  wind: AgentReading;
  salinity: AgentReading;
}

import { useNautilusStore } from '../store/useNautilusStore';
export interface StreamMessage {
  type: 'thinking' | 'voting' | 'complete' | 'coordinator_complete' | 'ping' | 'pong' | 'agent_update';
  agent?: string;
  status?: string;
  message?: string;
  data?: AgentReading;
  final_score?: number;
  mission_debrief?: any;
  zone_id?: string;
  score?: number;
  tier?: string;
  situation_summary?: string;
  agent_breakdown?: string;
  outlook_48hr?: string;
  recommended_action?: string;
}

const { apiBase: API_BASE, wsBase: WS_BASE } = useNautilusStore.getState();


const ALL_ZONES = [
  // Arabian Sea — West Coast
  { zone_id: 'AS-07', lat: 14.8, lng: 72.1, name: 'AS-07', region: 'Arabian Sea' },
  { zone_id: 'AS-01', lat: 18.5, lng: 66.2, name: 'AS-01', region: 'Arabian Sea' },
  { zone_id: 'AS-02', lat: 20.1, lng: 65.8, name: 'AS-02', region: 'Arabian Sea' },
  { zone_id: 'AS-03', lat: 16.2, lng: 65.5, name: 'AS-03', region: 'Arabian Sea' },
  { zone_id: 'MH-01', lat: 19.8, lng: 70.2, name: 'MH-01', region: 'Maharashtra Coast' },
  { zone_id: 'MH-02', lat: 17.2, lng: 71.5, name: 'MH-02', region: 'Maharashtra Coast' },
  { zone_id: 'GUJ-01', lat: 22.5, lng: 68.2, name: 'GUJ-01', region: 'Gujarat Coast' },
  { zone_id: 'GUJ-02', lat: 21.8, lng: 67.5, name: 'GUJ-02', region: 'Gujarat Coast' },
  { zone_id: 'KAR-01', lat: 13.5, lng: 73.2, name: 'KAR-01', region: 'Karnataka Coast' },
  { zone_id: 'KAR-02', lat: 14.2, lng: 74.1, name: 'KAR-02', region: 'Karnataka Coast' },
  { zone_id: 'KER-01', lat: 10.8, lng: 75.1, name: 'KER-01', region: 'Kerala Coast' },
  { zone_id: 'KER-02', lat: 9.5, lng: 76.2, name: 'KER-02', region: 'Kerala Coast' },
  { zone_id: 'LKS-01', lat: 11.2, lng: 72.8, name: 'LKS-01', region: 'Lakshadweep Sea' },
  { zone_id: 'LKS-02', lat: 10.5, lng: 71.5, name: 'LKS-02', region: 'Lakshadweep Sea' },
  // Bay of Bengal — East Coast
  { zone_id: 'BOB-01', lat: 15.5, lng: 82.5, name: 'BOB-01', region: 'Bay of Bengal' },
  { zone_id: 'BOB-02', lat: 13.2, lng: 81.8, name: 'BOB-02', region: 'Bay of Bengal' },
  { zone_id: 'BOB-03', lat: 17.8, lng: 83.5, name: 'BOB-03', region: 'Bay of Bengal' },
  { zone_id: 'BOB-04', lat: 20.2, lng: 87.2, name: 'BOB-04', region: 'Bay of Bengal' },
  { zone_id: 'BOB-05', lat: 12.5, lng: 80.5, name: 'BOB-05', region: 'Bay of Bengal' },
  { zone_id: 'AND-01', lat: 12.8, lng: 93.2, name: 'AND-01', region: 'Andaman Sea' },
  { zone_id: 'AND-02', lat: 11.5, lng: 92.8, name: 'AND-02', region: 'Andaman Sea' },
  { zone_id: 'GOB-01', lat: 14.8, lng: 80.2, name: 'GOB-01', region: 'Gulf of Mannar' },
  { zone_id: 'PAL-01', lat: 10.2, lng: 79.8, name: 'PAL-01', region: 'Palk Strait' },
  { zone_id: 'IO-01', lat: 8.5, lng: 75.5, name: 'IO-01', region: 'Indian Ocean' },
  { zone_id: 'IO-02', lat: 6.8, lng: 73.2, name: 'IO-02', region: 'Indian Ocean' },
];

export function useNautilusData() {
  const zones = useNautilusStore(state => state.zones);
  const [loadingZones, setLoadingZones] = useState(true);
  
  // WS State
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [activeDebrief, setActiveDebrief] = useState<StreamMessage | null>(null);

  useEffect(() => {
    // 1. Initial Load Config
    if (useNautilusStore.getState().zones.length === 0) {
      const initialZones = ALL_ZONES.map(z => ({ ...z, tier: 'normal' as any, score: 0 }));
      useNautilusStore.getState().setZones(initialZones as any);
    }
    
    // Deduplicate existing missions on load — keep only most recent per zone per day
    const missions = useNautilusStore.getState().missions
    const seen = new Map<string, any>()
    missions.forEach(m => {
      const key = m.zone_id + new Date(m.date).toDateString()
      if (!seen.has(key) || new Date(m.date) > new Date(seen.get(key)!.date)) {
        seen.set(key, m)
      }
    })
    useNautilusStore.setState({ missions: Array.from(seen.values()) })

    setLoadingZones(false);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let mounted = true;

    const initWebSocket = () => {
      if (!mounted) return;
      setWsStatus('connecting');
      const ws = new WebSocket(`${WS_BASE}/api/v1/agents/stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        useNautilusStore.getState().setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        // Guard against empty or malformed messages
        if (!event || !event.data) return;

        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch (e) {
          console.warn('Invalid WebSocket message received:', event.data);
          return;
        }

        // Guard against messages without type field
        if (!msg || typeof msg !== 'object' || !msg.type) {
          console.warn('WebSocket message missing type field:', msg);
          return;
        }

        try {
          // --- FIX 1: Heartbeat intercept ---
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return; // Don't process ping as data
          }

          // Handle generic messages
          setStreamMessages((prev) => [...prev, msg].slice(-20)); // Keep last 20 messages

          // Update agent states in Zustand
          if (msg.agent && msg.agent !== 'coordinator') {
             const currentStates = useNautilusStore.getState().agentStates;
             
             if (msg.type === 'coordinator_complete') {
                 useNautilusStore.getState().setAgentStates(
                     currentStates.map(a => ({ ...a, status: 'idle' as const }))
                 );
             } else {
                 const newStatus = msg.status === 'thinking' || msg.status === 'voting' ? msg.status : 'idle';
                 const exists = currentStates.find(a => a.agent === msg.agent);
                 let newStates;
                 if (exists) {
                   newStates = currentStates.map(a => 
                     a.agent === msg.agent ? { 
                         ...a, 
                         status: newStatus, 
                         reading: msg.data?.reading || a.reading, 
                         confidence: msg.data?.confidence || a.confidence 
                     } : a
                   );
                 } else {
                   newStates = [...currentStates, { 
                       agent: msg.agent, 
                       status: newStatus, 
                       reading: msg.data?.reading, 
                       confidence: msg.data?.confidence 
                   }];
                 }
                 useNautilusStore.getState().setAgentStates(newStates);
             }
          }

          // --- FIX 5: Single source of truth for tier/score ---
          if (msg.type === 'coordinator_complete') {
            useNautilusStore.getState().incrementZonesProcessed();
            // Merge debrief data with top-level fields for consistency
            const debrief = msg.mission_debrief || {};
            const summaryData = {
              ...(typeof debrief === 'object' ? debrief : {}),
              // Top-level tier/score take priority (set by backend get_tier)
              score: msg.score || debrief.score || msg.final_score || 0,
              tier: msg.tier || debrief.tier || 'watch',
              situation_summary: msg.situation_summary || debrief.situation_summary || '',
              agent_breakdown: msg.agent_breakdown || debrief.agent_breakdown || '',
              outlook_48hr: msg.outlook_48hr || debrief.outlook_48hr || '',
              recommended_action: msg.recommended_action || debrief.recommended_action || '',
              zone_id: msg.zone_id || 'UNK',
            };
            setActiveDebrief(msg);
            
            useNautilusStore.getState().setCoordinatorSummary(summaryData);
            
            useNautilusStore.getState().addMission({
              zone_id: msg.zone_id || 'UNK',
              date: new Date().toISOString(),
              tier: summaryData.tier,
              score: summaryData.score,
              agents_converged: 4,
              outlook: summaryData.outlook_48hr || 'N/A',
              status: 'pending'
            });

            // Update Map zone — single source of truth
            if (msg.zone_id) {
               useNautilusStore.getState().updateZoneTier(msg.zone_id, summaryData.tier, summaryData.score);
            }
          }
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsStatus('error');
        useNautilusStore.getState().setWsStatus('error');
      };

      ws.onclose = () => {
        if (!mounted) return;
        setWsStatus('disconnected');
        useNautilusStore.getState().setWsStatus('disconnected');
        // Auto-reconnect logic
        setTimeout(initWebSocket, 5000);
      };
    };

    initWebSocket();

    // Cleanup function ensures we don't leak WebSocket connections on unmount/re-render
    return () => {
      mounted = false;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        // Remove onclose listener to prevent reconnect attempts during cleanup
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const sendFeedback = async (zone_id: string, agent: string, validated: boolean = true) => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          zone_id,
          agent,
          validated,
          comment: "User-validated via UI"
        })
      });
      return await resp.json();
    } catch (err) {
      console.error("Feedback failed:", err);
      return null;
    }
  };

  return {
    zones,
    loadingZones,
    wsStatus,
    streamMessages,
    activeDebrief,
    sendFeedback
  };
}
