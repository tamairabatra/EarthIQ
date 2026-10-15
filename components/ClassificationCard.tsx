
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrashCategory, GroundingLink, DIYProject } from '../types';
import { 
  Info, AlertTriangle, MapPin, ExternalLink, Zap, Shirt, Trash2, 
  Loader2, Search, Target, Leaf, RotateCcw, Brain, Wrench, Sparkles, Plus, ArrowRight,
  Bot, Clock, Lightbulb, X, Heart, Droplets, Cloud
} from 'lucide-react';
import { RealWorldMap } from './RealWorldMap';
import { sounds } from '../utils/sound-effects';

interface ClassificationCardProps {
  category: TrashCategory;
  reason: string;
  item: string;
  carbonImpact?: string;
  confidence?: number;
  locationAccess: boolean;
  links?: GroundingLink[];
  isAnalyzing: boolean;
  isSearchingCenters?: boolean;
  onFindCenters?: () => void;
  isReadingAloud?: boolean;
  onReadAloud?: () => void;
  onReset?: () => void;
  onFeedback?: (comment: string) => void;
  isSubmittingFeedback?: boolean;
  feedback?: string | null;
  itemImpact?: {
    treesSaved: number;
    waterSaved: number;
    co2Reduced: number;
  };
  onTeachItem?: (name: string, category: TrashCategory) => void;
  isTeaching?: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  onOpenDiyHub?: (item: string, category: TrashCategory, title?: string, description?: string) => void;
  onOpenDonationHub?: (item: string, category: TrashCategory) => void;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({ 
  category, 
  reason, 
  item, 
  carbonImpact,
  confidence = 0,
  locationAccess,
  links = [],
  isAnalyzing,
  isSearchingCenters,
  onFindCenters,
  isReadingAloud,
  onReadAloud,
  onReset,
  onFeedback,
  isSubmittingFeedback,
  feedback,
  itemImpact,
  onTeachItem,
  isTeaching,
  userLocation,
  onOpenDiyHub,
  onOpenDonationHub
}) => {
  const [showFeedbackInput, setShowFeedbackInput] = React.useState(false);
  const [feedbackValue, setFeedbackValue] = React.useState('');
  const [teachName, setTeachName] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<TrashCategory>(TrashCategory.RECYCLE);

  // Tutorial States
  const [generatingTutorialIndex, setGeneratingTutorialIndex] = React.useState<number | null>(null);
  const [activeTutorial, setActiveTutorial] = React.useState<{
    title: string;
    item: string;
    materialsNeeded: string[];
    difficulty: string;
    estimatedTime: string;
    steps: string[];
    tips: string[];
    imageUrl?: string;
  } | null>(null);
  const [tutorialError, setTutorialError] = React.useState<string | null>(null);

  const handleGenerateTutorial = async (projectTitle: string, projectDesc: string, index: number) => {
    setGeneratingTutorialIndex(index);
    setTutorialError(null);
    try {
      const response = await fetch("/api/diy-tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          item: item,
          description: projectDesc,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate tutorial");
      }

      const data = await response.json();
      let parsed: any;
      if (data.tutorial && typeof data.tutorial === 'object') {
        parsed = data.tutorial;
      } else {
        let cleanText = (data.text || "").trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        }
        parsed = JSON.parse(cleanText);
      }
      
      setActiveTutorial({
        title: projectTitle,
        item: item,
        materialsNeeded: parsed.materialsNeeded || [],
        difficulty: parsed.difficulty || "Medium",
        estimatedTime: parsed.estimatedTime || "30 mins",
        steps: parsed.steps || [],
        tips: parsed.tips || [],
        imageUrl: (projectTitle.toLowerCase().includes('milk carton') || item.toLowerCase().includes('milk carton')) ? '/milk_carton_desk_organizer.jpg' : parsed.imageUrl,
      });
    } catch (err: any) {
      console.error("Error generating tutorial:", err);
      setTutorialError("Could not generate DIY tutorial. Please try again.");
    } finally {
      setGeneratingTutorialIndex(null);
    }
  };


