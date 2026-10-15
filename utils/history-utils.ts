import { TrashCategory } from '../types';
import { Leaf, AlertTriangle, Zap, Shirt, Wrench, Trash2 } from 'lucide-react';
import React from 'react';

export const getCategoryStyles = (cat: TrashCategory) => {
  switch (cat) {
    case TrashCategory.RECYCLE:
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        dot: 'bg-emerald-400',
        icon: React.createElement(Leaf, { className: "w-3 h-3 text-emerald-400" })
      };
    case TrashCategory.ORGANIC:
      return {
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        dot: 'bg-amber-400',
        icon: React.createElement(Leaf, { className: "w-3 h-3 text-amber-400" })
      };
    case TrashCategory.HAZARDOUS:
      return {
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        dot: 'bg-amber-400',
        icon: React.createElement(AlertTriangle, { className: "w-3 h-3 text-amber-400" })
      };
    case TrashCategory.ELECTRONIC:
      return {
        bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        dot: 'bg-cyan-400',
        icon: React.createElement(Zap, { className: "w-3 h-3 text-cyan-400" })
      };
    case TrashCategory.TEXTILE:
      return {
        bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        dot: 'bg-purple-400',
        icon: React.createElement(Shirt, { className: "w-3 h-3 text-purple-400" })
      };
    case TrashCategory.REPAIR:
      return {
        bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
        dot: 'bg-teal-400',
        icon: React.createElement(Wrench, { className: "w-3 h-3 text-teal-400" })
      };
    case TrashCategory.TRASH:
    default:
      return {
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        dot: 'bg-rose-400',
        icon: React.createElement(Trash2, { className: "w-3 h-3 text-rose-400" })
      };
  }
};

export const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};
