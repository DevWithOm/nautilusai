import { useMemo } from 'react';
import { Database, Clock, Crosshair, BarChart } from 'lucide-react';
import { useNautilusStore } from '../store/useNautilusStore';
import { ErrorBoundary } from './ErrorBoundary';
import toast from 'react-hot-toast';

export default function MissionDebriefTab() {
  const missions = useNautilusStore(state => state.missions);
  const updateMissionStatus = useNautilusStore(state => state.updateMissionStatus);
  const stats = useMemo(() => {
    let totalScore = 0;
    missions.forEach(m => totalScore += m.score);
    return {
       totalMissions: missions.length,
       avgScore: missions.length > 0 ? (totalScore / missions.length).toFixed(1) : '--',
       lastUpdate: missions.length > 0 ? new Date().toLocaleTimeString() : '--'
    };
  }, [missions]);

  return (
    <ErrorBoundary>
    <div className="absolute inset-x-20 top-24 bottom-10 bg-[var(--color-reef-dark)]/95 backdrop-blur-xl border border-[var(--color-reef-accent)]/30 rounded-xl flex flex-col font-sans text-white z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* Top Stat Row */}
      <div className="flex bg-[#020B0E] border-b border-[#83C5BE]/20 shrink-0">
         <div className="flex-1 p-6 border-r border-[#83C5BE]/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-[#83C5BE]/10 rounded border border-[#83C5BE]/20">
                  <Database className="w-6 h-6 text-[#83C5BE]" />
               </div>
               <div>
                  <p className="text-[10px] text-[#83C5BE]/50 uppercase tracking-widest font-bold">Total Missions</p>
                  <p className="text-3xl font-mono text-white tracking-wider">{stats.totalMissions}</p>
               </div>
            </div>
         </div>
         <div className="flex-1 p-6 border-r border-[#83C5BE]/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-[#FFB020]/10 rounded border border-[#FFB020]/20">
                  <BarChart className="w-6 h-6 text-[#FFB020]" />
               </div>
               <div>
                  <p className="text-[10px] text-[#FFB020]/50 uppercase tracking-widest font-bold">Avg Swarm Score</p>
                  <p className="text-3xl font-mono text-white tracking-wider">{stats.avgScore}</p>
               </div>
            </div>
         </div>
         <div className="flex-1 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-[#00FF87]/10 rounded border border-[#00FF87]/20">
                  <Clock className="w-6 h-6 text-[#00FF87]" />
               </div>
               <div>
                  <p className="text-[10px] text-[#00FF87]/50 uppercase tracking-widest font-bold">Last Update Sync</p>
                  <p className="text-xl font-mono text-white tracking-wider mt-1">{stats.lastUpdate}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Flight Manifest Panel */}
      <div className="flex-1 overflow-auto bg-black/40">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-[#020B0E] position-sticky top-0 shadow-md">
            <tr className="border-y border-white/10 text-[10px] uppercase tracking-widest text-[#83C5BE]/60 font-medium">
              <th className="py-4 pl-6 w-[120px]">Zone</th>
              <th className="py-4 w-[140px]">Date</th>
              <th className="py-4 w-[120px]">Tier</th>
              <th className="py-4 w-[160px]">Agents Converged</th>
              <th className="py-4 w-[100px]">Score</th>
              <th className="py-4 pr-4">Outlook</th>
              <th className="py-4 pr-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#83C5BE]/10">
            {missions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-[#83C5BE]/30 italic text-sm tracking-widest">
                  AWAITING FLIGHT MANIFEST DATA...
                </td>
              </tr>
            )}
            {missions.map((row, idx) => {
              const isCritical = row.tier === 'critical' || row.score >= 75;
              
              return (
                 <tr key={`${row.zone_id}-${idx}`} className="hover:bg-white/5 transition-colors group">
                   <td className="py-5 pl-6">
                     <span className={`font-mono text-base font-bold tracking-wider ${isCritical ? 'text-[#FF4D4D]' : 'text-[#83C5BE]'}`}>
                       {row.zone_id || 'UNK'}
                     </span>
                   </td>
                   
                   <td className="py-5">
                     <div className="font-mono text-xs text-white/50">{new Date(row.date).toISOString().split('T')[0]}</div>
                     <div className="font-mono text-[10px] text-white/30">{new Date(row.date).toISOString().split('T')[1].substring(0,8)} UTC</div>
                   </td>
                   
                   <td className="py-5">
                     <span className={`px-2 py-1 text-[9px] font-bold rounded tracking-widest uppercase border ${isCritical ? 'bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/30' : 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'}`}>
                       {row.tier || 'Watch'}
                     </span>
                   </td>
                   
                   <td className="py-5">
                      <div className="flex gap-1.5 items-center">
                         <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/50 border ${isCritical ? 'border-[#FF4D4D]/30 text-[#FF4D4D]/80' : 'border-[#83C5BE]/30 text-[#83C5BE]/80'}`}>
                            {row.agents_converged}/4 agents
                         </span>
                         <span className="ml-2 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{background: row.status==='dispatched'?'#00FF87':'#FFB703', color:'#000'}}>{row.status}</span>
                      </div>
                   </td>
                   
                   <td className="py-5">
                     <div className="flex items-center gap-2">
                       <Crosshair className={`w-3 h-3 ${isCritical ? 'text-[#FF4D4D]/50' : 'text-[#83C5BE]/50'}`} />
                       <span className={`font-mono text-lg font-bold ${isCritical ? 'text-[#FF4D4D]' : 'text-white'}`}>{row.score || '--'}</span>
                     </div>
                   </td>
                   
                   <td className="py-5 pr-4">
                     <p className="text-xs text-white/70 line-clamp-2 md:line-clamp-2 leading-relaxed">
                       {row.outlook}
                     </p>
                   </td>
                   
                   <td className="py-5 pr-6">
                     <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                       {row.status === 'pending' ? (
                         <button
                           onClick={() => {
                             updateMissionStatus(row.zone_id, 'dispatched')
                             toast.success(`Advisory dispatched for Zone ${row.zone_id}`, {
                               style: { borderLeft: '3px solid #00FF87' }
                             })
                           }}
                           style={{
                             background: 'rgba(0,255,135,0.15)',
                             border: '1px solid rgba(0,255,135,0.4)',
                             borderRadius: '6px', color: '#00FF87',
                             padding: '4px 10px', fontSize: '10px',
                             cursor: 'pointer', fontFamily: 'monospace',
                             fontWeight: '700'
                           }}>
                           DISPATCH ↗
                         </button>
                       ) : (
                         <span style={{
                           color: '#00FF87', fontSize: '10px',
                           fontFamily: 'monospace'
                         }}>✓ DISPATCHED</span>
                       )}
                     </div>
                   </td>
                 </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </ErrorBoundary>
  );
}
