import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StreamMessage } from '../hooks/useNautilusData';
import { Activity, Thermometer, Wind, Droplet, CheckCircle } from 'lucide-react';

interface AgentPanelProps {
  messages: StreamMessage[];
  wsStatus: string;
}

const AGENTS = [
  { id: 'sst', icon: Thermometer, name: 'SST' },
  { id: 'chl', icon: Activity, name: 'Chlorophyll' },
  { id: 'wind', icon: Wind, name: 'Wind' },
  { id: 'salinity', icon: Droplet, name: 'Salinity' },
];

export default function AgentPanel({ messages, wsStatus }: AgentPanelProps) {
  const [activeAgents, setActiveAgents] = useState<Record<string, StreamMessage['type']>>({});
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
  const [agentData, setAgentData] = useState<Record<string, any>>({});

  useEffect(() => {
    const newActive: Record<string, StreamMessage['type']> = { ...activeAgents };
    const newMessages: Record<string, string> = { ...latestMessages };
    const newData: Record<string, any> = { ...agentData };
    
    // Group by agent ID over the last 15 messages
    messages.slice(-15).forEach(msg => {
      if (msg.type === 'coordinator_complete') {
        // If mission is complete, mark all as complete
        AGENTS.forEach(a => newActive[a.id] = 'coordinator_complete');
      } else if (msg.agent && msg.agent !== 'coordinator') {
        newActive[msg.agent] = msg.type;
        if (msg.message) newMessages[msg.agent] = msg.message;
        if (msg.data) newData[msg.agent] = msg.data;
      }
    });
    
    setActiveAgents(newActive);
    setLatestMessages(newMessages);
    setAgentData(newData);
  }, [messages]);

  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-4 z-10 w-80">
      <div className="backdrop-blur-md bg-[var(--color-reef-glass)] p-3 rounded-lg border border-[var(--color-reef-accent)]/30 mb-2">
        <h3 className="text-[var(--color-reef-accent)] font-bold text-sm tracking-widest uppercase mb-1">
          Agent Swarm
        </h3>
        <p className="text-xs text-[var(--color-reef-text)]/70 uppercase">Status: 
          <span className={wsStatus === 'connected' ? 'text-[#00FF87] ml-2 font-bold' : 'text-[var(--color-reef-coral)] ml-2 font-bold'}>
            {wsStatus === 'connected' ? 'LIVE' : 'RECONNECTING...'}
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {AGENTS.map((agent) => {
          const status = activeAgents[agent.id] || 'idle';
          const msg = latestMessages[agent.id];
          const data = agentData[agent.id];
          const confidence = data?.confidence || 0;
          const reading = data?.reading;
          
          let borderColor = 'border-[var(--color-reef-accent)]/20';
          let glowClass = '';
          let iconColor = 'text-[var(--color-reef-text)]';
          
          if (status === 'thinking') {
            borderColor = 'border-[var(--color-reef-amber)]';
            glowClass = 'shadow-[0_0_15px_rgba(255,183,3,0.4)] animate-pulse';
            iconColor = 'text-[var(--color-reef-amber)]';
          } else if (status === 'voting') {
            borderColor = 'border-[var(--color-reef-accent)]';
            glowClass = 'shadow-[0_0_10px_rgba(131,197,190,0.5)]';
            iconColor = 'text-[var(--color-reef-accent)]';
          } else if (status === 'coordinator_complete' || status === 'complete') {
            borderColor = 'border-[#00FF87]';
            glowClass = 'shadow-[0_0_10px_rgba(0,255,135,0.3)]';
            iconColor = 'text-[#00FF87]';
          }

          return (
            <motion.div 
              key={agent.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`relative overflow-hidden flex flex-col bg-[var(--color-reef-dark)]/80 rounded-[1.2rem] border-2 ${borderColor} ${glowClass} backdrop-blur-md transition-all duration-300`}
            >
              <div className="flex items-center gap-4 p-3">
                <div className="relative">
                   <div className={`absolute inset-0 rounded-full blur-md ${status === 'thinking' ? 'bg-[var(--color-reef-amber)]/40 animate-spin' : 'bg-[var(--color-reef-accent)]/20'}`}></div>
                   <div className="w-10 h-10 rounded-full flex items-center justify-center relative bg-[var(--color-reef-deep)]/50">
                      {status === 'coordinator_complete' || status === 'complete' ? (
                        <CheckCircle size={20} className="text-[#00FF87]" />
                      ) : (
                        <agent.icon size={20} className={iconColor} />
                      )}
                   </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-[var(--color-reef-text)] uppercase tracking-wider">{agent.name}</h4>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm ${status==='thinking' ? 'bg-[var(--color-reef-amber)]/20 text-[var(--color-reef-amber)]' : status==='voting' ? 'bg-[var(--color-reef-accent)]/20 text-[var(--color-reef-accent)]' : status==='coordinator_complete' ? 'bg-[#00FF87]/20 text-[#00FF87]' : 'bg-transparent text-transparent'}`}>
                      {status.replace('coordinator_', '')}
                    </span>
                  </div>
                  
                  {reading && (
                    <p className="text-xs font-mono font-bold text-[var(--color-reef-accent)] mt-0.5">{reading}</p>
                  )}
                  
                  <AnimatePresence mode="popLayout">
                    {msg ? (
                      <motion.p 
                        key={msg}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] text-[var(--color-reef-text)]/70 truncate mt-1 tracking-wide"
                        title={msg}
                      >
                        {msg}
                      </motion.p>
                    ) : (
                      <p className="text-[10px] text-[var(--color-reef-text)]/40 mt-1 italic tracking-wide">Monitoring sector...</p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Confidence Progress Bar */}
              {(confidence > 0 || status === 'thinking') && (
                <div className="h-1 w-full bg-black/20 mt-auto">
                  <motion.div 
                    className={`h-full ${status === 'thinking' ? 'bg-[var(--color-reef-amber)]' : status === 'voting' ? 'bg-[var(--color-reef-accent)]' : 'bg-[#00FF87]'}`}
                    initial={{ width: "0%" }}
                    animate={{ width: status === 'thinking' ? ["0%", "100%", "0%"] : `${confidence}%` }}
                    transition={status === 'thinking' ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
