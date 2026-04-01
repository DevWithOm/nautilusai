import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StreamMessage } from '../hooks/useNautilusData';
import { Crosshair, AlertTriangle, Wind, Droplets, Thermometer, Leaf, Bot } from 'lucide-react';

interface IntelligenceFeedProps {
  activeDebrief: StreamMessage | null;
  messages: StreamMessage[];
  onValidate?: (zoneId: string, agent: string) => Promise<any>;
}

// Custom Typewriter component for the AI text reveal
function TypewriterText({ text, speed = 15, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    
    // Initial delay before typing starts
    const startDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(startDelay);
  }, [text, speed, delay]);

  return <span>{displayedText}</span>;
}

const safeRender = (value: any): string => {
  if (value === null || value === undefined) return 'Awaiting data...';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

export default function IntelligenceFeed({ activeDebrief, messages }: IntelligenceFeedProps) {
  
  // Extract latest agent readings from the message history
  const agentReadings = {
    sst: messages.filter(m => m.type === 'voting' && m.agent === 'sst').pop()?.data,
    chl: messages.filter(m => m.type === 'voting' && m.agent === 'chl').pop()?.data,
    wind: messages.filter(m => m.type === 'voting' && m.agent === 'wind').pop()?.data,
    salinity: messages.filter(m => m.type === 'voting' && m.agent === 'salinity').pop()?.data,
  };

  // Attempt to parse the structured JSON from the backend
  let parsedDebrief = null;
  if (activeDebrief?.mission_debrief) {
    try {
      parsedDebrief = typeof activeDebrief.mission_debrief === 'string'
        ? JSON.parse(activeDebrief.mission_debrief)
        : activeDebrief.mission_debrief;
    } catch (e) {
      console.error("Failed to parse mission debrief JSON", e);
      // Fallback
      parsedDebrief = {
        situation_summary: activeDebrief.mission_debrief,
        agent_breakdown: "Detailed breakdown unavailable.",
        prediction: "Outlook unavailable.",
        action_plan: "Review nominal parameters."
      };
    }
  }

  return (
    <AnimatePresence>
      {activeDebrief && (
        <motion.div
          initial={{ opacity: 0, x: "100%", filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: "100%", filter: 'blur(10px)' }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute right-6 top-6 bottom-6 w-[450px] z-50 flex flex-col pointer-events-auto"
        >
          <div className="flex-1 bg-[#003B46]/80 backdrop-blur-md border border-[#83C5BE]/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(131,197,190,0.1)] flex flex-col overflow-y-auto overflow-x-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#83C5BE]/20">
              <div className="flex gap-3">
                <div className="mt-1 p-2 bg-[#E35E54]/20 rounded-lg border border-[#E35E54]/50">
                  <AlertTriangle className="text-[#E35E54] w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-widest text-[#E35E54] uppercase">
                    Command Center
                  </h2>
                  <p className="text-[#C4DFE6] text-sm tracking-wider">ZONE IDENT: {activeDebrief.zone_id || 'AS-07'}</p>
                </div>
              </div>

              {/* Circular Convergence Score */}
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full border-4 border-[#83C5BE]/30 flex-shrink-0">
                 <div className="absolute inset-0 rounded-full border-4 border-[#83C5BE] border-t-transparent animate-[spin_4s_linear_infinite]" />
                 <span className="text-[#83C5BE] font-bold z-10">{activeDebrief.final_score}</span>
              </div>
            </div>

            {/* Metrics Grid -- 2x2 Agents */}
            <div className="mb-6">
              <h3 className="text-[#C4DFE6] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80">
                <Crosshair size={14} className="text-[#83C5BE]" /> Component Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-3">
                
                {/* SST */}
                <div className="bg-black/30 border border-[#83C5BE]/10 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[#C4DFE6]/70 uppercase font-bold tracking-wider">Therm (SST)</span>
                    <Thermometer className="w-4 h-4 text-[#E35E54]" />
                  </div>
                  <span className="text-xl text-white font-mono">{agentReadings.sst?.reading || '--'}</span>
                  <div className="absolute bottom-1 right-2 text-[9px] text-[#66A5AD]">CF: {agentReadings.sst?.confidence || 0}%</div>
                </div>

                {/* CHL */}
                <div className="bg-black/30 border border-[#83C5BE]/10 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[#C4DFE6]/70 uppercase font-bold tracking-wider">Bio (CHL)</span>
                    <Leaf className="w-4 h-4 text-[#83C5BE]" />
                  </div>
                  <span className="text-xl text-white font-mono">{agentReadings.chl?.reading || '--'}</span>
                  <div className="absolute bottom-1 right-2 text-[9px] text-[#66A5AD]">CF: {agentReadings.chl?.confidence || 0}%</div>
                </div>

                {/* WIND */}
                <div className="bg-black/30 border border-[#83C5BE]/10 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[#C4DFE6]/70 uppercase font-bold tracking-wider">Atmos (WIND)</span>
                    <Wind className="w-4 h-4 text-[#C4DFE6]" />
                  </div>
                  <span className="text-xl text-white font-mono">{agentReadings.wind?.reading || '--'}</span>
                  <div className="absolute bottom-1 right-2 text-[9px] text-[#66A5AD]">CF: {agentReadings.wind?.confidence || 0}%</div>
                </div>

                {/* SALINITY */}
                <div className="bg-black/30 border border-[#83C5BE]/10 rounded-xl p-3 flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-[#C4DFE6]/70 uppercase font-bold tracking-wider">Hydro (SAL)</span>
                    <Droplets className="w-4 h-4 text-[#66A5AD]" />
                  </div>
                  <span className="text-xl text-white font-mono">{agentReadings.salinity?.reading || '--'}</span>
                  <div className="absolute bottom-1 right-2 text-[9px] text-[#66A5AD]">CF: {agentReadings.salinity?.confidence || 0}%</div>
                </div>

              </div>
            </div>

            {/* EcoCopilot Section */}
            {parsedDebrief && (
              <div className="flex-1 flex flex-col relative">
                <div className="absolute -left-2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#83C5BE] to-transparent rounded-full" />
                
                <h3 className="text-[#83C5BE] uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2 pl-2">
                  <Bot size={16} /> EcoCopilot Analysis
                </h3>
                
                <div className="pl-3 space-y-4 prose prose-invert prose-p:text-sm prose-p:text-[#C4DFE6]/90 prose-p:leading-relaxed">
                  
                  {/* Situation Summary */}
                  <div>
                    <h4 className="text-[10px] text-[#C4DFE6]/50 uppercase tracking-widest mb-1.5">Situation Summary</h4>
                    <p className="font-light italic bg-black/20 p-3 rounded-lg border border-[#83C5BE]/10">
                      <TypewriterText text={safeRender(parsedDebrief.situation_summary)} />
                    </p>
                  </div>

                  {/* Agent Breakdown */}
                  <div>
                    <h4 className="text-[10px] text-[#C4DFE6]/50 uppercase tracking-widest mb-1.5">Agent Breakdown</h4>
                    <p className="text-[#83C5BE]">
                      <TypewriterText text={safeRender(parsedDebrief.agent_breakdown)} delay={500} />
                    </p>
                  </div>

                  {/* Prediction & Action Plan Container */}
                  <div className="grid grid-cols-1 gap-4 mt-2 bg-[#83C5BE]/10 p-4 rounded-xl border border-[#83C5BE]/30">
                    <div>
                      <h4 className="text-[10px] text-[#E9C46A] uppercase tracking-widest mb-1">48-Hr Outlook</h4>
                      <p className="text-sm text-white">
                        <TypewriterText text={safeRender(parsedDebrief.outlook_48hr || parsedDebrief.prediction)} delay={1000} />
                      </p>
                    </div>
                    
                    <div className="mt-2 pt-3 border-t border-[#83C5BE]/20">
                      <h4 className="text-[10px] text-[#E35E54] uppercase tracking-widest mb-1 font-bold">Recommended Action</h4>
                      <p className="text-sm text-white font-medium">
                        <TypewriterText text={safeRender(parsedDebrief.recommended_action || parsedDebrief.action_plan)} delay={1500} />
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
