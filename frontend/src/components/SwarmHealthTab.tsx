import { useEffect, useRef, useState } from 'react';
import type { StreamMessage } from '../hooks/useNautilusData';
import { useNautilusStore } from '../store/useNautilusStore';
import { Terminal, Activity } from 'lucide-react';

interface Props {
  streamMessages: StreamMessage[];
}

export default function SwarmHealthTab({ streamMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [displayedLogs, setDisplayedLogs] = useState<StreamMessage[]>([]);
  

  const zonesProcessed = useNautilusStore(state => state.zonesProcessed);
  const totalZones = useNautilusStore(state => state.totalZones);
  
  // Streaming log effect (300ms delay)
  useEffect(() => {
    // Keep last 50 messages to prevent memory crash
    const latest = streamMessages.slice(-50);
    
    if (latest.length === 0) return;
    
    let index = displayedLogs.length;
    if (index >= latest.length) {
       setDisplayedLogs(latest);
       return;
    }

    const intervalId = setInterval(() => {
      if (index < latest.length) {
        setDisplayedLogs(prev => {
          const next = [...prev, latest[index]];
          return next.slice(-50);
        });
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 150);

    return () => clearInterval(intervalId);
  }, [streamMessages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedLogs]);

  return (
    <div className="absolute inset-x-20 top-24 bottom-10 bg-[var(--color-reef-dark)]/90 backdrop-blur-xl border border-[var(--color-reef-accent)]/30 rounded-xl flex font-mono text-[var(--color-reef-text)] z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* Left Panel: Animated SVG Pipeline & KPI Gauges */}
      <div className="w-1/2 p-6 border-r border-[var(--color-reef-accent)]/20 bg-gradient-to-br from-black/40 to-transparent flex flex-col font-sans">
        
        <h2 className="text-[var(--color-reef-accent)] font-bold uppercase tracking-widest flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-[#00FF87]" /> System Architecture Diagnostics
        </h2>

        {/* API Uptime Rows */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           {[
             { name: 'NASA MODIS', status: '#00FF87' },
             { name: 'Sentinel-3 (CMEMS)', status: '#00FF87' },
             { name: 'ECMWF ERA5', status: '#00FF87' },
             { name: 'INCOIS ERDDAP', status: '#FFB703' }
           ].map((api, idx) => (
             <div key={idx} className="bg-black/20 border border-[var(--color-reef-accent)]/10 rounded px-4 py-2 flex items-center justify-between shadow-inner">
               <span className="text-xs uppercase tracking-wider text-[var(--color-reef-text)]/70">{api.name}</span>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] uppercase font-bold text-white/50">Uptime</span>
                 <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]`} style={{ color: api.status, backgroundColor: api.status }} />
               </div>
             </div>
           ))}
        </div>

        {/* Animated SVG Pipeline */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-6 relative flex flex-col items-center justify-center min-h-[160px] shadow-inner mb-8 overflow-hidden">
           <h3 className="absolute top-3 left-4 text-[10px] uppercase tracking-widest text-[#83C5BE]/60">Data Ingestion Pipeline</h3>
           
           <div style={{position:'relative', padding:'20px 0', width:'100%'}}>
             <svg width="100%" height="90" viewBox="0 0 680 90">
                <defs>
                  <filter id="nodeglow">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* Dashed background line */}
                <line x1="50" y1="45" x2="630" y2="45"
                  stroke="rgba(0,229,255,0.12)" strokeWidth="2" strokeDasharray="5 4"/>

                {/* Nodes */}
                {[
                  {x:50,  label:'Sources',     color:'#00FF87'},
                  {x:170, label:'Kafka',       color:'#00E5FF'},
                  {x:290, label:'Baseline',    color:'#00E5FF'},
                  {x:410, label:'Agents',      color:'#B388FF'},
                  {x:530, label:'Coordinator', color:'#FF4D4D'},
                  {x:630, label:'Output',      color:'#00FF87'},
                ].map((n, i) => (
                  <g key={i}>
                    <circle cx={n.x} cy={45} r={12}
                      fill="rgba(0,50,60,0.9)"
                      stroke={n.color}
                      strokeWidth="2"
                      filter="url(#nodeglow)"
                    />
                    <text x={n.x} y={72} textAnchor="middle"
                      fontSize="9" fill={n.color} fontFamily="monospace" fontWeight="600">
                      {n.label}
                    </text>
                  </g>
                ))}

                {/* Traveling dot — uses animateMotion which works in all browsers */}
                <circle r="6" fill="#00E5FF" opacity="0.95" filter="url(#nodeglow)">
                  <animateMotion dur="2.8s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#flow-path"/>
                  </animateMotion>
                </circle>
                {/* Second dot offset by half duration for continuous flow feel */}
                <circle r="4" fill="#83C5BE" opacity="0.6" filter="url(#nodeglow)">
                  <animateMotion dur="2.8s" begin="1.4s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#flow-path"/>
                  </animateMotion>
                </circle>

                <path id="flow-path"
                  d="M50,45 L170,45 L290,45 L410,45 L530,45 L630,45"
                  fill="none" stroke="none"/>
              </svg>
           </div>
        </div>

        {/* Performance Gauges */}
        <div className="flex flex-col gap-4">
           <div className="bg-black/20 p-4 rounded border border-white/5">
              <div className="flex justify-between text-xs uppercase tracking-widest mb-2 font-bold">
                 <span className="text-[#83C5BE]">Detection Accuracy</span>
                 <span className="text-white">94%</span>
              </div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                 <div className="h-full bg-[#00FF87] shadow-[0_0_10px_#00FF87]" style={{ width: '94%' }} />
              </div>
           </div>
           
           <div className="bg-black/20 p-4 rounded border border-white/5">
              <div className="flex justify-between text-xs uppercase tracking-widest mb-2 font-bold">
                 <span className="text-[var(--color-reef-coral)]">False Positive Rate</span>
                 <span className="text-white">6%</span>
              </div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                 <div className="h-full bg-[var(--color-reef-coral)]" style={{ width: '6%' }} />
              </div>
           </div>

           <div className="bg-black/20 p-4 rounded border border-white/5">
              <div className="flex justify-between text-xs uppercase tracking-widest mb-2 font-bold">
                 <span className="text-[#83C5BE]">Zones Processed</span>
                 <span className="text-white">{zonesProcessed} / {totalZones}</span>
              </div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden relative">
                 <div className="absolute inset-0 bg-blue-500/30 overflow-hidden">
                    <div className="w-[200%] h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)] animate-[wave_5s_linear_infinite]" />
                 </div>
                 <div className="h-full bg-[#448AFF]" style={{ width: `${Math.min(100, Math.max(5, (zonesProcessed / Math.max(1, totalZones)) * 100))}%` }} />
              </div>
           </div>
        </div>

      </div>

      {/* Right Panel: Terminal Area */}
      <div className="w-1/2 flex flex-col bg-[#050B0D] relative shadow-inner shadow-black border-l border-[var(--color-reef-accent)]/20">
        <div className="p-3 bg-black/60 border-b border-[var(--color-reef-accent)]/20 flex gap-4 font-sans shrink-0 items-center">
          <Terminal className="w-4 h-4 text-[#FFB703]" />
          <h3 className="text-xs uppercase tracking-widest text-white/50">Live Swarm Logs</h3>
          <div className="ml-auto flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 text-xs leading-relaxed font-mono">
          <div className="text-[var(--color-reef-accent)]/60 mb-2">// Tail: WebSocket Stream</div>
          
          {displayedLogs
            .filter((msg): msg is StreamMessage => msg != null && typeof msg === 'object' && !!msg.type)
            .slice(-20)
            .map((msg, i, arr) => {
            let typeColor = "text-[#83C5BE]";
            let textColor = "text-white/80";
            
            if (msg.type === 'thinking') {
              typeColor = "text-[#FFB703]"; // amber
            } else if (msg.type === 'voting') {
              typeColor = "text-[#00E5FF]"; // teal
            } else if (msg.type === 'complete' || msg.type === 'coordinator_complete') {
              typeColor = "text-[#00FF87]"; // green
            } else if (msg.type && msg.type.includes('error')) {
              typeColor = "text-[#E29578]"; // coral
            }

            const isLast = i === arr.length - 1;

            return (
              <div key={i} className={`flex items-start gap-4 ${textColor}`}>
                <span className="opacity-40 shrink-0 select-none">[{new Date().toISOString().split('T')[1].slice(0, 11)}]</span>
                <span className={`shrink-0 min-w-[100px] ${typeColor}`}>[{String(msg.type || 'EVENT').toUpperCase()}]</span>
                
                {msg.agent && (
                  <span className="text-[#FFB703]/80 shrink-0 w-24">@{String(msg.agent).toUpperCase()}</span>
                )}
                
                <span className="flex-1 break-words">
                  {String(msg.message || (msg.mission_debrief ? (typeof msg.mission_debrief === 'string' ? msg.mission_debrief : JSON.stringify(msg.mission_debrief)) : null) || (msg.data ? JSON.stringify(msg.data) : "Event Triggered"))}
                  {isLast && (
                    <span className="inline-block w-2.5 h-3.5 bg-[#83C5BE] ml-1 animate-pulse align-middle translate-y-[-1px]"></span>
                  )}
                </span>
              </div>
            );
          })}
          
          {displayedLogs.length === 0 && (
             <span className="inline-block w-2.5 h-3.5 bg-[#83C5BE] ml-1 animate-pulse align-middle translate-y-[-1px]"></span>
          )}
          
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}
