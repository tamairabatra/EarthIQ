import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, MapPin, Search, Navigation, Info, HelpCircle, 
  Sparkles, CheckCircle2, ChevronRight, Star, AlertTriangle, Play,
  Globe, Eye, Map as MapIcon, Phone, ShieldAlert, ZoomIn, ZoomOut,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Share2, ExternalLink
} from 'lucide-react';
import { GroundingLink, TrashCategory } from '../types';
import { sounds } from '../utils/sound-effects';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && 
  typeof API_KEY === 'string' &&
  API_KEY.trim().startsWith('AIzaSy') && 
  API_KEY.trim().length >= 35;

interface RealWorldMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  itemLabel: string;
  category: TrashCategory;
  groundingLinks: GroundingLink[];
  onClose?: () => void;
}

interface FantasyLandmark {
  id: string;
  name: string;
  description: string;
  guardian: string;
  tip: string;
  emoji: string;
  color: string;
  borderColor: string;
  coords: { x: number; y: number };
  category: TrashCategory;
  keywords: string[];
  soundAction?: string;
}

interface MapFacility {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  rating?: number;
}

const fantasyLandmarks: FantasyLandmark[] = [
  {
    id: 'cardboard-castle',
    name: "Cardboard Castle",
    guardian: "Sir Recycles-A-Lot (The Paper Knight)",
    description: "A majestic fortress constructed entirely of clean boxes, mail tubes, and paper folds. Sir Recycles-A-Lot fights grease and moisture to keep all fiber sheets safe!",
    tip: "Keep paper completely dry! Heavily greasy pizza boxes can't enter the castle gates.",
    emoji: "🏰",
    color: "from-amber-400 to-amber-600",
    borderColor: "border-amber-400 shadow-amber-500/20",
    coords: { x: 25, y: 24 },
    category: TrashCategory.RECYCLE,
    keywords: ["paper", "cardboard", "box", "mail", "envelope", "cup", "book", "bag"]
  },
  {
    id: 'plastic-lagoon',
    name: "Plastic Lagoon",
    guardian: "Bubbles (The Friendly Sea Monster)",
    description: "A glowing blue crystal lagoon where Bubbles vacuums milk jugs, soda flasks, and clean plastic containers, melting them into cool eco-shields!",
    tip: "Always check the tiny polymer code (1-7) on the bottom, and rinse well before sending to Bubbles!",
    emoji: "🐙",
    color: "from-sky-400 to-sky-600",
    borderColor: "border-sky-400 shadow-sky-500/20",
    coords: { x: 78, y: 30 },
    category: TrashCategory.RECYCLE,
    keywords: ["plastic", "bottle", "jug", "cup", "tub", "container", "shampoo", "cap"]
  },
  {
    id: 'metal-mountain',
    name: "Metal Mountain",
    guardian: "Rusty (The Magnetic Dwarf)",
    description: "A giant magnetic peak of sparkling ore where Rusty pulls out soda cans, food tins, and clean aluminum foils, forging them back to utility!",
    tip: "Metal can be melted and remolded infinite times without losing its circular power!",
    emoji: "⛰️",
    color: "from-slate-400 to-slate-600",
    borderColor: "border-slate-400 shadow-slate-500/20",
    coords: { x: 50, y: 14 },
    category: TrashCategory.RECYCLE,
    keywords: ["metal", "can", "aluminum", "foil", "soda", "tin", "steel", "iron"]
  },
  {
    id: 'glass-glacier',
    name: "Glass Glacier",
    guardian: "Glinda (The Crystal Fairy)",
    description: "A shimmering prism-like glacier where Glinda gathers glass jars, flasks, and bottles, refracting sunshine into endless recycling magic!",
    tip: "Remove metal caps and corks first so Glinda's glacier stays crystalline and transparent!",
    emoji: "❄️",
    color: "from-teal-400 to-teal-600",
    borderColor: "border-teal-400 shadow-teal-500/20",
    coords: { x: 18, y: 55 },
    category: TrashCategory.RECYCLE,
    keywords: ["glass", "bottle", "jar", "glassware", "cup"]
  },
  {
    id: 'compost-kingdom',
    name: "Compost Kingdom",
    guardian: "Wiggle (The Worm King)",
    description: "A dense, oxygen-rich enchanted forest where Wiggle and millions of subterranean critters digest banana peels, leaves, and organic food scraps into dark gold potion!",
    tip: "Keep non-compostable plastic wrappers and fruit stickers far away to avoid giving Wiggle a tummy ache!",
    emoji: "🌳",
    color: "from-emerald-400 to-emerald-600",
    borderColor: "border-emerald-500 shadow-emerald-500/20",
    coords: { x: 76, y: 68 },
    category: TrashCategory.ORGANIC,
    keywords: ["food", "banana", "compost", "apple", "peel", "leftovers", "scrap", "organic", "plant", "tea", "coffee"]
  },
  {
    id: 'battery-beach',
    name: "Battery Beach",
    guardian: "Sparky (The Electric Fox)",
    description: "A high-voltage cyber beach where Sparky absorbs lithium batteries, outdated screens, and copper circuitry, locking away heavy elements so they never poison the clean ocean!",
    tip: "E-waste has hidden toxic metals! Never throw batteries in standard bins; bring them directly to Sparky!",
    emoji: "⚡",
    color: "from-yellow-400 to-yellow-600",
    borderColor: "border-yellow-400 shadow-yellow-500/20",
    coords: { x: 26, y: 82 },
    category: TrashCategory.HAZARDOUS,
    keywords: ["battery", "charger", "phone", "electronics", "hazardous", "lightbulb", "cable", "e-waste", "computer"]
  },
  {
    id: 'landfill-abyss',
    name: "Landfill Abyss",
    guardian: "Garby (The Grumpy Trash Troll)",
    description: "A dark volcanic smog canyon where standard garbage sits trapped under rocks for thousands of years without air. Garby gets larger and grumpier with every item sent here!",
    tip: "Strive to reduce waste and find alternative recycling pathways so we can slowly shrink Garby's smelly domain!",
    emoji: "🌋",
    color: "from-rose-500 to-rose-700",
    borderColor: "border-rose-500 shadow-rose-500/20",
    coords: { x: 50, y: 48 },
    category: TrashCategory.TRASH,
    keywords: ["trash", "styrofoam", "diaper", "wrapper", "chip bag", "landfill", "garbage", "waste", "film", "bag", "grease"]
  }
];

