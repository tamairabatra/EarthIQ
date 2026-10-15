import React from 'react';
import { Sparkles, Shirt, RefreshCw, Leaf, AlertTriangle, Zap, Wrench, Trash2, Layers, ChevronRight, CheckCircle2 } from 'lucide-react';
import { DetectedItem, TrashCategory } from '../types';

interface GroupedScanResultsProps {
  items: DetectedItem[];
  selectedIndex: number;
  onSelectItem: (index: number) => void;
  hoveredIndex: number | null;
  onHoverItem: (index: number | null) => void;
}

export interface GroupedItemCategory {
  groupId: string;
  groupTitle: string;
  materialGroupLabel: string;
  icon: React.ElementType;
  colorClass: string;
  badgeBg: string;
  borderColor: string;
  items: { item: DetectedItem; originalIndex: number }[];
  isTextileGroup: boolean;
}

export const GroupedScanResults: React.FC<GroupedScanResultsProps> = ({
  items,
  selectedIndex,
  onSelectItem,
  hoveredIndex,
  onHoverItem
}) => {
  if (!items || items.length === 0) return null;

  // Helper to test if item is textile
  const isTextile = (item: DetectedItem) => {
    if (item.category === TrashCategory.TEXTILE) return true;
    const name = item.item.toLowerCase();
    const group = (item.materialGroup || '').toLowerCase();
    const keywords = ['shirt', 'jeans', 'fabric', 'cotton', 'denim', 'pants', 'towel', 'dress', 'sweater', 'wool', 'cloth', 'curtain', 'linen', 'apparel', 'garment', 'textile', 'jacket', 'scarf', 'socks', 'bedsheet'];
    return keywords.some(k => name.includes(k) || group.includes(k));
  };

  // Helper to classify into material group
  const getGroupKey = (item: DetectedItem) => {
    if (isTextile(item)) return 'textile';

    const name = item.item.toLowerCase();
    const group = (item.materialGroup || '').toLowerCase();

    if (item.category === TrashCategory.ORGANIC || name.includes('food') || name.includes('peel') || name.includes('organic')) {
      return 'organic';
    }
    if (item.category === TrashCategory.ELECTRONIC || name.includes('battery') || name.includes('cable') || name.includes('phone') || name.includes('plug')) {
      return 'electronic';
    }
    if (item.category === TrashCategory.HAZARDOUS || name.includes('chemical') || name.includes('paint') || name.includes('oil')) {
      return 'hazardous';
    }
    if (item.category === TrashCategory.REPAIR || name.includes('fix') || name.includes('broken')) {
      return 'repair';
    }
    if (name.includes('plastic') || name.includes('bottle') || name.includes('tub') || group.includes('plastic')) {
      return 'plastics';
    }
    if (name.includes('paper') || name.includes('cardboard') || name.includes('box') || name.includes('carton') || group.includes('paper')) {
      return 'paper';
    }
    if (name.includes('glass') || name.includes('jar') || name.includes('can') || name.includes('metal') || name.includes('aluminum')) {
      return 'glass_metal';
    }
    
    // Default by TrashCategory
    return item.category.toLowerCase();
  };

  // Build item groups
  const groupsMap = new Map<string, GroupedItemCategory>();

  items.forEach((item, index) => {
    const key = getGroupKey(item);

    if (!groupsMap.has(key)) {
      let groupTitle = "Recyclables & Packaging";
      let materialGroupLabel = "RECYCLE";
      let icon = RefreshCw;
      let colorClass = "text-blue-400 border-blue-500/30 bg-blue-500/10";
      let badgeBg = "bg-blue-600 text-white";
      let borderColor = "border-blue-500/40";
      let isTextileGroup = false;

      if (key === 'textile') {
        groupTitle = "Textiles & Apparel";
        materialGroupLabel = "TEXTILES";
        icon = Shirt;
        colorClass = "text-purple-400 border-purple-500/30 bg-purple-500/10";
        badgeBg = "bg-purple-600 text-white";
        borderColor = "border-purple-500/40";
        isTextileGroup = true;
      } else if (key === 'plastics') {
        groupTitle = "Plastics & Containers";
        materialGroupLabel = "PLASTICS";
        icon = RefreshCw;
        colorClass = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
        badgeBg = "bg-cyan-600 text-white";
        borderColor = "border-cyan-500/40";
      } else if (key === 'paper') {
        groupTitle = "Paper & Cardboard";
        materialGroupLabel = "PAPER";
        icon = RefreshCw;
        colorClass = "text-amber-300 border-amber-500/30 bg-amber-500/10";
        badgeBg = "bg-amber-600 text-slate-950 font-black";
        borderColor = "border-amber-500/40";
      } else if (key === 'organic') {
        groupTitle = "Organic & Compostables";
        materialGroupLabel = "ORGANIC";
        icon = Leaf;
        colorClass = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
        badgeBg = "bg-emerald-600 text-white";
        borderColor = "border-emerald-500/40";
      } else if (key === 'electronic') {
        groupTitle = "Electronics & E-Waste";
        materialGroupLabel = "E-WASTE";
        icon = Zap;
        colorClass = "text-amber-400 border-amber-500/30 bg-amber-500/10";
        badgeBg = "bg-amber-500 text-slate-950 font-black";
        borderColor = "border-amber-500/40";
      } else if (key === 'hazardous') {
        groupTitle = "Hazardous & Chemicals";
        materialGroupLabel = "HAZARDOUS";
        icon = AlertTriangle;
        colorClass = "text-rose-400 border-rose-500/30 bg-rose-500/10";
        badgeBg = "bg-rose-600 text-white";
        borderColor = "border-rose-500/40";
      } else if (key === 'repair') {
        groupTitle = "Repairable Items";
        materialGroupLabel = "REPAIR";
        icon = Wrench;
        colorClass = "text-teal-400 border-teal-500/30 bg-teal-500/10";
        badgeBg = "bg-teal-600 text-white";
        borderColor = "border-teal-500/40";
      } else if (key === 'trash') {
        groupTitle = "General Landfill Trash";
        materialGroupLabel = "TRASH";
        icon = Trash2;
        colorClass = "text-slate-400 border-slate-500/30 bg-slate-500/10";
        badgeBg = "bg-slate-700 text-white";
        borderColor = "border-slate-500/40";
      }

      groupsMap.set(key, {
        groupId: key,
        groupTitle,
        materialGroupLabel,
        icon,
        colorClass,
        badgeBg,
        borderColor,
        items: [],
        isTextileGroup
      });
    }

    groupsMap.get(key)!.items.push({ item, originalIndex: index });
  });

  const groupedCategories = Array.from(groupsMap.values());
  const hasTextileMultiple = groupedCategories.some(g => g.isTextileGroup && g.items.length > 1);

  return (
    <div className="w-full space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Grouping Header Banner */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Items Grouped by Category & Material
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest">
            {items.length} Items Detected
          </span>
        </div>

        {hasTextileMultiple && (
          <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center gap-2.5 text-purple-200 text-xs font-bold shadow-md">
            <Shirt className="w-4 h-4 text-purple-300 shrink-0" />
            <span>Multiple similar textile items detected and grouped together for upcycling & donation!</span>
          </div>
        )}

        <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
          Tap any item or category group below to inspect disposal instructions, CO2 savings, and DIY upcycle guides.
        </p>
      </div>

      {/* Render each category/material group */}
      <div className="space-y-3">
        {groupedCategories.map((group) => {
          const GroupIcon = group.icon;
          const isGroupActive = group.items.some(i => i.originalIndex === selectedIndex);

          return (
            <div
              key={group.groupId}
              className={`bg-slate-950/80 backdrop-blur-md rounded-2xl border ${
                isGroupActive ? `${group.borderColor} shadow-xl ring-1 ring-white/10` : 'border-white/10'
              } p-3.5 space-y-2.5 transition-all duration-300`}
            >
              {/* Group Title Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${group.colorClass}`}>
                    <GroupIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                      <span>{group.groupTitle}</span>
                      {group.items.length > 1 && (
                        <span className="px-1.5 py-0.2 bg-white/10 text-white rounded text-[9px] font-black">
                          {group.items.length} items grouped
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border ${group.badgeBg}`}>
                  {group.materialGroupLabel}
                </span>
              </div>

              {/* Group Items List */}
              <div className="space-y-2 pt-1">
                {group.items.map(({ item, originalIndex }) => {
                  const isSelected = selectedIndex === originalIndex;
                  const isHovered = hoveredIndex === originalIndex;

                  return (
                    <button
                      key={originalIndex}
                      type="button"
                      onClick={() => onSelectItem(originalIndex)}
                      onMouseEnter={() => onHoverItem(originalIndex)}
                      onMouseLeave={() => onHoverItem(null)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/60 text-white shadow-lg shadow-emerald-950/20 scale-[1.01]'
                          : isHovered
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-slate-900/60 border-white/5 text-slate-200 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          <span className="text-[10px] font-black">#{originalIndex + 1}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-black ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                            {item.item}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            Confidence: {Math.round((item.confidence || 0.9) * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Selected
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
