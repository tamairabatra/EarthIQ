import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Star, X, Flame, Users, User, CheckCircle2, Zap, Leaf, Droplets } from 'lucide-react';
import { Challenge } from '../types';

interface CommunityChallengesProps {
  challenges: Challenge[];
  onClose?: () => void;
  points: number;
  level: number;
}

export const CommunityChallenges: React.FC<CommunityChallengesProps> = ({ challenges, onClose, points, level }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'community'>('personal');

  const personalChallenges = challenges.filter(c => !c.isCommunity);
  const communityChallenges = challenges.filter(c => c.isCommunity);

  const activeChallenges = activeTab === 'personal' ? personalChallenges : communityChallenges;
  const completedCount = activeChallenges.filter(c => c.isCompleted).length;
  const progressPercent = activeChallenges.length > 0 ? (completedCount / activeChallenges.length) * 100 : 0;

  const formatProgressValue = (val: number, isCommunity?: boolean) => {
    if (isCommunity) {
      return Math.floor(val).toLocaleString();
    }
    return val % 1 === 0 ? val.toString() : val.toFixed(1);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl h-full max-h-[80vh]">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Challenges</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Level {level} • {points} Points</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-5">
        {/* Tab Selector */}
        <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'personal'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Personal Goals ({personalChallenges.length})
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'community'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Community Drives ({communityChallenges.length})
          </button>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-3xl p-5 border border-amber-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                  {activeTab === 'personal' ? 'My Goals Progress' : 'Drives Completed'}
                </div>
                <div className="text-2xl font-black text-white">{completedCount}/{activeChallenges.length}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                  {activeTab === 'personal' ? 'Global Rank' : 'Active Coalitions'}
                </div>
                <div className="text-sm font-black text-white">
                  {activeTab === 'personal' ? 'Top 12%' : '4 Global'}
                </div>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
              />
            </div>
          </div>
          <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 -rotate-12" />
        </div>

        {/* Challenges List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">
              {activeTab === 'personal' ? 'Active Personal Goals' : 'Live Community Drives'}
            </h3>
            {activeTab === 'personal' && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                <Flame className="w-3 h-3 animate-bounce" /> 2 Day Streak
              </div>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {activeChallenges.map((challenge) => (
              <motion.div 
                key={challenge.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-white/5 border rounded-3xl p-4 transition-all ${
                  challenge.isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 ${
                    challenge.isCompleted ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'
                  }`}>
                    {challenge.icon === 'zap' && <Zap className={`w-6 h-6 ${challenge.isCompleted ? 'text-emerald-400' : 'text-amber-400'}`} />}
                    {challenge.icon === 'leaf' && <Leaf className={`w-6 h-6 ${challenge.isCompleted ? 'text-emerald-400' : 'text-emerald-400'}`} />}
                    {challenge.icon === 'droplets' && <Droplets className={`w-6 h-6 ${challenge.isCompleted ? 'text-emerald-400' : 'text-blue-400'}`} />}
                    {challenge.icon === 'star' && <Star className={`w-6 h-6 ${challenge.isCompleted ? 'text-emerald-400' : 'text-purple-400'}`} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-black text-white truncate">{challenge.title}</h4>
                        {challenge.isCommunity && (
                          <span className="text-[7px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                            Live Drive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full border border-white/10 shrink-0">
                        <Star className="w-2 h-2 text-amber-400 fill-amber-400" />
                        <span className="text-[8px] font-black text-white">+{challenge.reward}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 font-bold leading-tight mb-3">
                      {challenge.description}
                    </p>
                    
                    {challenge.isCommunity && challenge.participantsCount && (
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-400/80 mb-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2 py-1 w-max">
                        <Users className="w-3.5 h-3.5" />
                        {challenge.participantsCount.toLocaleString()} Active Contributors
                      </div>
                    )}
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className={challenge.isCompleted ? 'text-emerald-400' : 'text-white/40'}>
                          {challenge.isCompleted ? 'Completed' : `${formatProgressValue(challenge.current, challenge.isCommunity)}/${formatProgressValue(challenge.target, challenge.isCommunity)}`}
                        </span>
                        {!challenge.isCompleted && (
                          <span className="text-white/20">{Math.round((challenge.current / challenge.target) * 100)}%</span>
                        )}
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(challenge.current / challenge.target) * 100}%` }}
                          className={`h-full ${challenge.isCompleted ? 'bg-emerald-500' : 'bg-white/20'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {challenge.isCompleted && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
          <Users className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-[10px] text-white/60 font-medium leading-tight">
            Join 12,402 other eco-warriors in this week's community drives. Scan items regularly to advance the global eco-targets and climb the ranks!
          </p>
        </div>
      </div>
    </div>
  );
};
