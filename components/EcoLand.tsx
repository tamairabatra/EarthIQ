import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Lock, HelpCircle, CheckCircle2, AlertCircle, X, 
  ChevronRight, Sparkles, Compass, Lightbulb, GraduationCap, Map, Volume2, Target 
} from 'lucide-react';
import { sounds } from '../utils/sound-effects';

interface EcoLandProps {
  points: number;
  level: number;
  onClose: () => void;
  onGainPoints: (pts: number) => void;
}

interface TriviaQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

interface LandLevel {
  num: number;
  name: string;
  regionName: string;
  themeColor: string;
  accentColor: string;
  reqPoints: number;
  trivia: TriviaQuestion;
  coords: { x: number; y: number }; // Percentage coords for mapping
}

const levelsData: LandLevel[] = [
  {
    num: 1,
    name: "Sprouts Meadow",
    regionName: "Green Meadows",
    themeColor: "from-emerald-400 to-green-600",
    accentColor: "bg-emerald-400 border-emerald-500",
    reqPoints: 0,
    coords: { x: 80, y: 6 },
    trivia: {
      question: "Which of these materials takes the longest to decompose in a standard landfill?",
      options: [
        "A standard glass bottle",
        "A plastic disposable cup",
        "An aluminum soft drink can"
      ],
      correctIdx: 0,
      explanation: "Glass is incredibly durable and takes up to 1 million years to break down in landfills! Recycling glass cullet is crucial because it never degrades in quality."
    }
  },
  {
    num: 2,
    name: "Bottle Bay",
    regionName: "Green Meadows",
    themeColor: "from-teal-400 to-emerald-600",
    accentColor: "bg-teal-400 border-teal-500",
    reqPoints: 1000,
    coords: { x: 45, y: 16 },
    trivia: {
      question: "What do the recycling numbers (1 through 7) inside the triangle on plastic containers mean?",
      options: [
        "How many times it has been recycled",
        "The resin type of the plastic polymer",
        "The maximum temperature the plastic can handle"
      ],
      correctIdx: 1,
      explanation: "The number represents the Resin Identification Code (RIC), which defines the specific plastic polymer used (e.g., 1 is PET, 2 is HDPE). This dictates how it must be sorted and recycled."
    }
  },
  {
    num: 3,
    name: "Cardboard Canyon",
    regionName: "Recycle Ridge",
    themeColor: "from-amber-400 to-yellow-600",
    accentColor: "bg-amber-400 border-amber-500",
    reqPoints: 2000,
    coords: { x: 20, y: 27 },
    trivia: {
      question: "Why should you never throw a heavily greasy pizza box into the paper recycling bin?",
      options: [
        "Grease can ruin the batch of new recycled paper",
        "It attracts pests to the sorting facilities",
        "Greasy cardboard smells bad when stored"
      ],
      correctIdx: 0,
      explanation: "Oil and grease cannot be separated from paper pulp during recycling, causing the new paper to have oil spots and weak points. Compost greasy boxes instead!"
    }
  },
  {
    num: 4,
    name: "Metal Mines",
    regionName: "Recycle Ridge",
    themeColor: "from-orange-400 to-red-600",
    accentColor: "bg-orange-400 border-orange-500",
    reqPoints: 3000,
    coords: { x: 60, y: 38 },
    trivia: {
      question: "Recycling just one aluminum can saves enough energy to power a TV for about how long?",
      options: [
        "About 10 minutes",
        "Around 3 hours",
        "More than 24 hours"
      ],
      correctIdx: 1,
      explanation: "Recycling aluminum is highly efficient, saving 95% of the energy needed to refine bauxite ore. That energy difference can run a TV for 3 full hours!"
    }
  },
  {
    num: 5,
    name: "Compost Valley",
    regionName: "Valley of Composting",
    themeColor: "from-green-500 to-emerald-700",
    accentColor: "bg-green-500 border-green-600",
    reqPoints: 4000,
    coords: { x: 30, y: 49 },
    trivia: {
      question: "What powerful greenhouse gas is released when food scraps decompose in oxygen-poor landfills?",
      options: [
        "Carbon dioxide",
        "Methane",
        "Nitrous oxide"
      ],
      correctIdx: 1,
      explanation: "When organic waste is buried in landfills without oxygen, anaerobic bacteria produce methane, which is 28-36 times more potent than CO2 at trapping heat in the atmosphere."
    }
  },
  {
    num: 6,
    name: "Battery Beach",
    regionName: "Valley of Composting",
    themeColor: "from-cyan-400 to-blue-600",
    accentColor: "bg-cyan-400 border-cyan-500",
    reqPoints: 5000,
    coords: { x: 75, y: 60 },
    trivia: {
      question: "Why are heavy metals like lead and cadmium inside e-waste and batteries so dangerous?",
      options: [
        "They can leach out and contaminate soil and clean groundwater",
        "They make local garbage cans rust faster",
        "They degrade the tires of sanitation trucks"
      ],
      correctIdx: 0,
      explanation: "Batteries thrown in normal trash break down and release toxic chemicals that poison soils and water supplies. Always drop them at designated hazardous centers."
    }
  },
  {
    num: 7,
    name: "Textile Tundra",
    regionName: "Circular Oasis",
    themeColor: "from-blue-400 to-indigo-600",
    accentColor: "bg-blue-400 border-blue-500",
    reqPoints: 6000,
    coords: { x: 25, y: 71 },
    trivia: {
      question: "To produce a single new cotton t-shirt, roughly how much water is used during growing and manufacture?",
      options: [
        "Around 100 liters",
        "Approximately 500 liters",
        "Roughly 2,700 liters"
      ],
      correctIdx: 2,
      explanation: "Fashion has a high water footprint. Growing cotton and coloring the yarn uses massive amounts of water—nearly 2,700 liters, enough to keep a human hydrated for 2.5 years!"
    }
  },
  {
    num: 8,
    name: "Solar Sanctuary",
    regionName: "Circular Oasis",
    themeColor: "from-indigo-500 to-purple-600",
    accentColor: "bg-indigo-500 border-indigo-600",
    reqPoints: 7000,
    coords: { x: 70, y: 82 },
    trivia: {
      question: "Which of the following describes the key principle of a 'circular economy'?",
      options: [
        "Only buying items with round or circular shapes",
        "Designing out waste, keeping products in use, and regenerating nature",
        "Trading circular metal coins instead of standard banknotes"
      ],
      correctIdx: 1,
      explanation: "A circular economy aims to break the 'take-make-waste' model by designing goods to be shared, repaired, remade, and recycled continuously."
    }
  },
  {
    num: 9,
    name: "Zero Waste Oasis",
    regionName: "Circular Oasis",
    themeColor: "from-purple-500 to-pink-600",
    accentColor: "bg-purple-500 border-purple-600",
    reqPoints: 8000,
    coords: { x: 35, y: 93 },
    trivia: {
      question: "In the famous sustainability hierarchy of 'Reduce, Reuse, Recycle', which step is the most impactful?",
      options: [
        "Recycle (transforming waste into feedstock)",
        "Reduce (avoiding waste generation in the first place)",
        "Reuse (prolonging the lifespan of products)"
      ],
      correctIdx: 1,
      explanation: "Reducing is the absolute champion! Preventing waste at the source completely eliminates the resource extraction, transport, and energy used in manufacturing."
    }
  }
];

