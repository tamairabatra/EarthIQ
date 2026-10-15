import React from 'react';
import { getCategoryStyles, formatTime } from '../utils/history-utils';
import { Clock, Trash2, Sparkles, ChevronUp, ChevronDown, Info, Trophy, MoreVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ScanHistoryItem } from '../types';

interface ScanHistoryViewProps {
  scanHistory: ScanHistoryItem[];
  onClearHistory?: () => void;
  expandedItemId: string | null;
  toggleExpandItem: (id: string) => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
  scanHistory,
  onClearHistory,
  expandedItemId,
  toggleExpandItem
}) => {
  return (
    <div className="space-y-3 pt-4 p-4 w-full h-full overflow-y-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Scan History</h3>
          {scanHistory.length > 0 && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black border border-emerald-500/20">
              {scanHistory.length}/10
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {scanHistory.length > 0 && onClearHistory && (
            <button 
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-[9px] font-black tracking-wider text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all uppercase"
              title="Clear all history entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
          <button className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="More options">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {scanHistory.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 text-center space-y-2">
          <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto border border-slate-700/50">
            <Sparkles className="w-4 h-4 text-slate-500" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Scans Recorded</h4>
          <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 max-w-[240px] mx-auto leading-relaxed">
            Your last 10 scanned items will be safely archived here for quick referencing.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {scanHistory.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const catStyles = getCategoryStyles(item.category);
            
            return (
              <div 
                key={item.id}
                className="rounded-2xl border border-slate-850 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl overflow-hidden transition-all duration-300"
              >
                {/* Primary Row */}
                <div 
                  onClick={() => toggleExpandItem(item.id)}
                  className="p-3.5 flex items-center gap-3.5 cursor-pointer select-none"
                >
                  {/* Thumbnail Snapshot */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-750 shrink-0 bg-black/40">
                    <img 
                      src={item.image} 
                      alt={item.item} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-black text-white truncate uppercase tracking-wide">
                        {item.item}
                      </span>
                      <span className="text-[8px] text-slate-500 font-bold shrink-0">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category Badge */}
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${catStyles.bg}`}>
                        <span className={`w-1 h-1 rounded-full ${catStyles.dot}`} />
                        {item.category}
                      </span>

                      {/* Match Percent */}
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                        {Math.round(item.confidence * 100)}% Match
                      </span>
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="text-slate-600 hover:text-white transition-colors pl-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Content Drawer */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="border-t border-slate-800/45 bg-slate-950/40 overflow-hidden"
                    >
                      <div className="p-3.5 space-y-3.5 text-left text-[10px] font-medium text-slate-300">
                        {/* Explanation */}
                        {item.reason && (
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Info className="w-3 h-3 text-emerald-400" />
                              AI Sorting Analysis & Prep
                            </span>
                            <div className="bg-slate-900/40 border border-slate-800/30 p-3 rounded-xl text-slate-300 leading-relaxed font-semibold">
                              {item.reason.split('- ').filter(Boolean).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex gap-2 items-start py-1 text-[10px] first:pt-0 last:pb-0">
                                  <span className="text-emerald-400 shrink-0 font-bold">•</span>
                                  <span>{bullet.trim()}</span>
                                </div>
                              ))}
                              {(!item.reason.includes('-') && !item.reason.includes('•')) && (
                                <p>{item.reason}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Environmental Impact Stats */}
                        {item.carbonImpact && (
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              Eco-Contribution & Carbon Impact
                            </span>
                            <div className="bg-slate-900/40 border border-slate-800/30 p-3 rounded-xl text-amber-300/90 font-bold leading-relaxed">
                              {item.carbonImpact}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
