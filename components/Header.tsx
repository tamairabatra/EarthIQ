
import React from 'react';
import { Leaf, Trash2, Recycle, RotateCcw, Sun, Moon, Globe } from 'lucide-react';

export const Header: React.FC<{ 
  isConnected: boolean;
  showReset?: boolean;
  onReset?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}> = ({ isConnected, showReset, onReset, isDark = true, onToggleTheme }) => {
  return (
    <header className="sticky top-0 left-0 right-0 w-full z-50 flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg shadow-inner flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">EarthIQ</h1>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0 ${
              isConnected 
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/5' 
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/5'
            }`}>
              <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isConnected ? 'LIVE' : 'DISCONNECTED'}
            </div>
          </div>
          <p className="text-[8px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest whitespace-nowrap mt-0.5">AI Environmental Intelligence</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-md cursor-pointer shrink-0"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 fill-amber-400/20" /> : <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-500 fill-indigo-500/20" />}
          </button>
        )}

        {showReset && onReset && (
          <button 
            onClick={onReset}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/5 transition-all active:scale-95 cursor-pointer"
          >
            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-rose-500 animate-pulse" />
            CLEAR FEED
          </button>
        )}
      </div>
    </header>
  );
};

// Simple Lucide-style icons since we can't import easily
const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-5 h-5">{children}</div>
);