  // Reset lastProcessedItemRef when item changes
  const lastProcessedItemRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!item) {
      lastProcessedItemRef.current = null;
    }
  }, [item]);

  const handleFeedbackSubmit = () => {
    if (feedbackValue.trim() && onFeedback) {
      onFeedback(feedbackValue.trim());
      setShowFeedbackInput(false);
      setFeedbackValue('');
    }
  };

  const handleTeachSubmit = () => {
    if (teachName.trim() && onTeachItem) {
      onTeachItem(teachName.trim(), selectedCategory);
      setTeachName('');
    }
  };

  const getStyles = () => {
    // If not analyzing and no item has been classified yet, show clean standby state
    if (!item && !isAnalyzing) {
      return {
        bg: 'bg-slate-800/40 dark:bg-slate-900/80',
        border: 'border-slate-300 dark:border-slate-800',
        text: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500',
        label: 'AWAITING SCAN',
        icon: <Target className="w-4 h-4 text-white" />
      };
    }

    if (isAnalyzing) {
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        border: 'border-emerald-500/30 dark:border-emerald-500/40',
        text: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500',
        label: 'ANALYZING',
        icon: <Loader2 className="w-4 h-4 animate-spin text-white" />
      };
    }

    switch (category) {
      case TrashCategory.RECYCLE:
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-600/30',
          border: 'border-blue-500/20 dark:border-blue-400/50',
          text: 'text-blue-700 dark:text-blue-300',
          accent: 'bg-blue-500',
          label: 'RECYCLABLE',
          icon: <Trash2 className="w-4 h-4 text-white" />
        };
      case TrashCategory.ORGANIC:
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-600/30',
          border: 'border-emerald-500/20 dark:border-emerald-400/50',
          text: 'text-emerald-700 dark:text-emerald-300',
          accent: 'bg-emerald-500',
          label: 'ORGANIC',
          icon: <Info className="w-4 h-4 text-white" />
        };
      case TrashCategory.HAZARDOUS:
        return {
          bg: 'bg-orange-500/10 dark:bg-amber-600/30',
          border: 'border-orange-500/20 dark:border-amber-400/50',
          text: 'text-orange-700 dark:text-amber-300',
          accent: 'bg-amber-500',
          label: 'HAZARDOUS',
          icon: <AlertTriangle className="w-4 h-4 text-white" />
        };
      case TrashCategory.ELECTRONIC:
        return {
          bg: 'bg-cyan-500/10 dark:bg-cyan-600/30',
          border: 'border-cyan-500/20 dark:border-cyan-400/50',
          text: 'text-cyan-700 dark:text-cyan-300',
          accent: 'bg-cyan-500',
          label: 'E-WASTE',
          icon: <Zap className="w-4 h-4 text-white" />
        };
      case TrashCategory.TEXTILE:
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-600/30',
          border: 'border-purple-500/20 dark:border-purple-400/50',
          text: 'text-purple-700 dark:text-purple-300',
          accent: 'bg-purple-500',
          label: 'TEXTILES',
          icon: <Shirt className="w-4 h-4 text-white" />
        };
      case TrashCategory.REPAIR:
        return {
          bg: 'bg-teal-500/10 dark:bg-teal-600/30',
          border: 'border-teal-500/20 dark:border-teal-400/50',
          text: 'text-teal-700 dark:text-teal-300',
          accent: 'bg-teal-500',
          label: 'REPAIR & UPCYCLE',
          icon: <Wrench className="w-4 h-4 text-white" />
        };
      case TrashCategory.TRASH:
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-600/30',
          border: 'border-rose-500/20 dark:border-rose-400/50',
          text: 'text-rose-700 dark:text-rose-300',
          accent: 'bg-rose-500',
          label: 'GENERAL WASTE',
          icon: <Trash2 className="w-4 h-4 text-white" />
        };
      case TrashCategory.UNKNOWN:
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-950/40',
          border: 'border-amber-500/30 dark:border-amber-500/40',
          text: 'text-amber-600 dark:text-amber-400',
          accent: 'bg-amber-500',
          label: 'UNIDENTIFIED ITEM',
          icon: <AlertTriangle className="w-4 h-4 text-white" />
        };
      default:
        return {
          bg: 'bg-slate-800/40 dark:bg-slate-900/60',
          border: 'border-slate-700/60 dark:border-slate-800',
          text: 'text-slate-600 dark:text-slate-300',
          accent: 'bg-emerald-500',
          label: 'AWAITING SCAN',
          icon: <Target className="w-4 h-4 text-white" />
        };
    }
  };

  const styles = getStyles();
  const showSearchButton = !isAnalyzing && (category === TrashCategory.HAZARDOUS || category === TrashCategory.ELECTRONIC || category === TrashCategory.TEXTILE || category === TrashCategory.REPAIR);
  const confidencePercent = Math.round(confidence * 100);

  const hasExplicitDonateBlock = React.useMemo(() => {
    if (!reason) return false;
    return /^\s*[-*•\d.]*\s*(?:\*\*)?Donate(?:\*\*)?/im.test(reason);
  }, [reason]);

  const isEligibleForDonation = React.useMemo(() => {
    if (!item && !reason) return false;
    if (category === TrashCategory.TEXTILE) return true;
    const text = (reason + ' ' + item + ' ' + category).toLowerCase();
    const donateKeywords = ['donate', 'donation', 'charity', 'thrift', 'shelter', 'goodwill', 'salvation army', 'apparel', 'clothing', 'garment', 'furniture', 'toy', 'book'];
    return donateKeywords.some(kw => text.includes(kw));
  }, [reason, item, category]);

  const renderReason = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          
          // Check if this line is one of our special categories (Recycle, Reuse, Donate)
          const match = trimmed.match(/^\s*[-*•\d.]*\s*(?:\*\*)?(Recycle|Reuse|Donate)(?:\*\*)?\s*(?::| -)?\s*(.*)$/i);
          
          // Helper to safely format **bold** markdown tags
          const formatText = (txt: string) => {
            return txt.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>');
          };

          if (match) {
            const categoryName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            const cleanContent = match[2].trim();

            if (categoryName === 'Recycle') {
              if (category !== TrashCategory.RECYCLE) {
                return null;
              }
              return (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-sm leading-relaxed text-emerald-800 dark:text-emerald-100 font-bold drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 shadow-lg">
                  <span className="mt-0.5 p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-md">
                    <RotateCcw className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <span dangerouslySetInnerHTML={{ __html: formatText(`**Recycle**: ${cleanContent}`) }} />
                  </div>
                </div>
              );
            }
            if (categoryName === 'Reuse') {
              return (
                <div key={idx} className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 text-sm leading-relaxed text-black dark:text-orange-100 font-bold drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 p-1.5 rounded-xl bg-orange-100 dark:bg-orange-500/25 text-orange-600 dark:text-orange-300 flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <span dangerouslySetInnerHTML={{ __html: formatText(`**Reuse**: ${cleanContent}`) }} />
                    </div>
                  </div>
                  {onOpenDiyHub && item && (
                    <button
                      type="button"
                      onClick={() => onOpenDiyHub(item, category, `Upcycle ${item}`, cleanContent)}
                      className="mt-1 self-start flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Reuse Project in Info Hub →</span>
                    </button>
                  )}
                </div>
              );
            }
            if (categoryName === 'Donate') {
              return (
                <div key={idx} className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-sm leading-relaxed text-black dark:text-purple-100 font-bold drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 p-1.5 rounded-xl bg-purple-100 dark:bg-purple-500/25 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-md">
                      <Heart className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <span dangerouslySetInnerHTML={{ __html: formatText(`**Donate**: ${cleanContent}`) }} />
                    </div>
                  </div>
                  {onOpenDonationHub && item && (
                    <button
                      type="button"
                      onClick={() => onOpenDonationHub(item, category)}
                      className="mt-1 self-start flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Find Nearby Donation Hub (~10-20 min away) →</span>
                    </button>
                  )}
                </div>
              );
            }
          }

          // Otherwise, check for general bullet list indicators
          const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•') || trimmed.match(/^\d+\.\s+/);
          // Strip out bullet indicators for rendering
          const cleanLine = trimmed.replace(/^([-*•]|\d+\.)\s+/, '');

          if (isBullet) {
            // Avoid rendering empty or rogue markers
            if (!cleanLine.trim() || cleanLine.trim() === '**') return null;

            return (
              <div key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-100 font-bold drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                <span className={`mt-2 shrink-0 w-2 h-2 rounded-full ${styles.accent} shadow-md shadow-emerald-500/20`} />
                <span dangerouslySetInnerHTML={{ __html: formatText(cleanLine) }} />
              </div>
            );
          }

          return (
            <p 
              key={idx} 
              className="text-sm leading-relaxed font-semibold text-slate-900 dark:text-slate-100 drop-shadow-sm animate-in fade-in duration-300"
              dangerouslySetInnerHTML={{ __html: formatText(trimmed) }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full p-5 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-500 
      ${styles.bg} ${styles.border}`}>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${styles.accent} text-white shadow-lg`}>
            {styles.icon}
          </span>
          <span className={`text-[11px] font-black tracking-[0.2em] ${styles.text}`}>
            {isAnalyzing ? 'SYSTEM SCANNING' : styles.label}
          </span>
          {onReset && !isAnalyzing && item && (
            <button 
              onClick={onReset}
              className="ml-3 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-lg"
              title="Clear current analysis"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              CLEAR
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {locationAccess && !isAnalyzing && (
            <div 
              className="flex items-center justify-center p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all shadow-md animate-pulse shrink-0"
              title="GPS Active / Location Senses Enabled"
            >
              <MapPin className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {isAnalyzing ? "Processing Frame..." : (item || "Ready to Scan")}
          </h3>
        </div>

        {item && !isAnalyzing && confidence > 0 && (
          <div className="space-y-1.5 mt-1 mb-3">
            <div className="flex items-center justify-between text-[10px] font-black">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                <Target className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>AI Confidence</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs shadow-sm">
                {confidencePercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
              <div 
                className={`h-full ${styles.accent} transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
                style={{ width: `${confidencePercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 my-3 shadow-inner">
          {isAnalyzing ? (
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed animate-pulse flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500 dark:text-emerald-400" />
              Identifying material types and disposal protocols...
            </p>
          ) : reason ? (
            <div className="space-y-4">
              {renderReason(reason)}
              
              {onOpenDonationHub && item && !isAnalyzing && isEligibleForDonation && !hasExplicitDonateBlock && (
                <div className="p-3.5 rounded-2xl bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-sm leading-relaxed text-slate-900 dark:text-purple-100 font-bold flex flex-col gap-2.5 drop-shadow-sm animate-in fade-in slide-in-from-left-2 duration-300 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 p-1.5 rounded-xl bg-purple-200 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 shadow-md">
                      <Heart className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <span className="font-black text-slate-900 dark:text-purple-200">Donate & Give Back </span>
                      <span className="text-slate-800 dark:text-purple-100 font-semibold">{item} is eligible for donation to local charities & drop-off centers.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDonationHub(item, category)}
                    className="mt-0.5 self-start flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Find Nearby Donation Hub (~10-20 min away) →</span>
                  </button>
                </div>
              )}
              
              {showSearchButton && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={onFindCenters}
                    disabled={isSearchingCenters}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-slate-300 dark:border-white/20 transition-all text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-xl"
                  >
                    {isSearchingCenters ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        LOCATING CENTERS...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        FIND DISPOSAL CENTER NEARBY
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {links.length > 0 && !isAnalyzing && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nearby Locations:</p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {links.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-none flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl border border-emerald-500/20 transition-all text-[11px] text-emerald-800 dark:text-white font-bold"
                      >
                        {link.title}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    ))}
                  </div>

                  <div className="mt-3 h-[380px] w-full animate-in fade-in slide-in-from-top-3 duration-300">
                    <RealWorldMap 
                      userLocation={userLocation}
                      itemLabel={item}
                      category={category}
                      groundingLinks={links}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 py-1">
              <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Instructions</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  Position the item in front of your camera or upload a photo to identify materials and eco-friendly disposal guidelines.
                </p>
              </div>
            </div>
          )}
        </div>

        {itemImpact && !isAnalyzing && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-xl p-2 border border-white/10 flex flex-col items-center text-center">
              <Leaf className="w-3 h-3 text-emerald-400 mb-1" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{itemImpact.treesSaved.toFixed(3)}</span>
              <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter">Trees</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/10 flex flex-col items-center text-center">
              <Droplets className="w-3 h-3 text-blue-400 mb-1" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{itemImpact.waterSaved.toFixed(1)}L</span>
              <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter">Water</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/10 flex flex-col items-center text-center">
              <Cloud className="w-3 h-3 text-slate-400 mb-1" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white">{itemImpact.co2Reduced.toFixed(2)}kg</span>
              <span className="text-[7px] font-bold text-white/40 uppercase tracking-tighter">CO2</span>
            </div>
          </div>
        )}

        {carbonImpact && !isAnalyzing && (
          <div className="mt-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-3 px-4 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-xl overflow-hidden">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Environmental Benefit</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-[8px] font-black text-slate-950 rounded-md uppercase tracking-tighter">Positive Impact</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{carbonImpact}</span>
              </div>
            </div>
          </div>
        )}

        {/* No DIY projects section here anymore */}

      </div>

      {!isAnalyzing && showFeedbackInput && !feedback && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Teach EarthIQ AI</span>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            Specify the correct name and select its category to teach our system what this item is.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Item Name</label>
              <input 
                type="text"
                value={teachName}
                onChange={(e) => setTeachName(e.target.value)}
                placeholder="e.g. Biodegradable Bamboo Toothbrush..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Correct Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: TrashCategory.RECYCLE, label: 'Recyclable' },
                  { val: TrashCategory.ORGANIC, label: 'Organic' },
                  { val: TrashCategory.TRASH, label: 'General Waste' },
                  { val: TrashCategory.HAZARDOUS, label: 'Hazardous' },
                  { val: TrashCategory.ELECTRONIC, label: 'E-Waste' },
                  { val: TrashCategory.TEXTILE, label: 'Textiles' },
                  { val: TrashCategory.REPAIR, label: 'Repair' },
                ].map((item) => {
                  const getCatColor = (val: TrashCategory) => {
                    switch(val) {
                      case TrashCategory.RECYCLE: return selectedCategory === val ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/5 bg-white/5';
                      case TrashCategory.ORGANIC: return selectedCategory === val ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 bg-white/5';
                      case TrashCategory.TRASH: return selectedCategory === val ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/5 bg-white/5';
                      case TrashCategory.HAZARDOUS: return selectedCategory === val ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/5 bg-white/5';
                      case TrashCategory.ELECTRONIC: return selectedCategory === val ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/5 bg-white/5';
                      case TrashCategory.TEXTILE: return selectedCategory === val ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20' : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/5 bg-white/5';
                      case TrashCategory.REPAIR: return selectedCategory === val ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-lg shadow-teal-500/20' : 'border-teal-500/30 text-teal-400 hover:bg-teal-500/5 bg-white/5';
                      default: return '';
                    }
                  };
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSelectedCategory(item.val)}
                      className={`flex items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${getCatColor(item.val)}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={handleTeachSubmit}
                disabled={isTeaching || !teachName.trim()}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                {isTeaching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    TEACHING...
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5" />
                    TEACH EARTHIQ AI
                  </>
                )}
              </button>
              {category !== TrashCategory.UNKNOWN && (
                <button 
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!isAnalyzing && category !== TrashCategory.UNKNOWN && !showFeedbackInput && item && !feedback && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button 
            onClick={() => setShowFeedbackInput(true)}
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-3 h-3" />
            Wrong identification? Teach EarthIQ
          </button>
        </div>
      )}

      {feedback && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
            <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Knowledge Learned Successfully!</p>
              <p className="text-[11px] text-white/80 leading-relaxed">
                EarthIQ has memorized <strong className="text-white font-black">{feedback}</strong>. This item will now be categorized correctly in future scans.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI DIY Tutorial Overlay Modal */}
      <AnimatePresence>
        {(activeTutorial || generatingTutorialIndex !== null || tutorialError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col transition-all duration-300">
              {/* Header */}
              <div className="p-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-orange-400/10 rounded-lg border border-orange-400/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">AI Recipe & Visual Guide</span>
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider line-clamp-1">
                      {activeTutorial?.title || "Generating Tutorial..."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTutorial(null);
                    setGeneratingTutorialIndex(null);
                    setTutorialError(null);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-5 no-scrollbar flex-1">
                {generatingTutorialIndex !== null ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-orange-300 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest animate-pulse">Generating Recipe & Rendering AI Visual</p>
                      <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider max-w-[240px] mx-auto leading-relaxed">
                        Analyzing materials, generating exact item preview & structuring crafting steps...
                      </p>
                    </div>
                  </div>
                ) : tutorialError ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-rose-400 font-black uppercase tracking-widest">{tutorialError}</p>
                    <button
                      onClick={() => {
                        setActiveTutorial(null);
                        setGeneratingTutorialIndex(null);
                        setTutorialError(null);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : activeTutorial ? (
                  <div className="space-y-5">
                    {/* AI Generated Exact Item Visual */}
                    {activeTutorial.imageUrl && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-orange-500/30 bg-slate-950 shadow-xl group">
                        <img
                          src={activeTutorial.imageUrl}
                          alt={activeTutorial.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-orange-400 text-slate-950 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Visual Render
                          </span>
                          <span className="text-[8px] font-bold text-white/80 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                            Exact Item Preview
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Meta info badge row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-wider">Duration</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white">{activeTutorial.estimatedTime}</p>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-orange-400" />
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-wider">Difficulty</p>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white">{activeTutorial.difficulty}</p>
                        </div>
                      </div>
                    </div>

                    {/* Materials section */}
                    <div className="space-y-2 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        Required Materials & Tools
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {activeTutorial.materialsNeeded.map((mat, i) => (
                            <li key={i} className="text-[10px] text-slate-800 dark:text-white/80 font-bold flex items-start gap-1.5">
                            <span className="text-orange-400 mt-0.5">•</span>
                            {mat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step by step */}
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Step-by-Step Instructions</h4>
                      <div className="space-y-3">
                        {activeTutorial.steps.map((step, i) => (
                          <div key={i} className="flex gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl hover:border-white/10 transition-all">
                            <div className="w-5 h-5 rounded-lg bg-orange-400/10 border border-orange-400/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-[10px] text-slate-800 dark:text-white/80 font-bold leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expert Tips */}
                    {activeTutorial.tips && activeTutorial.tips.length > 0 && (
                      <div className="space-y-2 bg-orange-400/5 border border-orange-400/15 rounded-2xl p-4">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" />
                          Expert Upcycling Tips
                        </h4>
                        <ul className="space-y-1.5 pt-1">
                          {activeTutorial.tips.map((tip, i) => (
                            <li key={i} className="text-[10px] text-slate-800 dark:text-white/70 font-medium leading-relaxed flex items-start gap-2">
                              <span className="text-orange-400 shrink-0 mt-0.5">★</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              {activeTutorial && (
                <div className="p-4 border-t border-white/5 bg-slate-900/80 flex justify-end">
                  <button
                    onClick={() => {
                      setActiveTutorial(null);
                      setGeneratingTutorialIndex(null);
                      setTutorialError(null);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Close Guide
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
