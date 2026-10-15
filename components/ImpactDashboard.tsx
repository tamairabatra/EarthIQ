
import React, { useState } from 'react';
import { ImpactStats, ScanHistoryItem, TrashCategory, Challenge } from '../types';
import { Leaf, Droplets, Cloud, Target, Trophy, BookOpen, ChevronRight, MapPin, Star, Bot, Map, Clock, Trash2, Calendar, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Wrench, Shirt, Zap, Info, User, Users, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis 
} from 'recharts';

interface ImpactDashboardProps {
  stats: ImpactStats;
  scanHistory?: ScanHistoryItem[];
  challenges?: Challenge[];
  onClearHistory?: () => void;
  onOpenEducation?: () => void;
  onOpenLocalInfo?: () => void;
  onOpenChallenges?: () => void;
  onOpenChatbot?: () => void;
  onOpenEcoLand?: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  dailyTarget: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, dailyTarget }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-slate-50 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs z-50">
        <p className="font-black text-slate-500 dark:text-slate-400 uppercase text-[8px] tracking-widest">{label}</p>
        <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm my-0.5">
          {val.toFixed(2)} <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">kg CO₂</span>
        </p>
        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
          {val >= dailyTarget ? 'Target Met 🎉' : `Goal: ${dailyTarget} kg/day`}
        </p>
      </div>
    );
  }
  return null;
};

interface WeeklyCO2ChartProps {
  co2Reduced: number;
  scanHistory?: ScanHistoryItem[];
}

