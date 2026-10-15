import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, Star, Sparkles, Brain, AlertTriangle, CheckCircle2, 
  Trash2, Info, Zap, Shirt, Loader2, ArrowRight
} from 'lucide-react';
import { TrashCategory } from '../types';
import { sounds } from '../utils/sound-effects';

interface UnidentifiedPopupProps {
  onClose: () => void;
  onTeachItem: (name: string, category: TrashCategory) => Promise<void>;
  isTeaching: boolean;
  feedback: string | null;
}

export const UnidentifiedPopup: React.FC<UnidentifiedPopupProps> = ({
  onClose,
  onTeachItem,
  isTeaching,
  feedback
}) => {
  const [teachName, setTeachName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TrashCategory>(TrashCategory.RECYCLE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sounds.playSpecial();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachName.trim()) {
      setError("Please enter a name for the item.");
      return;
    }
    setError(null);
    try {
      await onTeachItem(teachName.trim(), selectedCategory);
    } catch (err: any) {
      setError(err.message || "Failed to teach EarthIQ AI.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      
      {/* Cartoon Casual Game Style Popup Wrapper */}
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative w-full max-w-md bg-slate-900 border-4 border-slate-700 rounded-[2.5rem] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        
        {/* Playful Game-like Landscape Background (Inspired by the Image) */}
        <div className="relative h-44 w-full bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-300 overflow-hidden shrink-0 border-b-4 border-slate-700">
          
          {/* Sunny Glow */}
          <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 w-48 h-48 bg-yellow-100/40 rounded-full blur-2xl pointer-events-none" />

          {/* Floating Cartoon Clouds */}
          <div className="absolute top-4 left-[10%] w-14 h-6 bg-white/80 rounded-full blur-[1px] animate-pulse duration-1000" />
          <div className="absolute top-8 right-[15%] w-16 h-7 bg-white/70 rounded-full blur-[1px] animate-pulse duration-[4000ms]" />
          <div className="absolute top-12 left-[45%] w-12 h-5 bg-white/60 rounded-full blur-[1px] animate-pulse duration-[3000ms]" />

          {/* Layered Cartoon Hills (EcoLand style) */}
          <div className="absolute bottom-[-10px] left-[-20px] right-[-20px] h-20 bg-gradient-to-t from-emerald-500 to-green-400 rounded-[100%] transform rotate-1 scale-x-110 opacity-90" />
          <div className="absolute bottom-[-25px] left-[-30px] right-[-30px] h-24 bg-gradient-to-t from-green-600 to-emerald-500 rounded-[100%] transform -rotate-2 scale-x-110" />

          {/* Game Winding Dotted Trail (Matches image path) */}
          <svg className="absolute inset-x-0 bottom-0 h-16 w-full opacity-60 pointer-events-none">
            <path 
              d="M -10 45 Q 80 15, 180 35 T 450 15" 
              fill="none" 
              stroke="white" 
              strokeWidth="5" 
              strokeDasharray="8 8" 
              strokeLinecap="round"
            />
          </svg>

          {/* Floating Gold Coins & Shiny Stars */}
          <div className="absolute bottom-12 left-[25%] transform -translate-x-1/2 z-10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-amber-300 to-orange-400 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow-lg animate-bounce duration-1000">
              ?
            </div>
            {/* Stars below coin */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-0.5 justify-center">
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-500 drop-shadow" />
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-500 drop-shadow" />
            </div>
          </div>

          <div className="absolute bottom-4 right-[25%] z-10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-amber-300 to-orange-400 border-2 border-white flex items-center justify-center font-black text-white text-xs shadow-lg animate-bounce duration-[1500ms]">
              !
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-0.5 justify-center">
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-500 drop-shadow" />
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-500 drop-shadow" />
            </div>
          </div>

          {/* Central Mystery Shimmer Capsule */}
          <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="relative w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl border-4 border-white shadow-xl flex items-center justify-center animate-pulse">
              <HelpCircle className="w-8 h-8 text-white drop-shadow" />
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-200 animate-spin" />
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 bg-slate-900/60 hover:bg-slate-900/90 rounded-full border border-white/20 text-white/80 hover:text-white transition-all shadow-md active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-5 flex-1 bg-slate-900">
          
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" /> 
              Mystery Item Found!
            </h3>
            <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto">
              EarthIQ AI couldn't fully classify this item. Teach the system to earn a huge <span className="text-amber-400 font-black">+100 XP REWARD</span>!
            </p>
          </div>

          {feedback ? (
            /* Success Feedback Card */
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl p-5 text-center space-y-3"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Training Complete!</h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Excellent work, Eco-Trainer! You taught us that <strong className="text-white font-black">{feedback}</strong> is categorized correctly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 w-full"
              >
                Claim 100 XP & Return
              </button>
            </motion.div>
          ) : (
            /* Interactive Teach Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Item Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" /> Item Name / Label
                </label>
                <input 
                  type="text"
                  required
                  value={teachName}
                  onChange={(e) => setTeachName(e.target.value)}
                  placeholder="e.g. Biodegradable Coffee Capsule, Cotton Sock..."
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 transition-all font-bold shadow-inner"
                />
              </div>

              {/* Correct Category Selector Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Correct Eco-Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: TrashCategory.RECYCLE, label: 'Recyclable', color: 'blue', icon: <Trash2 className="w-3.5 h-3.5" /> },
                    { val: TrashCategory.ORGANIC, label: 'Organic', color: 'emerald', icon: <Info className="w-3.5 h-3.5" /> },
                    { val: TrashCategory.TRASH, label: 'General Waste', color: 'rose', icon: <Trash2 className="w-3.5 h-3.5" /> },
                    { val: TrashCategory.HAZARDOUS, label: 'Hazardous', color: 'amber', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                    { val: TrashCategory.ELECTRONIC, label: 'E-Waste', color: 'cyan', icon: <Zap className="w-3.5 h-3.5" /> },
                    { val: TrashCategory.TEXTILE, label: 'Textiles', color: 'purple', icon: <Shirt className="w-3.5 h-3.5" /> },
                  ].map((cat) => {
                    const isSelected = selectedCategory === cat.val;
                    let btnStyle = "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10";
                    
                    if (isSelected) {
                      switch (cat.color) {
                        case 'blue': btnStyle = "bg-blue-500/20 border-blue-400/50 text-blue-300 font-black shadow-lg shadow-blue-500/10"; break;
                        case 'emerald': btnStyle = "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 font-black shadow-lg shadow-emerald-500/10"; break;
                        case 'rose': btnStyle = "bg-rose-500/20 border-rose-400/50 text-rose-300 font-black shadow-lg shadow-rose-500/10"; break;
                        case 'amber': btnStyle = "bg-amber-500/20 border-amber-400/50 text-amber-300 font-black shadow-lg shadow-amber-500/10"; break;
                        case 'cyan': btnStyle = "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 font-black shadow-lg shadow-cyan-500/10"; break;
                        case 'purple': btnStyle = "bg-purple-500/20 border-purple-400/50 text-purple-300 font-black shadow-lg shadow-purple-500/10"; break;
                      }
                    }

                    return (
                      <button
                        key={cat.val}
                        type="button"
                        onClick={() => setSelectedCategory(cat.val)}
                        className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${btnStyle}`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Trigger Buttons */}
              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isTeaching || !teachName.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 hover:from-amber-300 hover:to-orange-400 active:scale-95 disabled:opacity-50"
                >
                  {isTeaching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      TEACHING AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5" />
                      TEACH EARTHIQ
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};
