
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Info, ExternalLink, Loader2, RefreshCcw, X, Search, Bell } from 'lucide-react';
import { GroundingLink } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LocalInfoProps {
  onClose: () => void;
  location: { latitude: number; longitude: number } | null;
}

export const LocalInfo: React.FC<LocalInfoProps> = ({ onClose, location }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<string>("");
  const [events, setEvents] = useState<string>("");
  const [links, setLinks] = useState<GroundingLink[]>([]);

  const fetchData = async () => {
    if (isLoading && guidelines) return; // Prevent multiple simultaneous fetches if already have data
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/local-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });

      if (!response.ok) {
        throw new Error("Failed to load local guidelines from the server.");
      }

      const data = await response.json();
      const text = (data.text || "").trim();
      
      // Improved parsing with fallbacks
      const guidelinesMatch = text.match(/Guidelines:([\s\S]*?)(?=Events:|$)/i);
      const eventsMatch = text.match(/Events:([\s\S]*?)$/i);

      let finalGuidelines = "";
      let finalEvents = "";

      if (guidelinesMatch) {
        finalGuidelines = guidelinesMatch[1].trim();
      }
      
      if (eventsMatch) {
        finalEvents = eventsMatch[1].trim();
      }

      // If parsing failed to find sections, use the whole text as guidelines
      if (!finalGuidelines && !finalEvents) {
        finalGuidelines = text;
        finalEvents = "Check the sources below for specific event details.";
      } else {
        finalGuidelines = finalGuidelines || "No specific guidelines found.";
        finalEvents = finalEvents || "No upcoming events found.";
      }

      setGuidelines(finalGuidelines);
      setEvents(finalEvents);
      setLinks(data.links || []);

    } catch (err: any) {
      console.error("LocalInfo Error:", err);
      setError(err.message || "Failed to fetch local information. This might be due to a temporary search service interruption.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl h-full max-h-[80vh]">
      <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white">Local Recycling</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest">Guidelines & Events</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar space-y-6 sm:space-y-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 animate-pulse">Searching Local Data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
              <RefreshCcw className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-xs text-rose-400 font-bold max-w-[200px]">{error}</p>
            <button 
              onClick={fetchData}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
            >
              Retry Search
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Guidelines Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                <Info className="w-3 h-3" /> Local Guidelines
              </div>
              <div className="bg-slate-950/60 rounded-3xl p-5 border border-white/10 shadow-inner">
                <div className="prose prose-invert max-w-none text-white font-medium">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="text-sm font-bold text-slate-100 leading-relaxed mb-3 drop-shadow-sm" {...props} />,
                      li: ({node, ...props}) => (
                        <li className="text-sm font-black text-white leading-relaxed mb-2.5 flex items-start gap-2 drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                          <span className="mt-2 shrink-0 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
                          <span className="flex-1" {...props} />
                        </li>
                      ),
                      ul: ({node, ...props}) => <ul className="space-y-1 mb-4" {...props} />,
                      ol: ({node, ...props}) => <ol className="space-y-2 mb-4 list-decimal pl-6" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-white font-black text-lg uppercase tracking-tight mb-3 border-b border-white/5 pb-1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-white font-black text-base uppercase tracking-tight mb-2 border-b border-white/5 pb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-white font-black text-sm uppercase tracking-tight mb-1.5" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-black drop-shadow" {...props} />
                    }}
                  >
                    {guidelines}
                  </ReactMarkdown>
                </div>
              </div>
            </section>

            {/* Events Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
                <Calendar className="w-3 h-3" /> Upcoming Events
              </div>
              <div className="bg-slate-950/60 rounded-3xl p-5 border border-white/10 shadow-inner">
                <div className="prose prose-invert max-w-none text-white font-medium">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="text-sm font-bold text-slate-100 leading-relaxed mb-3 drop-shadow-sm" {...props} />,
                      li: ({node, ...props}) => (
                        <li className="text-sm font-black text-white leading-relaxed mb-2.5 flex items-start gap-2 drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                          <span className="mt-2 shrink-0 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                          <span className="flex-1" {...props} />
                        </li>
                      ),
                      ul: ({node, ...props}) => <ul className="space-y-1 mb-4" {...props} />,
                      ol: ({node, ...props}) => <ol className="space-y-2 mb-4 list-decimal pl-6" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-white font-black text-lg uppercase tracking-tight mb-3 border-b border-white/5 pb-1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-white font-black text-base uppercase tracking-tight mb-2 border-b border-white/5 pb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-white font-black text-sm uppercase tracking-tight mb-1.5" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-black drop-shadow" {...props} />
                    }}
                  >
                    {events}
                  </ReactMarkdown>
                </div>
              </div>
            </section>

            {/* Sources Section */}
            {links.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  <Search className="w-3 h-3" /> Official Sources
                </div>
                <div className="flex flex-wrap gap-2">
                  {links.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-[10px] text-white/70 font-bold"
                    >
                      {link.title}
                      <ExternalLink className="w-3 h-3 opacity-30" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
          <Bell className="w-4 h-4 text-blue-400 shrink-0" />
          <p className="text-[10px] text-white/60 font-medium leading-tight">
            Information is retrieved in real-time. Check official city websites for the most accurate and up-to-date schedules.
          </p>
        </div>
      </div>
    </div>
  );
};
