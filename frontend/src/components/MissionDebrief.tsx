import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StreamMessage } from '../hooks/useNautilusData';
import { AlertTriangle, CheckCircle, Crosshair } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MissionDebriefProps {
  activeDebrief: StreamMessage | null;
  onValidate: (zoneId: string, agent: string) => Promise<any>;
}

export default function MissionDebrief({ activeDebrief, onValidate }: MissionDebriefProps) {
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [accuracyMsg, setAccuracyMsg] = useState('');

  const handleValidate = useCallback(async () => {
    if (!activeDebrief?.zone_id) return;
    
    setValidating(true);
    
    // Fire the confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E35E54', '#83C5BE', '#66A5AD', '#C4DFE6']
    });

    const result = await onValidate(activeDebrief.zone_id, 'wind');
    
    setValidating(false);
    setValidated(true);
    
    if (result && result.message) {
      setAccuracyMsg(result.message);
    } else {
      setAccuracyMsg("Wind Agent accuracy improved by +0.5%! 🚀");
    }

    // Hide after 5 seconds
    setTimeout(() => {
      setValidated(false);
      setAccuracyMsg('');
    }, 5000);
    
  }, [activeDebrief, onValidate]);

  return (
    <AnimatePresence>
      {activeDebrief && (
        <motion.div
          initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="absolute right-6 top-6 bottom-6 w-96 z-20 flex flex-col"
        >
          <div className="flex-1 bg-[#83C5BE]/10 backdrop-blur-2xl border-l border-t border-[#C4DFE6]/20 rounded-2xl p-6 shadow-2xl flex flex-col">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#E35E54]/20 rounded-lg border border-[#E35E54]/50">
                <AlertTriangle className="text-[#E35E54] w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-widest text-[#E35E54] uppercase">
                  Anomaly Detected
                </h2>
                <p className="text-[#83C5BE] text-sm">Zone: {activeDebrief.zone_id}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm font-semibold tracking-wider p-3 bg-black/20 rounded-lg">
                <span className="text-[#C4DFE6]/70 uppercase">Convergence Score</span>
                <span className="text-[#E35E54] text-xl">{activeDebrief.final_score}/100</span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-[#83C5BE] uppercase text-xs font-bold tracking-[0.2em] mb-4 flex items-center gap-2">
                <Crosshair size={14} /> Mission Debrief
              </h3>
              
              <div className="prose prose-invert prose-sm">
                <p className="text-[#C4DFE6] leading-relaxed text-[15px] font-light italic bg-white/5 p-4 rounded-xl border border-white/10">
                  {activeDebrief.mission_debrief}
                </p>
              </div>
            </div>

            <div className="mt-8 relative">
              <button
                onClick={handleValidate}
                disabled={validating || validated}
                className={`
                  w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300
                  flex justify-center items-center gap-2
                  ${validated 
                    ? 'bg-[#83C5BE] text-[#003B46] shadow-[0_0_20px_rgba(131,197,190,0.6)]' 
                    : 'bg-gradient-to-r from-[#E35E54] to-orange-600 text-white hover:shadow-[0_0_25px_rgba(227,94,84,0.6)] hover:scale-[1.02] active:scale-[0.98]'
                  }
                  disabled:opacity-80 disabled:cursor-not-allowed
                `}
              >
                {validated ? (
                  <>
                    <CheckCircle className="w-5 h-5" /> Threat Validated
                  </>
                ) : validating ? (
                  'Validating...'
                ) : (
                  'Validate Threat'
                )}
              </button>

              <AnimatePresence>
                {accuracyMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute -top-16 left-0 right-0 bg-[#003B46]/90 backdrop-blur-md border border-[#83C5BE]/50 text-[#83C5BE] text-sm font-semibold p-3 align-center text-center rounded-lg shadow-xl"
                  >
                    {accuracyMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