export const EcoLand: React.FC<EcoLandProps> = ({ points, level: userLevel, onClose, onGainPoints }) => {
  const [selectedLevel, setSelectedLevel] = useState<LandLevel | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'answering' | 'correct' | 'incorrect'>('idle');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [completedQuizLevels, setCompletedQuizLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('eco_land_completed_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showLevelUpAlert, setShowLevelUpAlert] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('eco_land_completed_quizzes', JSON.stringify(completedQuizLevels));
  }, [completedQuizLevels]);

  const handleLevelClick = (lvl: LandLevel) => {
    sounds.playHoldSteady();
    setSelectedLevel(lvl);
    setQuizState('idle');
    setSelectedOption(null);
  };

  const handleAnswerSubmit = (optionIdx: number) => {
    if (!selectedLevel || quizState !== 'idle') return;
    setSelectedOption(optionIdx);

    if (optionIdx === selectedLevel.trivia.correctIdx) {
      setQuizState('correct');
      sounds.playSuccess();
      
      // If not already completed, award rewards!
      if (!completedQuizLevels.includes(selectedLevel.num)) {
        const xpReward = selectedLevel.num * 100;
        onGainPoints(xpReward);
        setCompletedQuizLevels(prev => [...prev, selectedLevel.num]);
        
        // Calculate new level
        const currentPointsTotal = points + xpReward;
        const newLevel = Math.floor(currentPointsTotal / 1000) + 1;
        if (newLevel > userLevel) {
          setShowLevelUpAlert(newLevel);
        }
      }
    } else {
      setQuizState('incorrect');
      sounds.playError();
    }
  };

  // Generate SVG path coordinate points
  const pathD = levelsData
    .map((lvl, index) => `${index === 0 ? 'M' : 'L'} ${lvl.coords.x} ${lvl.coords.y}`)
    .join(' ');

  return (
    <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl h-full max-h-[92vh] relative select-none">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center border border-amber-400/30 shadow-lg shadow-amber-500/20">
            <Map className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">EcoLand Map</h2>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-amber-400" /> LEVEL {userLevel} • {points} XP
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/60 hover:text-white border border-white/5 shadow-md active:scale-95"
          id="ecoland-close-btn"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Map Arena */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative p-6 bg-slate-950/40">
        
        {/* Background Decorative Areas */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          {/* Green Meadows */}
          <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-emerald-500/10 to-transparent" />
          {/* Recycle Ridge */}
          <div className="absolute top-[25%] left-0 right-0 h-[25%] bg-gradient-to-b from-amber-500/10 to-transparent" />
          {/* Compost Valley */}
          <div className="absolute top-[50%] left-0 right-0 h-[25%] bg-gradient-to-b from-green-600/10 to-transparent" />
          {/* Circular Oasis */}
          <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-purple-500/15 to-transparent" />
        </div>

        {/* Visual Map Content */}
        <div className="relative w-full h-[1500px]">
          
          {/* Territory Section Lines & Labels */}
          <div className="absolute top-[2%] left-4 border-l border-emerald-400/20 pl-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Green Meadows</h4>
            <p className="text-[9px] font-bold text-slate-500">LEVELS 1 - 2</p>
          </div>

          <div className="absolute top-[24%] right-4 text-right border-r border-amber-400/20 pr-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">Recycle Ridge</h4>
            <p className="text-[9px] font-bold text-slate-500">LEVELS 3 - 4</p>
          </div>

          <div className="absolute top-[45%] left-4 border-l border-green-500/20 pl-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-green-400">Valley of Composting</h4>
            <p className="text-[9px] font-bold text-slate-500">LEVELS 5 - 6</p>
          </div>

          <div className="absolute top-[68%] right-4 text-right border-r border-purple-400/20 pr-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400">Circular Oasis</h4>
            <p className="text-[9px] font-bold text-slate-500">LEVELS 7 - 9</p>
          </div>

          {/* SVG Connector Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="pathGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {/* Background path dash */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="url(#pathGradient)" 
              strokeWidth="8" 
              strokeLinecap="round"
              className="opacity-20"
            />
            {/* Animated foreground dash for current progress */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="url(#pathGradient)" 
              strokeWidth="8" 
              strokeLinecap="round"
              strokeDasharray="15,10"
              className="animate-[dash_120s_linear_infinite]"
              style={{
                strokeDashoffset: 100
              }}
            />
          </svg>

          {/* Floating decorative elements */}
          <div className="absolute top-[10%] left-[15%] w-10 h-10 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center justify-center animate-bounce duration-1000">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="absolute top-[32%] right-[15%] w-12 h-12 bg-amber-500/5 rounded-full border border-amber-500/10 flex items-center justify-center animate-pulse">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="absolute top-[54%] left-[10%] w-10 h-10 bg-green-500/5 rounded-full border border-green-500/10 flex items-center justify-center animate-bounce duration-700">
            <Compass className="w-4 h-4 text-green-400" />
          </div>
          <div className="absolute top-[76%] right-[12%] w-12 h-12 bg-purple-500/5 rounded-full border border-purple-500/10 flex items-center justify-center animate-pulse">
            <Lightbulb className="w-5 h-5 text-purple-400" />
          </div>

          {/* Map Levels Nodes */}
          {levelsData.map((lvl) => {
            const isUnlocked = userLevel >= lvl.num;
            const isActive = userLevel === lvl.num;
            const isCompleted = completedQuizLevels.includes(lvl.num);
            
            return (
              <div 
                key={lvl.num}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                style={{ left: `${lvl.coords.x}%`, top: `${lvl.coords.y}%` }}
                onClick={() => handleLevelClick(lvl)}
              >
                {/* Level Node Container */}
                <div className="relative group flex flex-col items-center">
                  
                  {/* Glowing Ring or Avatar Pin on active level */}
                  {isActive && (
                    <div className="absolute -inset-5 rounded-full bg-amber-400/20 border-2 border-amber-400/40 animate-ping duration-1000 z-0 pointer-events-none" />
                  )}

                  {/* Level Circle Button (Candy Crush / Duolingo Style) */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-4 relative shadow-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-b from-amber-300 to-orange-500 border-white text-white font-black scale-110 shadow-amber-500/40' 
                        : isCompleted 
                        ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-300 text-white shadow-emerald-500/20'
                        : isUnlocked
                        ? 'bg-gradient-to-b from-blue-400 to-indigo-600 border-blue-300 text-white shadow-blue-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-500 shadow-none'
                    }`}
                  >
                    {!isUnlocked ? (
                      <Lock className="w-5 h-5 text-slate-500" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white drop-shadow" />
                    ) : (
                      <span className="text-lg font-black tracking-tight drop-shadow-md">
                        {lvl.num}
                      </span>
                    )}

                    {/* Miniature Stars Decoration around completed nodes */}
                    {isCompleted && (
                      <div className="absolute -top-3 flex gap-0.5 justify-center z-20">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow" />
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow -mt-1" />
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow" />
                      </div>
                    )}
                  </motion.div>

                  {/* Level Label Panel */}
                  <div className={`mt-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider text-center shadow-lg backdrop-blur-md z-10 transition-all ${
                    isActive 
                      ? 'bg-amber-400/20 border-amber-400/40 text-amber-300' 
                      : isCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : isUnlocked 
                      ? 'bg-white/5 border-white/10 text-white/80' 
                      : 'bg-slate-900/40 border-slate-950 text-slate-600'
                  }`}>
                    {lvl.name}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Pop-up Level Drawer / Detail Overlay */}
      <AnimatePresence>
        {selectedLevel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-30 flex flex-col justify-end p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-slate-900 border border-white/15 rounded-t-[2.5rem] w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl p-6 space-y-6 relative"
            >
              {/* Close Overlay Shutter Button */}
              <button 
                onClick={() => setSelectedLevel(null)}
                className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Drawer Title Header */}
              <div className="flex gap-4 items-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${selectedLevel.themeColor} shadow-xl border border-white/10`}>
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{selectedLevel.regionName}</p>
                  <h3 className="text-xl font-black text-white leading-tight">Level {selectedLevel.num}: {selectedLevel.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400">Requires {selectedLevel.reqPoints} XP to enter</p>
                </div>
              </div>

              {/* Status Banner */}
              {userLevel < selectedLevel.num ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3 items-center">
                    <Lock className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Locked Territory</h4>
                      <p className="text-[10px] text-red-300 font-bold">You need {selectedLevel.reqPoints - points} more XP to unlock this ecological land.</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-red-500/20 text-left space-y-1">
                    <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" /> Unlock Requirement
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      Scan <strong className="text-emerald-400 font-black">{Math.max(1, Math.ceil((selectedLevel.reqPoints - points) / 50))} more item{Math.max(1, Math.ceil((selectedLevel.reqPoints - points) / 50)) !== 1 ? 's' : ''}</strong> in EcoScan to reach {selectedLevel.reqPoints} XP and unlock Level {selectedLevel.num}!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Check if trivia question was already answered */}
                  {completedQuizLevels.includes(selectedLevel.num) ? (
                    <div className="space-y-4">
                      {/* Completed Trivia - Question NOT Repeated */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 space-y-3">
                        <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2.5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Trivia Mastered
                          </div>
                          <span className="bg-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black text-emerald-300 border border-emerald-500/30">
                            +{selectedLevel.num * 100} XP Claimed
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Key Ecological Insight Learned:</span>
                          <p className="text-xs text-emerald-200 font-medium leading-relaxed">
                            {selectedLevel.trivia.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Next Level Item Scan Requirement */}
                      {selectedLevel.num < 9 ? (() => {
                        const nextLvl = levelsData[selectedLevel.num];
                        const xpNeeded = Math.max(0, nextLvl.reqPoints - points);
                        const scansNeeded = Math.ceil(xpNeeded / 50);

                        return (
                          <div className="bg-slate-950/60 rounded-3xl border border-amber-500/30 p-5 space-y-3 shadow-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
                                <Target className="w-4 h-4 text-amber-400 animate-pulse" /> Next Level Requirement
                              </div>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                                Level {nextLvl.num}: {nextLvl.name}
                              </span>
                            </div>

                            {xpNeeded <= 0 ? (
                              <p className="text-xs text-emerald-300 font-bold leading-relaxed">
                                🎉 You've reached the XP target for Level {nextLvl.num}! Tap Level {nextLvl.num} on the map to unlock new territory!
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  To advance to <strong className="text-white font-black">Level {nextLvl.num} ({nextLvl.name})</strong>, you need <strong className="text-amber-400 font-bold">{xpNeeded} more XP</strong>.
                                </p>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Scan Requirement:</p>
                                    <p className="text-xs text-slate-200 font-bold">
                                      Scan <span className="text-emerald-300 text-sm font-black underline decoration-emerald-400/60">{scansNeeded} item{scansNeeded !== 1 ? 's' : ''}</span> in EcoScan to move to Level {nextLvl.num}!
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })() : (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-5 text-center space-y-1">
                          <Trophy className="w-6 h-6 text-purple-400 mx-auto animate-bounce" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">Peak Sustainability Achieved</h4>
                          <p className="text-xs text-purple-200 font-medium">
                            You have unlocked and completed all territories in EcoLand! Keep scanning items to maintain your daily streak!
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Quiz Section for Uncompleted Trivia */
                    <div className="bg-slate-950/40 rounded-3xl border border-white/5 p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
                          <HelpCircle className="w-4 h-4 text-amber-400 animate-pulse" /> Eco Trivia Quiz
                        </div>
                        <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/15 text-[9px] font-black text-white">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> +{selectedLevel.num * 100} XP REWARD
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-relaxed">
                        {selectedLevel.trivia.question}
                      </h4>

                      {/* Quiz Options */}
                      <div className="space-y-2">
                        {selectedLevel.trivia.options.map((opt, i) => {
                          const isCorrectOpt = i === selectedLevel.trivia.correctIdx;
                          let btnStyle = "bg-white/5 border-white/5 hover:bg-white/10 text-white/90";
                          
                          if (quizState !== 'idle' && selectedOption === i) {
                            if (quizState === 'correct' || isCorrectOpt) {
                              btnStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-black shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                            } else if (quizState === 'incorrect') {
                              btnStyle = "bg-red-500/20 border-red-500/40 text-red-400 font-black";
                            }
                          } else if (quizState !== 'idle' && isCorrectOpt) {
                            btnStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-black";
                          }

                          return (
                            <button
                              key={i}
                              disabled={quizState !== 'idle'}
                              onClick={() => handleAnswerSubmit(i)}
                              className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {quizState !== 'idle' && isCorrectOpt && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {quizState === 'incorrect' && selectedOption === i && !isCorrectOpt && (
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quiz Results Explanation */}
                      <AnimatePresence>
                        {quizState === 'correct' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                              <Sparkles className="w-4 h-4 text-emerald-400" /> Correct! +{selectedLevel.num * 100} XP Earned!
                            </div>
                            <p className="text-xs text-emerald-300 font-medium leading-relaxed">
                              {selectedLevel.trivia.explanation}
                            </p>
                            
                            {/* Next Level Requirement Callout on Answer */}
                            {selectedLevel.num < 9 && (() => {
                              const nextLvl = levelsData[selectedLevel.num];
                              const xpNeeded = Math.max(0, nextLvl.reqPoints - (points + selectedLevel.num * 100));
                              const scansNeeded = Math.ceil(xpNeeded / 50);

                              return (
                                <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-200 font-bold flex items-center justify-between">
                                  <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-amber-400" /> Next Level ({nextLvl.num}):</span>
                                  <span>Scan <span className="text-white underline">{scansNeeded} item{scansNeeded !== 1 ? 's' : ''}</span> to unlock!</span>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}

                        {quizState === 'incorrect' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-2"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-400">
                              <AlertCircle className="w-4 h-4 text-red-400" /> Incorrect Answer
                            </div>
                            <p className="text-xs text-red-300 font-medium leading-relaxed">
                              Don't worry! Review the options and try again. Each attempt helps you master the sorting protocols!
                            </p>
                            <button 
                              onClick={() => {
                                setQuizState('idle');
                                setSelectedOption(null);
                              }}
                              className="mt-2 text-[10px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-xl transition-all"
                            >
                              Try Again
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Next Level Scan Requirement Banner for Active Quiz */}
                      {selectedLevel.num < 9 && quizState === 'idle' && (() => {
                        const nextLvl = levelsData[selectedLevel.num];
                        const xpNeeded = Math.max(0, nextLvl.reqPoints - points);
                        const scansNeeded = Math.ceil(xpNeeded / 50);

                        return (
                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                            <span className="flex items-center gap-1.5 text-amber-400 font-black uppercase tracking-wider text-[10px]">
                              <Target className="w-3.5 h-3.5" /> Next Level Goal ({nextLvl.name}):
                            </span>
                            <span>
                              Scan <strong className="text-emerald-400">{scansNeeded} item{scansNeeded !== 1 ? 's' : ''}</strong> ({xpNeeded} XP)
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Level Info & Learning Point Card */}
                  <div className="bg-white/5 rounded-3xl border border-white/5 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                      <Lightbulb className="w-4 h-4" /> Ecology Mission
                    </div>
                    <p className="text-xs text-white/80 font-bold leading-relaxed">
                      {selectedLevel.num === 1 && "Start your journey by scanning recyclable household items to learn standard sorting guidelines."}
                      {selectedLevel.num === 2 && "Differentiate plastics correctly. Always check the triangle number for custom disposal facilities."}
                      {selectedLevel.num === 3 && "Keep cardboard dry! Take special care to separate organic residues from clean packing paper."}
                      {selectedLevel.num === 4 && "Master aluminum and steel recycling. These metals represent high-value endlessly circular commodities."}
                      {selectedLevel.num === 5 && "Convert nutrients back into fertile soil. Composting prevents bad landfill decay and gas leaks."}
                      {selectedLevel.num === 6 && "Prevent toxic leakage. Batteries, adapters, and consumer micro-circuits require hazardous sorting."}
                      {selectedLevel.num === 7 && "Fight clothing pollution. Reuse or donate textiles rather than tossing fibers in the trash."}
                      {selectedLevel.num === 8 && "Embrace zero-waste circular systems. Find community swap meets or local drop-off depots."}
                      {selectedLevel.num === 9 && "You have reached the ultimate peak! Keep advocating for systemic change and plastic-free designs."}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level-Up Celebration Modal Overlay */}
      <AnimatePresence>
        {showLevelUpAlert !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[20%] left-[10%] w-12 h-12 bg-amber-400/20 rounded-full animate-bounce" />
              <div className="absolute top-[40%] right-[15%] w-8 h-8 bg-emerald-400/20 rounded-full animate-ping" />
              <div className="absolute bottom-[20%] left-[25%] w-10 h-10 bg-blue-400/20 rounded-full animate-pulse" />
            </div>

            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 100 }}
              transition={{ type: "spring", damping: 15 }}
              className="space-y-6 max-w-sm"
            >
              <div className="inline-flex w-24 h-24 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl items-center justify-center border-2 border-white shadow-2xl shadow-amber-500/50 relative">
                <Trophy className="w-12 h-12 text-white animate-pulse" />
                <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-amber-300 animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Level Up!</h3>
                <p className="text-lg font-black text-amber-400 uppercase tracking-widest">LEVEL {showLevelUpAlert}</p>
                <p className="text-xs text-white/70 font-bold leading-relaxed px-4">
                  Amazing work! Your Eco knowledge is expanding. You have unlocked new territories and sorting challenges in EcoLand!
                </p>
              </div>

              <button
                onClick={() => setShowLevelUpAlert(null)}
                className="w-full py-4 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/25 border border-emerald-300 transition-all active:scale-95"
              >
                Continue Adventure
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