const getCategorySearchQuery = (category: TrashCategory, label: string) => {
  const cleanLabel = (label || "").trim().toLowerCase();
  
  if (category === TrashCategory.RECYCLE) {
    if (cleanLabel.includes("paper") || cleanLabel.includes("cardboard") || cleanLabel.includes("box")) {
      return "paper recycling drop off center";
    }
    if (cleanLabel.includes("glass")) {
      return "glass recycling facility";
    }
    if (cleanLabel.includes("metal") || cleanLabel.includes("can") || cleanLabel.includes("aluminum")) {
      return "scrap metal recycling center";
    }
    return "recycling center";
  }
  
  if (category === TrashCategory.ORGANIC) {
    return "compost drop off food waste compost facility";
  }
  
  if (category === TrashCategory.HAZARDOUS) {
    return "hazardous waste disposal facility";
  }
  
  if (category === TrashCategory.ELECTRONIC) {
    return "electronics recycling drop off";
  }
  
  if (category === TrashCategory.TEXTILE) {
    return "textile recycling drop off dropoff clothing collection bin";
  }

  if (category === TrashCategory.REPAIR) {
    return "repair shop appliance repair clothing repair upcycling cafe";
  }
  
  return "recycling transfer station municipal waste";
};

// REAL-WORLD LIVE MAP VIEW
const RealMapView: React.FC<{
  userLocation: { latitude: number; longitude: number } | null;
  facilities: MapFacility[];
  selectedId: string | null;
  onSelectFacility: (id: string | null) => void;
  centerCoords: { lat: number; lng: number };
  category: TrashCategory;
}> = ({ userLocation, facilities, selectedId, onSelectFacility, centerCoords, category }) => {
  const map = useMap();

  useEffect(() => {
    if (map && centerCoords) {
      map.panTo(centerCoords);
    }
  }, [map, centerCoords]);

  const getMarkerColor = (cat: TrashCategory) => {
    switch (cat) {
      case TrashCategory.RECYCLE: return '#10b981';
      case TrashCategory.ORGANIC: return '#22c55e';
      case TrashCategory.HAZARDOUS: return '#f59e0b';
      case TrashCategory.ELECTRONIC: return '#a855f7';
      case TrashCategory.TEXTILE: return '#3b82f6';
      case TrashCategory.REPAIR: return '#14b8a6';
      default: return '#64748b';
    }
  };

  const getMarkerEmoji = (cat: TrashCategory) => {
    switch (cat) {
      case TrashCategory.RECYCLE: return '♻️';
      case TrashCategory.ORGANIC: return '🌳';
      case TrashCategory.HAZARDOUS: return '⚡';
      case TrashCategory.ELECTRONIC: return '🔋';
      case TrashCategory.TEXTILE: return '👕';
      case TrashCategory.REPAIR: return '🔧';
      default: return '📍';
    }
  };

  const selectedFacility = facilities.find(f => f.id === selectedId);

  return (
    <div className="w-full h-full relative" style={{ height: '100%' }}>
      <Map
        defaultCenter={centerCoords}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {userLocation && (
          <AdvancedMarker position={{ lat: userLocation.latitude, lng: userLocation.longitude }}>
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-40 animate-ping" />
              <div className="relative w-5 h-5 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {facilities.map((fac) => {
          const isSelected = selectedId === fac.id;
          const markerColor = getMarkerColor(category);
          const emoji = getMarkerEmoji(category);

          return (
            <AdvancedMarker
              key={fac.id}
              position={fac.location}
              onClick={() => {
                onSelectFacility(fac.id);
              }}
              title={fac.displayName}
            >
              <Pin 
                background={markerColor} 
                borderColor="#ffffff" 
                glyphColor="#ffffff"
                scale={isSelected ? 1.3 : 1.0}
              >
                <span className="text-xs">{emoji}</span>
              </Pin>
            </AdvancedMarker>
          );
        })}

        {selectedFacility && (
          <InfoWindow
            position={selectedFacility.location}
            onCloseClick={() => onSelectFacility(null)}
            pixelOffset={[0, -10]}
          >
            <div className="p-2 max-w-xs text-slate-900">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-black tracking-tight text-slate-950 block">{selectedFacility.displayName}</span>
                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                  {category}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mb-2 leading-tight">{selectedFacility.formattedAddress}</p>
              
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                {selectedFacility.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-slate-700">{selectedFacility.rating} rating</span>
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.location.lat},${selectedFacility.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
};

// HIGH-FIDELITY SIMULATED GPS RADAR MAP VIEW (Fallback for no active API key)
const RealSimulatedMapView: React.FC<{
  userLocation: { latitude: number; longitude: number } | null;
  facilities: MapFacility[];
  selectedId: string | null;
  onSelectFacility: (id: string | null) => void;
  centerCoords: { lat: number; lng: number };
  onPan: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onZoom: (zoomIn: boolean) => void;
  zoom: number;
  category: TrashCategory;
}> = ({ userLocation, facilities, selectedId, onSelectFacility, centerCoords, onPan, onZoom, zoom, category }) => {
  const getMarkerColor = (cat: TrashCategory) => {
    switch (cat) {
      case TrashCategory.RECYCLE: return '#10b981';
      case TrashCategory.ORGANIC: return '#22c55e';
      case TrashCategory.HAZARDOUS: return '#f59e0b';
      case TrashCategory.ELECTRONIC: return '#a855f7';
      case TrashCategory.TEXTILE: return '#3b82f6';
      case TrashCategory.REPAIR: return '#14b8a6';
      default: return '#64748b';
    }
  };

  const getMarkerEmoji = (cat: TrashCategory) => {
    switch (cat) {
      case TrashCategory.RECYCLE: return '♻️';
      case TrashCategory.ORGANIC: return '🌳';
      case TrashCategory.HAZARDOUS: return '⚠️';
      case TrashCategory.ELECTRONIC: return '🔋';
      case TrashCategory.TEXTILE: return '👕';
      case TrashCategory.REPAIR: return '🔧';
      default: return '📍';
    }
  };

  const scaleMultiplier = Math.pow(1.8, zoom - 3); 
  const scaleX = 4000 * scaleMultiplier;
  const scaleY = 4000 * scaleMultiplier;

  const getPosition = (lat: number, lng: number) => {
    const latDiff = lat - centerCoords.lat;
    const lngDiff = lng - centerCoords.lng;
    const x = 50 + (lngDiff * scaleX);
    const y = 50 - (latDiff * scaleY);
    return { x, y };
  };

  const gridOffsetX = (centerCoords.lng * 20000 * scaleMultiplier) % 40;
  const gridOffsetY = (-centerCoords.lat * 20000 * scaleMultiplier) % 40;

  const selectedFacility = facilities.find(f => f.id === selectedId);
  const selectedPos = selectedFacility ? getPosition(selectedFacility.location.lat, selectedFacility.location.lng) : null;

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden select-none flex flex-col animate-in fade-in duration-300" style={{ height: '100%' }}>
      {/* Simulation Top Header Banner */}
      <div className="absolute top-3 left-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block leading-none">Simulated GPS Radar</span>
            <span className="text-[8px] text-slate-400 font-bold leading-tight block">Add `GOOGLE_MAPS_PLATFORM_KEY` in Secrets (⚙️) to load real live streets.</span>
          </div>
        </div>
      </div>

      {/* Main Radar Screen */}
      <div className="flex-1 relative overflow-hidden" style={{ height: '100%' }}>
        {/* Lattice Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-300"
          style={{ 
            backgroundImage: `radial-gradient(#10b981 1.5px, transparent 1.5px), linear-gradient(to right, rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.05) 1px, transparent 1px)`,
            backgroundSize: `40px 40px, 40px 40px, 40px 40px`,
            backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`
          }} 
        />

        {/* Sweep radar lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[180px] h-[180px] border border-emerald-500/10 rounded-full animate-[ping_4s_linear_infinite]" />
          <div className="absolute w-[1px] h-full bg-emerald-500/5" />
          <div className="absolute h-[1px] w-full bg-emerald-500/5" />
        </div>

        {/* Simulated User Position */}
        {userLocation && (() => {
          const pos = getPosition(userLocation.latitude, userLocation.longitude);
          if (pos.x >= -5 && pos.x <= 105 && pos.y >= -5 && pos.y <= 105) {
            return (
              <div 
                className="absolute transition-all duration-300"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: 15 }}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-8 h-8 rounded-full bg-sky-400 opacity-40 animate-ping" />
                  <div className="relative w-4.5 h-4.5 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Facilities Markers */}
        {facilities.map((fac) => {
          const pos = getPosition(fac.location.lat, fac.location.lng);
          const isSelected = selectedId === fac.id;
          const markerColor = getMarkerColor(category);
          const emoji = getMarkerEmoji(category);

          if (pos.x < -10 || pos.x > 110 || pos.y < -10 || pos.y > 110) return null;

          return (
            <button
              key={fac.id}
              onClick={() => {
                onSelectFacility(fac.id);
                sounds.playHoldSteady?.();
              }}
              className="absolute group transition-all duration-300 cursor-pointer focus:outline-none"
              style={{ 
                left: `${pos.x}%`, 
                top: `${pos.y}%`, 
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 30 : 10
              }}
            >
              <div className="relative flex flex-col items-center">
                <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-slate-950/95 border border-white/10 px-2 py-1 rounded-lg text-[9px] font-black text-white whitespace-nowrap shadow-xl transition-all pointer-events-none uppercase tracking-wider">
                  {fac.displayName}
                </div>

                <div 
                  className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-300 ${
                    isSelected ? 'scale-125 ring-4 ring-emerald-500/40' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: markerColor }}
                >
                  <span className="text-xs">{emoji}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-white rotate-45 -mt-1 shadow-md" />
              </div>
            </button>
          );
        })}

        {/* Selected Facility InfoWindow */}
        {selectedFacility && selectedPos && (
          <div 
            className="absolute z-40 transition-all duration-300 max-w-xs w-60 bg-slate-900 border border-white/20 rounded-2xl p-3.5 shadow-2xl"
            style={{ 
              left: `${selectedPos.x}%`, 
              top: `${selectedPos.y - 8}%`, 
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-900 filter drop-shadow-md" />

            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs font-black tracking-tight text-white block leading-tight">{selectedFacility.displayName}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFacility(null);
                }}
                className="text-white/40 hover:text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
              >
                ×
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mb-2 leading-snug">{selectedFacility.formattedAddress}</p>
            
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
              {selectedFacility.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-slate-300">{selectedFacility.rating} rating</span>
                </div>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.location.lat},${selectedFacility.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-1.5 rounded-xl text-center text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Navigation className="w-3 h-3" /> Get Directions
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-3 right-3 z-25 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl">
        <div className="flex gap-1 border-b border-white/10 pb-1.5">
          <button 
            onClick={() => onZoom(true)}
            className="w-7.5 h-7.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all animate-pulse"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onZoom(false)}
            className="w-7.5 h-7.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <div />
          <button 
            onClick={() => onPan('up')}
            className="w-7.5 h-7.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <div />

          <button 
            onClick={() => onPan('left')}
            className="w-7.5 h-7.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <div className="w-7.5 h-7.5 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          </div>
          <button 
            onClick={() => onPan('right')}
            className="w-7.5 h-7.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowRight className="w-3 h-3" />
          </button>

          <div />
          <button 
            onClick={() => onPan('down')}
            className="w-7.5 h-7.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};

export const RealWorldMap: React.FC<RealWorldMapProps> = ({
  userLocation,
  itemLabel,
  category,
  groundingLinks,
  onClose
}) => {
  const [mapTab, setMapTab] = useState<'real' | 'fantasy'>('real');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLandmark, setSelectedLandmark] = useState<FantasyLandmark | null>(null);
  const [committedXP, setCommittedXP] = useState<string[]>([]);
  const [earnedAnimation, setEarnedAnimation] = useState(false);
  const [recommendedLandmark, setRecommendedLandmark] = useState<FantasyLandmark | null>(null);

  // Real world facility states
  const [facilities, setFacilities] = useState<MapFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [isSearchingFacilities, setIsSearchingFacilities] = useState(false);
  const [realMapCenter, setRealMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [realZoomLevel, setRealZoomLevel] = useState(3);

  // Fallback facilities generator
  const getFallbackFacilities = useCallback((lat: number, lng: number, cat: TrashCategory): MapFacility[] => {
    const namesMap: Record<string, string[]> = {
      [TrashCategory.RECYCLE]: [
        "Community Recycling Depot",
        "Apex Materials Recovery Station",
        "Valley Re-Use Center",
        "GreenWay Fiber & Cardboard Station",
        "Pioneer Bottle Redemption Hub"
      ],
      [TrashCategory.ORGANIC]: [
        "Evergreen Organic Composting",
        "Central Soil & Food Waste Depot",
        "Municipal Yard Scrap Station",
        "WormWorks Compost Drop-off",
        "Green Valley Organic Loop"
      ],
      [TrashCategory.HAZARDOUS]: [
        "County SafeDisposal Toxics Center",
        "Hazardous Waste Collection Site",
        "Mercury, Lead & Battery Reclamation",
        "Shield Chemical disposal",
        "EcoGuard Household Hazardous Depot"
      ],
      [TrashCategory.ELECTRONIC]: [
        "CyberShred Secure E-Waste Hub",
        "Sparky's Household Electronics Depot",
        "Hardware Reclamation Station",
        "Municipal Computer Recyclers",
        "Apex Battery Reclamation"
      ],
      [TrashCategory.TEXTILE]: [
        "Wardrobe Renewal Clothing Box",
        "Goodwill Donation Drop Box",
        "ThreadUp Fabric Recycle",
        "Second Life Apparel Distribution",
        "EcoWear Salvage Collective"
      ],
      [TrashCategory.REPAIR]: [
        "Eco-Fix Repair Cafe",
        "Community Appliance Repair",
        "Sew & Sow Clothing Tailor & Upcycle",
        "The Electronic Mend Workshop",
        "Neighborhood Tool Library & Fixer Hub"
      ],
      [TrashCategory.TRASH]: [
        "District Solid Waste Transfer",
        "City Landfill & Garbage Depot",
        "Municipal Waste Processing Yard",
        "Refuse Reclamation Facility",
        "Transfer Station & Rubbish Collection"
      ]
    };

    const currentNames = namesMap[cat] || namesMap[TrashCategory.RECYCLE];
    return currentNames.map((name, i) => {
      const angle = (i * 2 * Math.PI) / currentNames.length;
      const radius = 0.012 + (Math.random() * 0.008); 
      const dLat = radius * Math.cos(angle);
      const dLng = radius * Math.sin(angle);

      return {
        id: `sim-facility-${cat}-${i}`,
        displayName: name,
        formattedAddress: `${150 + i * 40} Green Street, Eco District`,
        location: { lat: lat + dLat, lng: lng + dLng },
        rating: +(4.1 + (i * 0.2) % 0.9).toFixed(1)
      };
    });
  }, []);

  // Sync center location
  useEffect(() => {
    if (userLocation) {
      setRealMapCenter(prev => {
        if (Math.abs(prev.lat - userLocation.latitude) < 0.0001 && Math.abs(prev.lng - userLocation.longitude) < 0.0001) {
          return prev;
        }
        return { lat: userLocation.latitude, lng: userLocation.longitude };
      });
    }
  }, [userLocation]);

  // Load Maps places library
  const placesLib = useMapsLibrary('places');

  const performRealSearch = useCallback((cat: TrashCategory) => {
    const lat = userLocation?.latitude || 37.7749;
    const lng = userLocation?.longitude || -122.4194;
    const queryStr = getCategorySearchQuery(cat, itemLabel);

    if (!hasValidKey) {
      setFacilities(getFallbackFacilities(lat, lng, cat));
      setRealMapCenter({ lat, lng });
      return;
    }

    if (!placesLib) {
      setFacilities(getFallbackFacilities(lat, lng, cat));
      return;
    }

    setIsSearchingFacilities(true);
    placesLib.Place.searchByText({
      textQuery: queryStr,
      fields: ['displayName', 'location', 'formattedAddress', 'rating'],
      locationRestriction: {
        center: { lat, lng },
        radius: 12000, 
      },
      maxResultCount: 8
    })
    .then(({ places }) => {
      if (places && places.length > 0) {
        const formatted = places.map((p, idx) => ({
          id: p.id || `live-facility-${idx}`,
          displayName: p.displayName || "Waste Facility",
          formattedAddress: p.formattedAddress || "Nearby Location",
          location: {
            lat: p.location?.lat() || lat,
            lng: p.location?.lng() || lng
          },
          rating: p.rating || undefined
        }));
        setFacilities(formatted);
        if (formatted[0]) {
          setRealMapCenter(formatted[0].location);
        }
      } else {
        setFacilities(getFallbackFacilities(lat, lng, cat));
      }
    })
    .catch((err) => {
      console.error("Live places search failure:", err);
      setFacilities(getFallbackFacilities(lat, lng, cat));
    })
    .finally(() => {
      setIsSearchingFacilities(false);
    });
  }, [placesLib, userLocation, itemLabel, getFallbackFacilities]);

  // Initial loads
  useEffect(() => {
    performRealSearch(category);
  }, [performRealSearch, category]);

  // Determine recommended fantasy landmark based on current item and category
  useEffect(() => {
    let bestMatch: FantasyLandmark | null = null;
    const lowerLabel = (itemLabel || "").toLowerCase();

    if (lowerLabel) {
      bestMatch = fantasyLandmarks.find(lm => 
        lm.keywords.some(kw => lowerLabel.includes(kw))
      ) || null;
    }

    if (!bestMatch) {
      if (category === TrashCategory.ORGANIC) {
        bestMatch = fantasyLandmarks.find(lm => lm.id === 'compost-kingdom') || null;
      } else if (category === TrashCategory.HAZARDOUS) {
        bestMatch = fantasyLandmarks.find(lm => lm.id === 'battery-beach') || null;
      } else if (category === TrashCategory.TRASH) {
        bestMatch = fantasyLandmarks.find(lm => lm.id === 'landfill-abyss') || null;
      } else if (category === TrashCategory.RECYCLE) {
        if (lowerLabel.includes("box") || lowerLabel.includes("paper") || lowerLabel.includes("cardboard")) {
          bestMatch = fantasyLandmarks.find(lm => lm.id === 'cardboard-castle') || null;
        } else if (lowerLabel.includes("can") || lowerLabel.includes("metal") || lowerLabel.includes("foil") || lowerLabel.includes("aluminum")) {
          bestMatch = fantasyLandmarks.find(lm => lm.id === 'metal-mountain') || null;
        } else if (lowerLabel.includes("glass") || lowerLabel.includes("jar")) {
          bestMatch = fantasyLandmarks.find(lm => lm.id === 'glass-glacier') || null;
        } else {
          bestMatch = fantasyLandmarks.find(lm => lm.id === 'plastic-lagoon') || null;
        }
      }
    }

    setRecommendedLandmark(bestMatch);
    if (bestMatch) {
      setSelectedLandmark(bestMatch);
    }
  }, [itemLabel, category]);

  // Handle Search input (Enchanted Map)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    sounds.playHoldSteady?.();
    const lowerQuery = searchQuery.toLowerCase();
    
    const match = fantasyLandmarks.find(lm => 
      lm.name.toLowerCase().includes(lowerQuery) || 
      lm.keywords.some(kw => lowerQuery.includes(kw)) ||
      lm.guardian.toLowerCase().includes(lowerQuery)
    );

    if (match) {
      setSelectedLandmark(match);
      setRecommendedLandmark(match);
      sounds.playSuccess?.();
    } else {
      const landfill = fantasyLandmarks.find(lm => lm.id === 'landfill-abyss') || null;
      setSelectedLandmark(landfill);
      sounds.playError?.();
    }
  };

  const handleCommitProtect = (landmarkId: string) => {
    if (committedXP.includes(landmarkId)) return;
    sounds.playSuccess?.();
    setCommittedXP(prev => [...prev, landmarkId]);
    setEarnedAnimation(true);
    setTimeout(() => setEarnedAnimation(false), 2000);
  };

  const handleFacilitySelect = (id: string | null) => {
    setSelectedFacilityId(id);
    if (id) {
      const f = facilities.find(fac => fac.id === id);
      if (f) {
        setRealMapCenter(f.location);
      }
    }
  };

  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 0.005 * Math.pow(1.8, 3 - realZoomLevel);
    setRealMapCenter(prev => {
      switch (direction) {
        case 'up': return { ...prev, lat: prev.lat + step };
        case 'down': return { ...prev, lat: prev.lat - step };
        case 'left': return { ...prev, lng: prev.lng - step };
        case 'right': return { ...prev, lng: prev.lng + step };
        default: return prev;
      }
    });
  };

  const handleZoom = (zoomIn: boolean) => {
    setRealZoomLevel(prev => {
      if (zoomIn) return Math.min(5, prev + 1);
      return Math.max(1, prev - 1);
    });
  };

  const realLayout = (
    <div className="flex flex-col md:flex-row gap-4 h-full w-full min-h-[300px]">
      
      {/* Search Grounding list + Local found centers list */}
      <div className="w-full md:w-[220px] shrink-0 flex flex-col gap-3 bg-slate-950/40 p-2.5 rounded-2xl border border-white/5 overflow-y-auto no-scrollbar max-h-[140px] md:max-h-none md:h-full">
        
        {/* Search Grounding links */}
        {groundingLinks.length > 0 && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Search Grounding Sources:</span>
            {groundingLinks.slice(0, 3).map((link, i) => (
              <a
                key={i}
                href={link.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-[9px] font-bold text-sky-400 flex items-center justify-between gap-1 transition-all active:scale-95"
              >
                <span className="truncate max-w-[150px]">{link.title}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
            Nearby {category} Hubs:
          </span>
          {facilities.length === 0 ? (
            <div className="text-[9px] font-bold text-slate-500 py-4 text-center">
              Scanning local depots...
            </div>
          ) : (
            facilities.map((fac) => {
              const isSelected = selectedFacilityId === fac.id;
              return (
                <button
                  key={fac.id}
                  onClick={() => handleFacilitySelect(fac.id)}
                  className={`text-left p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5 w-full ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[10px] font-bold text-white truncate max-w-[140px]">{fac.displayName}</span>
                    {fac.rating && (
                      <span className="text-[8px] font-bold text-amber-400 shrink-0">⭐ {fac.rating}</span>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-400 truncate max-w-[180px]">{fac.formattedAddress}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Map Window */}
      <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-white/5 relative min-h-[180px] h-full">
        {hasValidKey ? (
          <RealMapView
            userLocation={userLocation}
            facilities={facilities}
            selectedId={selectedFacilityId}
            onSelectFacility={handleFacilitySelect}
            centerCoords={realMapCenter}
            category={category}
          />
        ) : (
          <RealSimulatedMapView
            userLocation={userLocation}
            facilities={facilities}
            selectedId={selectedFacilityId}
            onSelectFacility={handleFacilitySelect}
            centerCoords={realMapCenter}
            onPan={handlePan}
            onZoom={handleZoom}
            zoom={realZoomLevel}
            category={category}
          />
        )}
      </div>
    </div>
  );

  const fantasyLayout = (
    <div className="flex-1 relative bg-slate-950 overflow-hidden h-full rounded-2xl border border-white/5 select-none animate-in fade-in duration-300 min-h-[220px]">
      
      {/* Floating Cartoon Search */}
      <form 
        onSubmit={handleSearch}
        className="absolute top-3 left-3 right-3 z-20 flex gap-2"
      >
        <div className="flex-1 relative">
          <input 
            type="text"
            placeholder="Search enchanted territories e.g. glass, plastic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl text-[10px] text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400 font-bold shadow-lg"
          />
          <Search className="absolute left-2.5 top-2 w-3 h-3 text-white/40" />
        </div>
        <button 
          type="submit"
          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 shrink-0"
        >
          Explore
        </button>
      </form>

      {/* Success XP Animation Banner */}
      <AnimatePresence>
        {earnedAnimation && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-14 inset-x-3 z-30 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-center shadow-lg border border-emerald-300/30 flex items-center justify-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5 fill-slate-950 animate-bounce" />
            Landmark Guarded! +50 XP!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Beautiful Fantasy Cartoon Board Arena */}
      <div className="absolute inset-0 w-full h-full" style={{ height: '100%' }}>
        
        {/* Soft realistic geographic lattice grid system */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        
        {/* Realistic Contour Elevation Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none">
          <circle cx="50%" cy="14%" r="30" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="50%" cy="14%" r="50" fill="none" stroke="#059669" strokeWidth="0.75" />
          <ellipse cx="76%" cy="68%" rx="40" ry="25" fill="none" stroke="#10b981" strokeWidth="0.75" />
          <circle cx="50%" cy="48%" r="35" fill="none" stroke="#f43f5e" strokeWidth="1" className="opacity-30 animate-pulse" />
          <ellipse cx="78%" cy="30%" rx="45" ry="30" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />
          <text x="5%" y="95%" fill="#10b981" className="font-mono text-[6px] font-bold opacity-60">37.4200° N</text>
          <text x="85%" y="95%" fill="#10b981" className="font-mono text-[6px] font-bold opacity-60">122.0841° W</text>
        </svg>

        {/* Radar Scanning Line sweep */}
        <div className="absolute inset-x-0 h-[2px] bg-emerald-500/20 blur-xs animate-[scanLine_8s_linear_infinite] pointer-events-none" />

        {/* Floating Landmarks */}
        {fantasyLandmarks.map((lm) => {
          const isSelected = selectedLandmark?.id === lm.id;
          const isRecommended = recommendedLandmark?.id === lm.id;

          return (
            <div
              key={lm.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${lm.coords.x}%`, top: `${lm.coords.y}%` }}
            >
              <div 
                onClick={() => {
                  setSelectedLandmark(lm);
                  sounds.playHoldSteady?.();
                }}
                className="relative group cursor-pointer flex flex-col items-center"
              >
                {isRecommended && (
                  <div className="absolute -inset-3 rounded-full bg-emerald-500/10 border border-emerald-400/30 animate-ping duration-1000 pointer-events-none" />
                )}
                {isSelected && (
                  <div className="absolute -inset-4 rounded-full bg-amber-500/10 border-2 border-amber-400/30 animate-pulse pointer-events-none" />
                )}

                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 rounded-xl bg-gradient-to-b ${lm.color} border-2 ${lm.borderColor} shadow-lg flex items-center justify-center text-md relative transition-all`}
                >
                  <span className="drop-shadow-md select-none">{lm.emoji}</span>
                  {isRecommended && (
                    <div className="absolute -top-3.5 px-1 py-0.5 bg-emerald-500 border border-emerald-300 rounded-full text-[5px] font-black text-slate-950 uppercase tracking-widest shadow-md">
                      RECOM
                    </div>
                  )}
                </motion.div>

                <div className={`mt-1 px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-tight text-center shadow-md ${
                  isSelected 
                    ? 'bg-amber-400 border-amber-300 text-slate-950 font-extrabold' 
                    : isRecommended
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/80 border-white/5 text-white/70'
                }`}>
                  {lm.name}
                </div>
              </div>
            </div>
          );
        })}

        {/* Immersive Info Card Popup */}
        <AnimatePresence>
          {selectedLandmark && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="absolute bottom-2 inset-x-2 z-40 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 max-h-[115px] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-1.5">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${selectedLandmark.color} flex items-center justify-center text-sm shadow-inner shrink-0`}>
                    {selectedLandmark.emoji}
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-1 leading-none">
                      {selectedLandmark.name}
                      {recommendedLandmark?.id === selectedLandmark.id && (
                        <span className="text-[6px] font-black bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded uppercase border border-emerald-500/10">Match</span>
                      )}
                    </h5>
                    <p className="text-[7px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Guardian: {selectedLandmark.guardian}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLandmark(null)}
                  className="text-white/40 hover:text-white font-black text-[10px] px-1.5 py-0.5 hover:bg-white/5 rounded"
                >
                  ✕
                </button>
              </div>

              <p className="text-[9px] font-semibold text-slate-300 leading-snug">
                {selectedLandmark.description}
              </p>

              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-white/5">
                <div className="flex items-start gap-1 bg-amber-400/5 p-1 rounded-lg border border-amber-400/10">
                  <HelpCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[8px] font-bold text-amber-300/90 leading-tight">
                    <span className="text-white">Tip: </span>{selectedLandmark.tip}
                  </p>
                </div>

                <div className="flex gap-2 justify-between items-center">
                  <button
                    disabled={committedXP.includes(selectedLandmark.id)}
                    onClick={() => handleCommitProtect(selectedLandmark.id)}
                    className={`ml-auto px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-wider transition-all flex items-center gap-1 ${
                      committedXP.includes(selectedLandmark.id)
                        ? 'bg-white/10 text-white/40 border border-white/5'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                    }`}
                  >
                    {committedXP.includes(selectedLandmark.id) ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Guarded
                      </>
                    ) : (
                      <>
                        <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950 animate-spin" /> Guard (+50 XP)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-full min-h-[380px] relative select-none">
      
      {/* Title Header with tabs */}
      <div className="p-3.5 bg-slate-950 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin duration-1000" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">EcoLand Interactive Scanner</h4>
            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-tight flex items-center gap-1">
              <Sparkles className="w-2 h-2" /> Live Geolocation & Guides
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 self-stretch md:self-auto">
          <button
            onClick={() => {
              setMapTab('real');
              sounds.playHoldSteady?.();
            }}
            className={`flex-1 md:flex-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
              mapTab === 'real'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" /> Real Map
          </button>
          <button
            onClick={() => {
              setMapTab('fantasy');
              sounds.playHoldSteady?.();
            }}
            className={`flex-1 md:flex-none px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
              mapTab === 'fantasy'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3 h-3" /> Enchanted
          </button>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="hidden md:block p-1 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white font-bold text-[10px]"
          >
            Close
          </button>
        )}
      </div>

      {/* Main Tab Screen Area */}
      <div className="flex-1 p-3.5 min-h-[220px]">
        {mapTab === 'real' ? (
          hasValidKey ? (
            <APIProvider apiKey={API_KEY} version="weekly">
              {realLayout}
            </APIProvider>
          ) : (
            realLayout
          )
        ) : (
          fantasyLayout
        )}
      </div>

      {/* Info strip footer */}
      <div className="px-3 py-2 bg-slate-950 border-t border-white/10 text-center shrink-0">
        <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest flex items-center justify-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          {mapTab === 'real' 
            ? "Connect your real map using Google Maps platform secrets" 
            : "Protect the enchanted realms of EcoLand to safeguard the future!"}
        </p>
      </div>

    </div>
  );
};
