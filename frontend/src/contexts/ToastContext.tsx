import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'critical' | 'advisory' | 'success' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000); // 4 seconds auto-dismiss
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, toasts, removeToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto bg-[#004B49]/90 backdrop-blur-md px-6 py-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-y border-r border-[#83C5BE]/20
              text-[#F8F9FA] min-w-[300px] flex justify-between items-center
              transform transition-all animate-[toast-slide_0.3s_ease-out]
              ${toast.type === 'critical' ? 'border-l-4 border-l-[#E29578]' : ''}
              ${toast.type === 'advisory' ? 'border-l-4 border-l-[#FFB703]' : ''}
              ${toast.type === 'success' ? 'border-l-4 border-l-[#00FF87]' : ''}
              ${toast.type === 'info' ? 'border-l-4 border-l-[#006D77]' : ''}
            `}
          >
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-[#83C5BE] hover:text-white ml-4">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
