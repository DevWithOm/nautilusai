import { useState, useRef, useEffect } from 'react';
import type { StreamMessage } from '../hooks/useNautilusData';
import { Send, User, Shell } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNautilusStore } from '../store/useNautilusStore';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  activeDebrief: StreamMessage | null;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}


const API_BASE = useNautilusStore.getState().apiBase;

export default function EcoCopilotTab({ activeDebrief }: Props) {
  const summary = useNautilusStore(state => state.coordinatorSummary);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { 
      role: 'assistant', 
      content: "Greetings. I am EcoCopilot. I am initialized and actively monitoring the swarm. How may I assist you with marine anomaly assessment today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pre-load AS-07 or active debrief
  useEffect(() => {
    if (summary?.situation_summary && messages.length === 1 && !messages[0].content.includes('Analysis of')) {
      const displayScore = summary?.score ?? '--';
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `🚨 **PRIORITY INTELLIGENCE FEED**\n\nI've loaded the latest anomaly data for **${activeDebrief?.zone_id || 'AS-07'}**:\n\n> ${summary.situation_summary ?? "Waiting for event..."}\n\n*Recommended Action:* ${summary.recommended_action ?? "Standby."}\n*Convergence Score:* ${displayScore}` }
      ]);
    }
  }, [summary, activeDebrief, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const userText = typeof e === 'string' ? e : input.trim();
    if (!userText || isLoading) return;

    setInput('');
    const userMsg = { role: 'user' as const, content: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          context: summary || {}
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data?.reply || data?.message || data?.text || 'No response received from EcoCopilot.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat fetch error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Unable to reach EcoCopilot backend. Check that FastAPI is running on port 8000. Error: ${error}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SUGGESTIONS = [
    "Summarize AS-07 risks", 
    "What-if trend continues 5 days?", 
    "Which zones are worsening?", 
    "Generate advisory text"
  ];

  return (
    <ErrorBoundary>
    <div className="absolute inset-x-20 top-24 bottom-10 bg-[var(--color-reef-dark)]/95 backdrop-blur-xl border border-[var(--color-reef-accent)]/30 rounded-xl flex flex-col font-sans text-white z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-[var(--color-reef-accent)]/20 bg-black/40 flex gap-4 items-center shrink-0 shadow-md">
        <div className="p-3 bg-gradient-to-br from-[#006D77]/80 to-[#83C5BE]/30 border border-[#83C5BE]/50 rounded-xl shadow-[0_0_15px_rgba(131,197,190,0.2)]">
          <Shell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-[#83C5BE] text-xl font-bold uppercase tracking-widest text-shadow-sm">EcoCopilot</h2>
          <p className="text-xs text-[#83C5BE]/60 tracking-widest uppercase">Generative Mission Analyst</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20" style={{ backgroundSize: '60px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-5 max-w-4xl w-full mx-auto ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-white/10 text-white/80 border border-white/20' : 'bg-gradient-to-br from-[#006D77]/80 to-[#83C5BE]/40 text-white border border-[#83C5BE]/50 shadow-[0_0_10px_rgba(131,197,190,0.3)]'}`}>
              {msg.role === 'user' ? <User size={20} /> : <Shell size={20} />}
            </div>
            
            {/* Message Bubble */}
            <div className={`p-5 leading-relaxed text-[15px] shadow-xl ${msg.role === 'user' ? 'bg-[#2B2D31]/90 border border-white/10 text-white rounded-2xl rounded-tr-md' : 'bg-[#006D77]/30 border border-[#83C5BE]/30 text-white rounded-2xl rounded-tl-md backdrop-blur-sm'}`}>
              <div className="prose prose-invert prose-p:my-2 prose-pre:bg-black/60 prose-a:text-[#83C5BE] prose-pre:border prose-pre:border-white/10 prose-headings:text-[#83C5BE] prose-headings:font-light prose-strong:text-[#83C5BE]">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
            
          </div>
        ))}
        {isLoading && (
          <div className="self-start flex gap-5 max-w-4xl w-full mx-auto">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(131,197,190,0.3)] bg-gradient-to-br from-[#006D77]/80 to-[#83C5BE]/40 text-white border border-[#83C5BE]/50">
              <Shell size={20} />
            </div>
            <div className="p-5 bg-[#006D77]/30 border border-[#83C5BE]/30 rounded-2xl rounded-tl-md flex gap-2 items-center h-[60px] backdrop-blur-sm">
               <div className="w-2 h-2 bg-[#83C5BE] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-2 h-2 bg-[#83C5BE] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-2 h-2 bg-[#83C5BE] rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-black/60 border-t border-[var(--color-reef-accent)]/30 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Prompt Pills */}
        <div className="flex justify-center gap-3 mb-4 flex-wrap max-w-4xl mx-auto">
          {SUGGESTIONS.map(s => (
             <button 
               key={s} 
               onClick={() => handleSubmit(s)}
               disabled={isLoading}
               className="text-[11px] font-bold tracking-widest bg-[var(--color-reef-accent)]/10 hover:bg-[var(--color-reef-accent)]/20 text-[var(--color-reef-accent)] px-4 py-2 rounded-full border border-[var(--color-reef-accent)]/40 transition-colors uppercase disabled:opacity-50"
             >
               {s}
             </button>
          ))}
        </div>

        <form onSubmit={(e) => handleSubmit(e)} className="relative flex items-center max-w-4xl mx-auto group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeDebrief ? `Ask EcoCopilot about ${activeDebrief.zone_id || 'AS-07'}...` : "Ask EcoCopilot a marine monitoring question..."}
            className="w-full bg-[#050B0D] border-2 border-[var(--color-reef-accent)]/20 rounded-2xl py-5 pl-6 pr-16 text-white placeholder-white/40 focus:outline-none focus:border-[var(--color-reef-accent)]/70 transition-colors text-[15px] shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-3 p-3 bg-[var(--color-reef-accent)]/20 hover:bg-[var(--color-reef-accent)]/80 hover:text-black text-[var(--color-reef-accent)] rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-[var(--color-reef-accent)]/30 group-focus-within:border-[var(--color-reef-accent)]/60"
          >
            <Send size={20} className="transform -translate-y-px translate-x-px" />
          </button>
        </form>
      </div>

    </div>
    </ErrorBoundary>
  );
}
