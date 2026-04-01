import { motion } from 'framer-motion';
import { Activity, Target, CheckCircle, Shell } from 'lucide-react';
import '../index.css'; // ensure animations are available

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  // Simple stats for the frosted glass row
  const stats = [
    { icon: <Activity className="w-5 h-5 text-[var(--color-reef-accent)]" />, text: "4 Active Agents" },
    { icon: <Target className="w-5 h-5 text-[var(--color-reef-accent)]" />, text: "Monitoring: Arabian Sea" },
    { icon: <CheckCircle className="w-5 h-5 text-[var(--color-reef-accent)]" />, text: "System: SYNCED" }
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--color-reef-dark)] to-[var(--color-reef-deep)] z-50">
      
      {/* Background Particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full bg-[var(--color-reef-accent)]"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            animation: `float-up ${Math.random() * 10 + 10}s linear infinite`,
            animationDelay: `-${Math.random() * 10}s`,
            opacity: 0.3
          }}
        />
      ))}

      {/* Ocean Wave at Bottom */}
      <div 
        className="absolute bottom-[-10%] left-0 w-[200%] h-[30%] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, var(--color-reef-accent) 0%, transparent 70%)',
          animation: 'wave 15s ease-in-out infinite alternate',
          transformOrigin: 'bottom center'
        }}
      />

      {/* Background Sonar Pulses */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`sonar-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-reef-accent)]/10"
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ 
              width: "150vw", 
              height: "150vw", 
              opacity: 0 
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              delay: i * 2.5,
              ease: "easeOut" 
            }}
          />
        ))}
      </div>

      {/* Main Hero Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <div className="mb-6 relative flex items-center justify-center">
          {/* Pulsing glow ring behind icon */}
          <div className="absolute inset-0 rounded-full animate-[pulse-ring_3s_infinite]" />
          <div className="relative bg-[var(--color-reef-dark)]/50 p-5 rounded-full border border-[var(--color-reef-accent)]/20 backdrop-blur-md shadow-[0_0_40px_rgba(131,197,190,0.3)]">
            <Shell className="w-14 h-14 text-[var(--color-reef-accent)]" />
          </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-light tracking-[0.3em] text-[var(--color-reef-text)] uppercase drop-shadow-2xl mb-4">
          Nautilus<span className="font-bold text-[var(--color-reef-accent)]">AI</span>
        </h1>
        
        <p className="text-[var(--color-reef-accent)] text-lg md:text-xl tracking-widest font-light uppercase mb-12 opacity-90">
          Autonomous Ocean Intelligence Swarm
        </p>

        {/* Stats Row with stagger */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {stats.map((stat, idx) => (
            <motion.div 
              key={`stat-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 + (idx * 0.2) }}
              className="bg-[var(--color-reef-glass)] backdrop-blur-md border border-[var(--color-reef-accent)]/20 rounded-xl px-6 py-4 flex items-center gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            >
              {stat.icon}
              <span className="text-[var(--color-reef-text)] text-sm font-medium tracking-wider uppercase">{stat.text}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.8, type: "spring" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(131, 197, 190, 0.6)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="relative overflow-hidden group bg-[var(--color-reef-accent)] text-[var(--color-reef-dark)] px-10 py-5 rounded-full font-bold text-lg tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(131,197,190,0.2)]"
        >
          {/* Ripple Water hover effect */}
          <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out" />
          <span className="relative z-10">[ Enter Command Center ]</span>
        </motion.button>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="mt-8 text-xs font-light tracking-[0.2em] uppercase text-[var(--color-reef-text)]"
        >
          "Ocean is quiet. Agents are watching."
        </motion.p>
      </motion.div>
    </div>
  );
}
