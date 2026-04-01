import { useEffect, useState, useRef } from 'react';
import { useNautilusData } from './hooks/useNautilusData';
import MapLayer from './components/MapLayer';
import AgentPanel from './components/AgentPanel';
import IntelligenceFeedTab from './components/IntelligenceFeedTab';
import EcoCopilotTab from './components/EcoCopilotTab';
import MissionDebriefTab from './components/MissionDebriefTab';
import SwarmHealthTab from './components/SwarmHealthTab';
import LandingPage from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import { Toaster, toast } from 'react-hot-toast';
import { Activity } from 'lucide-react';
import './index.css';

function App() {
  const [initStage, setInitStage] = useState<'loading' | 'map-spin' | 'camera-swoop' | 'ready'>('loading');
  const [userInteracted, setUserInteracted] = useState(false);
  const { isAuthenticated, user } = useAuthStore()
  const [entered, setEntered] = useState(false)
  
  const {
    zones,
    wsStatus,
    streamMessages,
    activeDebrief,
  } = useNautilusData();



  const [activeTab, setActiveTab] = useState<'home' | 'explorer' | 'intelligence' | 'copilot' | 'debrief' | 'health'>('home');

  const handleInteraction = () => {
    if (!userInteracted) setUserInteracted(true);
  };

  // Sonar sound generator using Web Audio API
  const playSonarChime = () => {
    if (!userInteracted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch for ping
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.5); // Drop off
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio block failed", e);
    }
  };

  useEffect(() => {
    // Stage 1: Skeleton loader (simulated 1.5s delay)
    const t1 = setTimeout(() => {
      setInitStage('map-spin');
    }, 1500);

    // Stage 2: Map Spin (simulated 2s wait) -> Camera swoop
    const t2 = setTimeout(() => {
      setInitStage('camera-swoop');
    }, 3500);

    // Stage 3: Ready
    const t3 = setTimeout(() => {
      setInitStage('ready');
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Handle debrief arrival sound and toast
  const prevDebrief = useRef(activeDebrief);
  useEffect(() => {
    if (activeDebrief && activeDebrief !== prevDebrief.current) {
      playSonarChime();
      
      let parsed: any = {};
      try { parsed = activeDebrief.mission_debrief ? JSON.parse(activeDebrief.mission_debrief) : {} } catch(e){}
      const score = parsed.score || activeDebrief.final_score || 0;
      
      if (parsed.tier === 'critical' || parsed.tier === 'CRITICAL' || score >= 75) {
         toast.error(`Anomaly Detected in ${activeDebrief.zone_id || 'UNK'}`, { style: { background: '#FF4D4D', color: '#FFF' } });
      } else {
         toast.success(`Analysis Complete for ${activeDebrief.zone_id || 'UNK'}`);
      }
    }
    prevDebrief.current = activeDebrief;
  }, [activeDebrief, userInteracted]);

  if (!isAuthenticated || !entered) {
    return <LoginPage onLogin={() => setEntered(true)} />
  }

  return (
    <div 
      className="w-full h-screen bg-[#003B46] text-white font-sans overflow-hidden relative"
      onClick={handleInteraction}
    >
      <Toaster position="top-right" toastOptions={{
        style: { background: '#004B49', color: '#F8F9FA', border: '1px solid #83C5BE' },
        duration: 4000
      }}/>
      {/* Wave Skeleton Loader Screen */}
      <div 
        className={`absolute inset-0 bg-[#003B46] z-50 flex flex-col items-center justify-center transition-opacity duration-700 pointer-events-none
          ${initStage !== 'loading' ? 'opacity-0' : 'opacity-100'}
        `}
      >
        <div className="flex justify-center items-center gap-2 mb-4">
          <Activity className="text-[#83C5BE] w-12 h-12 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extralight tracking-[0.3em] text-[#C4DFE6] uppercase">
          Nautilus<span className="font-bold text-[#83C5BE]">AI</span>
        </h1>
        <p className="text-xs tracking-widest text-[#66A5AD] mt-4 uppercase animate-pulse">
          Living Ocean Explorer
        </p>
        
        {/* Simple CSS Wave Loader */}
        <div className="flex gap-1 mt-8 h-8 items-end">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-[#83C5BE] rounded-t-sm"
              style={{
                height: '100%',
                animation: `wave 1s infinite alternate ${i * 0.1}s`
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes wave {
            0% { height: 20%; opacity: 0.3; }
            100% { height: 100%; opacity: 1; }
          }
        `}</style>
      </div>

      {/* Main UI (mounted at map-spin stage) */}
      {(initStage === 'map-spin' || initStage === 'camera-swoop' || initStage === 'ready') && (
        <>
          {/* Glass Navbar */}
          <nav className="absolute inset-x-6 top-6 flex justify-between items-start pointer-events-auto z-20">
            <div>
               <h1 className="text-2xl font-extralight tracking-[0.2em] text-white uppercase drop-shadow-lg">
                 Nautilus<span className="font-bold text-[#83C5BE]">AI</span>
               </h1>
               <p className="text-[10px] tracking-widest text-[#66A5AD] uppercase mt-1">Sensor Grid Active</p>
            </div>
            
            <div className="bg-[var(--color-reef-glass)] backdrop-blur-md border border-[var(--color-reef-accent)]/30 rounded-full flex overflow-hidden">
               <button 
                 onClick={() => setActiveTab('home')}
                 className={`px-6 py-2 text-xs font-semibold tracking-widest uppercase transition-colors text-[var(--color-reef-text)] hover:bg-[var(--color-reef-accent)]/20 border-r border-[var(--color-reef-accent)]/30`}
               >
                 ⌬
               </button>
               <button 
                 onClick={() => setActiveTab('explorer')}
                 className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${activeTab === 'explorer' ? 'bg-[var(--color-reef-accent)] text-[var(--color-reef-dark)]' : 'text-[var(--color-reef-text)] hover:bg-[var(--color-reef-accent)]/20'}`}
               >
                 Command Center
               </button>
               <button 
                 onClick={() => setActiveTab('intelligence')}
                 className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors border-l border-[var(--color-reef-accent)]/30 ${activeTab === 'intelligence' ? 'bg-[var(--color-reef-accent)] text-[var(--color-reef-dark)]' : 'text-[var(--color-reef-text)] hover:bg-[var(--color-reef-accent)]/20'}`}
               >
                 Intelligence Feed
               </button>
               <button 
                 onClick={() => setActiveTab('copilot')}
                 className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors border-l border-[var(--color-reef-accent)]/30 ${activeTab === 'copilot' ? 'bg-[var(--color-reef-accent)] text-[var(--color-reef-dark)]' : 'text-[var(--color-reef-text)] hover:bg-[var(--color-reef-accent)]/20'}`}
               >
                 EcoCopilot
               </button>
               <button 
                 onClick={() => setActiveTab('debrief')}
                 className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors border-l border-[var(--color-reef-accent)]/30 ${activeTab === 'debrief' ? 'bg-[var(--color-reef-accent)] text-[var(--color-reef-dark)]' : 'text-[var(--color-reef-text)] hover:bg-[var(--color-reef-accent)]/20'}`}
               >
                 Mission Debrief
               </button>
               <button 
                 onClick={() => setActiveTab('health')}
                 className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors border-l border-[var(--color-reef-accent)]/30 ${activeTab === 'health' ? 'bg-[var(--color-reef-accent)] text-[var(--color-reef-dark)]' : 'text-[var(--color-reef-text)] hover:bg-[var(--color-reef-accent)]/20'}`}
               >
                 Swarm Health
               </button>
            </div>

             <div className="flex gap-4 items-center">
                 <div className="bg-[var(--color-reef-glass)] backdrop-blur border border-[var(--color-reef-accent)]/30 px-4 py-2 rounded-full flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-[#00FF87] shadow-[0_0_8px_#00FF87] animate-[pulse-ring_2s_infinite]' : 'bg-[var(--color-reef-coral)] shadow-[0_0_8px_var(--color-reef-coral)]'}`} />
                    <span className={`text-xs tracking-widest uppercase font-bold ${wsStatus === 'connected' ? 'text-[#00FF87]' : 'text-[var(--color-reef-coral)]'}`}>
                      {wsStatus === 'connected' ? 'LIVE' : 'RECONNECTING...'}
                    </span>
                 </div>
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      fontSize: '11px', color: '#83C5BE', fontFamily: 'monospace',
                      textAlign: 'right'
                    }}>
                      <div style={{ fontWeight: '700' }}>{user?.name}</div>
                      <div style={{ color: '#3D5A7A', fontSize: '10px' }}>{user?.organisation} · {user?.role.toUpperCase()}</div>
                    </div>
                    <button onClick={() => { useAuthStore.getState().logout(); window.location.reload() }}
                      style={{
                        background: 'transparent', border: '1px solid rgba(107,140,174,0.3)',
                        borderRadius: '8px', color: '#6B8CAE', padding: '4px 10px',
                        fontSize: '10px', cursor: 'pointer', fontFamily: 'monospace'
                      }}>LOGOUT</button>
                 </div>
             </div>
          </nav>

          {activeTab === 'explorer' && (
            <>
              {/* Map View */}
              <MapLayer zones={zones} onZoneClick={(zone) => {
                 setActiveTab('intelligence');
                 // Will pass selected zone state down in later steps
                 toast.success(`Switched to Intelligence Feed for ${zone.zone_id}`);
              }} />
              
              {/* Left Agent Panel */}
              {initStage === 'ready' && (
                <div className="pointer-events-auto">
                  <AgentPanel messages={streamMessages} wsStatus={wsStatus} />
                </div>
              )}
            </>
          )}

          {activeTab === 'intelligence' && <ErrorBoundary tabName="Intelligence Feed"><IntelligenceFeedTab activeDebrief={activeDebrief} streamMessages={streamMessages} /></ErrorBoundary>}
          {activeTab === 'copilot' && <ErrorBoundary tabName="EcoCopilot"><EcoCopilotTab activeDebrief={activeDebrief} /></ErrorBoundary>}
          {activeTab === 'debrief' && <ErrorBoundary tabName="Mission Debrief"><MissionDebriefTab /></ErrorBoundary>}
          {activeTab === 'health' && <ErrorBoundary tabName="Swarm Health"><SwarmHealthTab streamMessages={streamMessages} /></ErrorBoundary>}

          {activeTab === 'home' && (
            <LandingPage onEnter={() => setActiveTab('explorer')} />
          )}

        </>
      )}
    </div>
  );
}

export default App;