const WeeklyCO2Chart: React.FC<WeeklyCO2ChartProps> = ({ co2Reduced, scanHistory = [] }) => {
  const [weeklyGoal, setWeeklyGoal] = useState<number>(10); // 10 kg CO2 target by default

  const weeklyData = React.useMemo(() => {
    const today = new Date();
    const past7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        co2: 0
      };
    });

    let historyHasMatches = false;
    if (scanHistory.length > 0) {
      scanHistory.forEach(item => {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        const match = past7Days.find(d => d.dateStr === itemDate);
        if (match) {
          historyHasMatches = true;
          let val = 0.5;
          if (item.carbonImpact) {
            const matchNum = item.carbonImpact.match(/(\d+(\.\d+)?)/);
            if (matchNum) val = parseFloat(matchNum[1]);
          }
          match.co2 += val;
        }
      });
    }

    if (!historyHasMatches) {
      const baseRatio = Math.max(0.2, co2Reduced / 7);
      const factors = [0.7, 1.2, 0.8, 1.4, 1.0, 1.6, 1.3];
      past7Days.forEach((d, idx) => {
        d.co2 = parseFloat((baseRatio * factors[idx]).toFixed(2));
      });
    }

    return past7Days.map(d => ({
      day: d.dayName,
      co2: parseFloat(d.co2.toFixed(2))
    }));
  }, [scanHistory, co2Reduced]);

  const currentTotal = React.useMemo(() => {
    const sum = weeklyData.reduce((acc, curr) => acc + curr.co2, 0);
    return Math.max(sum, co2Reduced);
  }, [weeklyData, co2Reduced]);

  const pctAchieved = Math.min(100, Math.round((currentTotal / weeklyGoal) * 100));
  const dailyTarget = parseFloat((weeklyGoal / 7).toFixed(2));

  const radialData = [
    {
      name: 'CO2 Goal',
      value: pctAchieved,
      fill: pctAchieved >= 100 ? '#10b981' : '#34d399'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl p-4 sm:p-5 space-y-3.5 shadow-xl"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Goal Selector */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)] shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Weekly CO₂ Reduction</h3>
              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {pctAchieved}% Target
              </span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Goal: {weeklyGoal} kg CO₂ / week (~{dailyTarget} kg/day)
            </p>
          </div>
        </div>

        {/* Goal selector */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl shrink-0">
          {[5, 10, 20].map((goalVal) => (
            <button
              key={goalVal}
              onClick={() => setWeeklyGoal(goalVal)}
              className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-wider transition-all ${
                weeklyGoal === goalVal
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {goalVal}kg
            </button>
          ))}
        </div>
      </div>

      {/* Animated Gauge & Bar Chart Side-by-Side */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
        {/* Animated Radial Gauge */}
        <div className="sm:col-span-1 h-36 flex flex-col items-center justify-center relative bg-slate-200 dark:bg-slate-950/40 rounded-2xl border border-slate-300 dark:border-white/5 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="65%" 
              outerRadius="90%" 
              barSize={10} 
              data={radialData}
              startAngle={210}
              endAngle={-30}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={true}
                animationDuration={1200}
              >
                <Cell fill={pctAchieved >= 100 ? '#10b981' : '#34d399'} />
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{currentTotal.toFixed(1)}</span>
            <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">/ {weeklyGoal} kg CO₂</span>
            <span className="text-[7px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider mt-0.5">
              {pctAchieved >= 100 ? 'Goal Surpassed! 🎉' : `${(weeklyGoal - currentTotal).toFixed(1)}kg to target`}
            </span>
          </div>
        </div>

        {/* Animated Bar Chart */}
        <div className="sm:col-span-2 h-36 bg-slate-200 dark:bg-slate-950/40 rounded-2xl border border-slate-300 dark:border-white/5 p-2 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                stroke="#64748b" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false} 
                unit="kg" 
              />
              <Tooltip content={<CustomTooltip dailyTarget={dailyTarget} />} />
              <ReferenceLine 
                y={dailyTarget} 
                stroke="#f59e0b" 
                strokeDasharray="3 3" 
                label={{ value: 'Target', fill: '#f59e0b', fontSize: 7, position: 'top' }} 
              />
              <Bar 
                dataKey="co2" 
                radius={[6, 6, 0, 0]} 
                isAnimationActive={true} 
                animationDuration={1200}
              >
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.co2 >= dailyTarget ? '#10b981' : 'url(#barGradient)'} 
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ 
  stats, 
  scanHistory = [],
  challenges = [],
  onClearHistory,
  onOpenEducation,
  onOpenLocalInfo,
  onOpenChallenges,
  onOpenChatbot,
  onOpenEcoLand
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [challengeTab, setChallengeTab] = useState<'personal' | 'community'>('personal');

  const toggleExpandItem = (id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  };

  const getCategoryStyles = (cat: TrashCategory) => {
    switch (cat) {
      case TrashCategory.RECYCLE:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: <Leaf className="w-3 h-3 text-emerald-400" />
        };
      case TrashCategory.ORGANIC:
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-400',
          icon: <Leaf className="w-3 h-3 text-amber-400" />
        };
      case TrashCategory.HAZARDOUS:
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-400',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />
        };
      case TrashCategory.ELECTRONIC:
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          dot: 'bg-cyan-400',
          icon: <Zap className="w-3 h-3 text-cyan-400" />
        };
      case TrashCategory.TEXTILE:
        return {
          bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
          dot: 'bg-purple-400',
          icon: <Shirt className="w-3 h-3 text-purple-400" />
        };
      case TrashCategory.REPAIR:
        return {
          bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
          dot: 'bg-teal-400',
          icon: <Wrench className="w-3 h-3 text-teal-400" />
        };
      case TrashCategory.TRASH:
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          dot: 'bg-rose-400',
          icon: <Trash2 className="w-3 h-3 text-rose-400" />
        };
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };
  const cards = [
      {
        label: 'Eco Points',
        value: (stats.points || 0).toLocaleString(),
        unit: 'XP',
        icon: <Star className="w-5 h-5 text-amber-400" />,
        color: 'from-amber-500/20 to-orange-500/20',
        border: 'border-amber-500/30'
      },
      {
        label: 'Current Level',
        value: stats.level || 1,
        unit: 'LVL',
        icon: <Trophy className="w-5 h-5 text-purple-400" />,
        color: 'from-purple-500/20 to-indigo-500/20',
        border: 'border-purple-500/30'
      },
    {
      label: 'Trees Conserved',
      value: stats.treesSaved.toFixed(3),
      unit: 'Trees',
      icon: <Leaf className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30'
    },
    {
      label: 'Water Saved',
      value: stats.waterSaved.toFixed(1),
      unit: 'Liters',
      icon: <Droplets className="w-5 h-5 text-blue-400" />,
      color: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30'
    },
    {
      label: 'CO2 Reduced',
      value: stats.co2Reduced.toFixed(2),
      unit: 'kg',
      icon: <Cloud className="w-5 h-5 text-slate-400" />,
      color: 'from-slate-500/20 to-slate-400/20',
      border: 'border-slate-500/30'
    },
    {
      label: 'Items Sorted',
      value: stats.scannedCount,
      unit: 'Total',
      icon: <Target className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/20 to-pink-500/20',
      border: 'border-rose-500/30'
    }
  ];

  const getActiveStreak = (lastScannedDateStr?: string, storedStreak = 0): number => {
    if (!lastScannedDateStr || storedStreak === 0) return 0;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (lastScannedDateStr === todayStr) {
      return storedStreak;
    }

    const lastDate = new Date(lastScannedDateStr);
    const currentDate = new Date(todayStr);

    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return storedStreak;
    }

    return 0;
  };

  const activeStreak = getActiveStreak(stats.lastScannedDate, stats.streakCount);

  return (
    <div className="w-full space-y-3 sm:space-y-4 pb-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
          <h2 className="text-[11px] sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-400">Your Eco Impact</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenChallenges && (
            <button 
              onClick={onOpenChallenges}
              className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-95"
              id="open-challenges-header-btn"
            >
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
              CHALLENGES
            </button>
          )}
        </div>
      </div>

      {/* Daily Streak Prominent Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 flex items-center justify-between"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent opacity-60" />
        <div className="relative z-10 flex items-center gap-2 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)] sm:shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div className="space-y-0 sm:space-y-0.5">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white">Daily Streak</span>
              {activeStreak > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wide leading-tight max-w-[140px] sm:max-w-xs">
              {activeStreak > 0 
                ? `Keep it up! Scan tomorrow.`
                : `Scan an item today!`
              }
            </p>
          </div>
        </div>
        <div className="relative z-10 text-right shrink-0 pl-1 sm:pl-2">
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tighter flex items-baseline justify-end gap-1">
            {activeStreak}
            <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Days</span>
          </div>
          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-500 block">
            {stats.lastScannedDate ? `Last: ${stats.lastScannedDate}` : 'No scans'}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {cards.map((card, idx) => {
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-xl sm:rounded-2xl border ${card.border} bg-slate-900/50 backdrop-blur-xl p-3 sm:p-4 group text-left`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between">
                  {React.cloneElement(card.icon as React.ReactElement<any>, { className: 'w-4 h-4 sm:w-5 sm:h-5 ' + (((card.icon as React.ReactElement<any>).props as any)?.className || '') })}
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                    {card.value}
                  </div>
                  <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {card.label}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly CO2 Reduction Goal Chart Component (Recharts) */}
      <WeeklyCO2Chart co2Reduced={stats.co2Reduced} scanHistory={scanHistory} />
      

      {/* Active Challenges & Eco Goals Section */}
      {challenges && challenges.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Active Challenges & Drives</h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-black border border-amber-500/20">
                {challenges.filter(c => c.isCompleted).length}/{challenges.length}
              </span>
            </div>
            {onOpenChallenges && (
              <button 
                onClick={onOpenChallenges}
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all active:scale-95"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-white/5 gap-1">
            <button
              onClick={() => setChallengeTab('personal')}
              className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                challengeTab === 'personal'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-bold'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Personal Goals ({challenges.filter(c => !c.isCommunity).length})
            </button>
            <button
              onClick={() => setChallengeTab('community')}
              className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                challengeTab === 'community'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 font-bold'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Community Drives ({challenges.filter(c => c.isCommunity).length})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {challenges
              .filter(c => challengeTab === 'personal' ? !c.isCommunity : c.isCommunity)
              .map((c) => {
                const pct = Math.min(100, Math.round((c.current / c.target) * 100));
                return (
                  <div 
                    key={c.id} 
                    className={`bg-slate-900/40 backdrop-blur-xl border rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 transition-all hover:bg-slate-900/60 ${
                      c.isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                          c.isCompleted ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-amber-400'
                        }`}>
                          {c.icon === 'zap' && <Zap className="w-4 h-4 text-amber-400" />}
                          {c.icon === 'leaf' && <Leaf className="w-4 h-4 text-emerald-400" />}
                          {c.icon === 'droplets' && <Droplets className="w-4 h-4 text-blue-400" />}
                          {c.icon === 'star' && <Star className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-white truncate">{c.title}</h4>
                            {c.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold line-clamp-1">{c.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/10 shrink-0">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[8px] font-black text-amber-400">+{c.reward}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className={c.isCompleted ? 'text-emerald-400' : 'text-slate-400'}>
                          {c.isCompleted ? 'Completed' : `${c.current.toLocaleString()}/${c.target.toLocaleString()}`}
                        </span>
                        <span className="text-amber-400 font-bold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-500 ${c.isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-emerald-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {onOpenLocalInfo && (
          <button 
            onClick={onOpenLocalInfo}
            className="w-full sm:col-span-2 flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest text-white">Local Info</div>
                <div className="text-[8px] font-bold uppercase tracking-tighter text-slate-500">Guidelines & Events</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Scan History Section removed - moved to its own tab */}
    </div>
  );
};
