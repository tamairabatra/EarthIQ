import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Camera, 
  RefreshCcw, Sparkles, Scissors, Paintbrush, Layers, Activity, 
  CheckCircle2, Video, Settings, HelpCircle, AlertTriangle, Monitor, 
  Lightbulb, Hourglass, Hammer, Flame, Trash2, FlipHorizontal, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { sounds } from '../utils/sound-effects';

// @ts-ignore
import generalCraftImg from '../src/assets/images/people_upcycling_general_1783817668212.jpg';
// @ts-ignore
import plasticCraftImg from '../src/assets/images/people_upcycling_plastic_1783817680184.jpg';
// @ts-ignore
import cardboardCraftImg from '../src/assets/images/people_upcycling_cardboard_1783817690653.jpg';

interface DIYVideoPlayerProps {
  title: string;
  item: string;
  steps: string[];
  materialsNeeded: string[];
  estimatedTime: string;
  difficulty: string;
  onClose?: () => void;
}

export const DIYVideoPlayer: React.FC<DIYVideoPlayerProps> = ({
  title,
  item,
  steps,
  materialsNeeded,
  estimatedTime,
  difficulty,
  onClose
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // View mode: AI Visualizer vs Blueprint Schematic
  const [playerViewMode, setPlayerViewMode] = useState<'ai-photo' | 'schematic'>('ai-photo');
  
  // PIP Workspace Camera
  const [showPipCamera, setShowPipCamera] = useState(false);
  const [pipFacingMode, setPipFacingMode] = useState<'user' | 'environment'>('user');
  const [pipIsMirrored, setPipIsMirrored] = useState(true);
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipError, setPipError] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle PIP Camera Toggle
  const startPipCamera = async (mode: 'user' | 'environment' = pipFacingMode) => {
    setPipError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 320 },
            height: { ideal: 240 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn("PIP Camera custom constraints failed, trying basic fallback...", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      streamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.onloadedmetadata = () => {
          videoElementRef.current?.play().catch(e => console.error("PIP Play error:", e));
        };
      }
      setIsPipActive(true);
      setPipFacingMode(mode);
      setPipIsMirrored(mode === 'user');
    } catch (err: any) {
      console.warn("PIP Camera status info:", err.message || err);
      setPipError("Camera denied or unavailable");
      setIsPipActive(false);
    }
  };

  const stopPipCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setIsPipActive(false);
  };

  useEffect(() => {
    if (showPipCamera) {
      startPipCamera();
    } else {
      stopPipCamera();
    }
    return () => stopPipCamera();
  }, [showPipCamera]);

  const togglePipCameraFacing = () => {
    const nextMode = pipFacingMode === 'environment' ? 'user' : 'environment';
    setPipFacingMode(nextMode);
    startPipCamera(nextMode);
  };

  // Determine which vector schematic / tool animation to display based on keywords
  const getActionType = (text: string = "") => {
    const lower = text.toLowerCase();
    if (lower.includes("cut") || lower.includes("scissor") || lower.includes("trim") || lower.includes("slice")) return "cut";
    if (lower.includes("paint") || lower.includes("color") || lower.includes("brush") || lower.includes("decorate") || lower.includes("marker")) return "paint";
    if (lower.includes("glue") || lower.includes("stick") || lower.includes("paste") || lower.includes("attach") || lower.includes("tape") || lower.includes("adhere")) return "glue";
    if (lower.includes("plant") || lower.includes("soil") || lower.includes("grow") || lower.includes("seed") || lower.includes("water")) return "plant";
    if (lower.includes("light") || lower.includes("led") || lower.includes("lamp") || lower.includes("bulb") || lower.includes("wire") || lower.includes("solar")) return "light";
    if (lower.includes("wash") || lower.includes("clean") || lower.includes("rinse") || lower.includes("dry") || lower.includes("wipe")) return "clean";
    if (lower.includes("fold") || lower.includes("bend") || lower.includes("origami") || lower.includes("wrap")) return "fold";
    return "default";
  };

  const actionType = steps.length > 0 ? getActionType(steps[currentStepIndex]) : "default";

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      sounds.playTrash();
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      sounds.playTrash();
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Map item keyword to AI generated upcycling image
  const getAiImage = () => {
    const lower = item.toLowerCase();
    if (lower.includes("plastic") || lower.includes("bottle") || lower.includes("can") || lower.includes("container") || lower.includes("soda") || lower.includes("jug") || lower.includes("plastic bottle")) {
      return plasticCraftImg;
    }
    if (lower.includes("cardboard") || lower.includes("box") || lower.includes("paper") || lower.includes("carton") || lower.includes("newspaper") || lower.includes("package")) {
      return cardboardCraftImg;
    }
    return generalCraftImg;
  };
  const activeAiImage = getAiImage();

  return (
    <div className="flex flex-col lg:flex-row gap-5 bg-slate-950 p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl w-full">
      {/* Visual Video Screen & Workspace PIP (Left Column) */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Main Video Viewfinder Container */}
        <div className="relative w-full aspect-video bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-inner group">
          
          {/* Overlay Status Headers */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 shadow-md pointer-events-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">AI CRAFT VIDEO</span>
            </div>
            
            {/* View Mode Switcher */}
            <div className="flex bg-slate-950/90 p-0.5 rounded-lg border border-white/10 shadow-md pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setPlayerViewMode('ai-photo');
                  sounds.playHoldSteady();
                }}
                className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${playerViewMode === 'ai-photo' ? 'bg-amber-400 text-slate-950' : 'text-white/60 hover:text-white'}`}
                title="View AI generation of creators upcycling"
              >
                <ImageIcon className="w-2.5 h-2.5" />
                AI Visualizer
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlayerViewMode('schematic');
                  sounds.playHoldSteady();
                }}
                className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${playerViewMode === 'schematic' ? 'bg-amber-400 text-slate-950' : 'text-white/60 hover:text-white'}`}
                title="View interactive step blueprints"
              >
                <Monitor className="w-2.5 h-2.5" />
                Schematic
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 shadow-md">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/50">STEP {currentStepIndex + 1} OF {steps.length}</span>
            </div>
          </div>

          {/* Render based on view mode */}
          {playerViewMode === 'ai-photo' ? (
            /* AI Visual Realism Stage */
            <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950">
              {/* Image element with dynamic slow ken-burns zoom animation */}
              <motion.img
                key={activeAiImage}
                src={activeAiImage}
                alt="AI Generated Realism Visual of People Crafting"
                referrerPolicy="no-referrer"
                initial={{ scale: 1.02, filter: "brightness(0.9) contrast(1.05)" }}
                animate={{ 
                  scale: [1.02, 1.07, 1.02],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 20, 
                  ease: "easeInOut" 
                }}
                className="w-full h-full object-cover select-none"
              />

              {/* Scanning Lines Glass Overlay Filter */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-40" />

              {/* Camera recording crop box lines overlay */}
              <div className="absolute inset-4 border border-white/10 pointer-events-none rounded-lg flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-3 h-3 border-t-2 border-l-2 border-white/30" />
                  <span className="w-3 h-3 border-t-2 border-r-2 border-white/30" />
                </div>
                {/* Active step guide status inside visualizer */}
                <div className="flex justify-between items-end">
                  <span className="text-[7px] font-mono text-white/50 bg-slate-950/60 px-1.5 py-0.5 rounded backdrop-blur-sm tracking-wider uppercase">
                    PROJECT VIEW
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-950/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[7px] font-mono text-white/70 uppercase tracking-widest">
                      ACTIVE GUIDE
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="w-3 h-3 border-b-2 border-l-2 border-white/30" />
                  <span className="w-3 h-3 border-b-2 border-r-2 border-white/30" />
                </div>
              </div>

              {/* Subtle visual helper label */}
              <div className="absolute bottom-18 left-4 z-10 bg-slate-950/70 border border-white/5 px-2 py-0.5 rounded text-[8px] font-mono text-amber-300 backdrop-blur-sm uppercase tracking-widest">
                AI Visualizer: People Crafting
              </div>
            </div>
          ) : (
            /* Graphic Animation Stage */
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.8)_0%,rgba(15,23,42,1)_100%)] overflow-hidden">
              {/* Retro grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

              {/* Render action-specific procedurally animated graphics */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStepIndex}-${actionType}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="w-full h-full flex flex-col items-center justify-center relative z-0"
                >
                {/* 1. CUTTING TOOL ACTION */}
                {actionType === "cut" && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-36 h-20 border-b-2 border-dashed border-amber-400/50 flex items-center justify-center">
                      <motion.div 
                        animate={{ 
                          x: [-50, 50, -50], 
                          rotate: [0, 15, 0, -15, 0] 
                        }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute text-amber-300"
                      >
                        <Scissors className="w-12 h-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
                      </motion.div>
                      <span className="absolute left-1 bottom-1 text-[7px] font-black text-white/40 uppercase tracking-widest">Dashed cutting line</span>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-300/80">Action: Precision Cutting</p>
                  </div>
                )}

                {/* 2. PAINT / DECORATE ACTION */}
                {actionType === "paint" && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-32 h-20 flex items-center justify-center">
                      <motion.div
                        animate={{
                          x: [-40, 40, -40],
                          y: [-10, 10, -10],
                          rotate: [-10, 20, -10]
                        }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="text-amber-400"
                      >
                        <Paintbrush className="w-12 h-12 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" />
                      </motion.div>
                      
                      {/* Animated colorful waves behind brush */}
                      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 100 100">
                        <motion.path
                          d="M 10 50 Q 30 20, 50 50 T 90 50"
                          fill="transparent"
                          stroke="url(#paintGrad)"
                          strokeWidth="6"
                          strokeLinecap="round"
                          animate={{ strokeDashoffset: [0, 100] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        />
                        <defs>
                          <linearGradient id="paintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Action: Decorate & Styling</p>
                  </div>
                )}

                {/* 3. GLUE / ADHESIVE ACTION */}
                {actionType === "glue" && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative w-32 h-24 flex flex-col items-center justify-center">
                      <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="text-amber-400"
                      >
                        <Flame className="w-10 h-10 animate-pulse text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      </motion.div>
                      
                      {/* Falling glue droplet */}
                      <motion.div
                        initial={{ y: -10, scale: 0.5, opacity: 0 }}
                        animate={{ y: [0, 40, 40], scale: [0.5, 1, 0.8], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeIn" }}
                        className="absolute w-3.5 h-3.5 bg-amber-300 rounded-full blur-[1px] shadow-[0_0_8px_#fbbf24]"
                      />
                      <div className="w-16 h-1 bg-white/20 rounded-full mt-8" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Action: Bonding & Adhering</p>
                  </div>
                )}

                {/* 4. PLANTING / GREEN GROWING ACTION */}
                {actionType === "plant" && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-28 h-24 flex flex-col items-center justify-end">
                      {/* Simulated Pot */}
                      <div className="w-16 h-12 bg-slate-800 border-2 border-white/20 rounded-b-xl relative overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-amber-950/80" />
                      </div>

                      {/* Sprouts */}
                      <motion.div 
                        initial={{ scaleY: 0.1, originY: 1 }}
                        animate={{ scaleY: [0.1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="absolute bottom-11 text-emerald-400"
                      >
                        <Activity className="w-10 h-10 animate-pulse text-emerald-400" />
                      </motion.div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Action: Botanical Life Planting</p>
                  </div>
                )}

                {/* 5. ELECTRICAL LIGHT/GLOW ACTION */}
                {actionType === "light" && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-28 h-24 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scale: [0.95, 1.08, 0.95], 
                          opacity: [0.8, 1, 0.8] 
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                      >
                        <Lightbulb className="w-14 h-14" />
                      </motion.div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">Action: Circuitry & Illuminating</p>
                  </div>
                )}

                {/* 6. WASH / CLEAN ACTION */}
                {actionType === "clean" && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-28 h-24 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="text-sky-400"
                      >
                        <RefreshCcw className="w-12 h-12 text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]" />
                      </motion.div>
                      
                      {/* Floating dynamic cleaning spark particles */}
                      <motion.div 
                        animate={{ x: [-20, 20], y: [-20, -10] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="absolute text-white"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">Action: Sterilizing & Cleaning</p>
                  </div>
                )}

                {/* 7. FOLDING / STRUCTURE ACTION */}
                {actionType === "fold" && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="relative w-28 h-24 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scaleX: [1, 0.2, 1],
                          scaleY: [1, 0.8, 1],
                          rotate: [0, 45, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                        className="text-indigo-400"
                      >
                        <Layers className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.4)]" />
                      </motion.div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Action: Structural Origami Folding</p>
                  </div>
                )}

                {/* 8. DEFAULT ANIMATION */}
                {actionType === "default" && (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative w-32 h-24 flex items-center justify-center">
                      {/* Futuristic scanning blueprint visual */}
                      <motion.div
                        animate={{ 
                          rotateY: 360,
                          rotateX: [15, -15, 15]
                        }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="w-16 h-16 border-2 border-amber-400/30 rounded-xl flex items-center justify-center relative bg-amber-400/5"
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                        {/* Red scanning bar going down */}
                        <motion.div
                          animate={{ y: [-32, 32, -32] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                          className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_4px_#f59e0b] w-full"
                        />
                      </motion.div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Action: Physical Construction</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          )}

          {/* Subtitles Overlay Bar at Bottom */}
          <div className="absolute bottom-16 inset-x-4 bg-slate-950/85 border border-white/5 backdrop-blur-md p-3 rounded-xl shadow-lg z-10">
            <p className="text-[10.5px] font-bold text-white/95 leading-relaxed text-center">
              {steps.length > 0 ? steps[currentStepIndex] : "Analyzing tutorial instructions..."}
            </p>
          </div>

          {/* Controls Strip Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-slate-950/95 border-t border-white/5 px-4 py-2 flex items-center justify-between z-10 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="p-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl disabled:opacity-30 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                title="Previous step"
              >
                <SkipBack className="w-3.5 h-3.5" />
                Back
              </button>
              
              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStepIndex === steps.length - 1}
                className="p-2 bg-orange-400 hover:bg-orange-300 text-slate-950 rounded-xl disabled:opacity-30 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                title="Next step"
              >
                Next
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side controllers */}
            <div className="flex items-center gap-2">
              {/* Pip Camera Launcher */}
              <button
                type="button"
                onClick={() => {
                  setShowPipCamera(prev => !prev);
                  sounds.playHoldSteady();
                }}
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border ${showPipCamera ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : 'text-white/70 border-white/5 hover:text-white hover:bg-white/5'}`}
                title="Launch workspace mirror camera"
              >
                <Camera className="w-4 h-4" />
                Workspace Camera
              </button>
            </div>
          </div>

          {/* Picture in Picture Live Camera Feed Overlay (Corner Box) */}
          <AnimatePresence>
            {showPipCamera && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="absolute right-3 top-14 w-[120px] sm:w-[150px] aspect-video bg-slate-950 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-20 flex flex-col group/pip"
              >
                {pipError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-slate-900/95">
                    <AlertTriangle className="w-4 h-4 text-rose-400 mb-1" />
                    <span className="text-[7px] text-rose-400 font-black uppercase tracking-wider">{pipError}</span>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoElementRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: pipIsMirrored ? 'scaleX(-1)' : 'none' }}
                    />
                    
                    {/* Hover flipper button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      <button
                        type="button"
                        onClick={togglePipCameraFacing}
                        className="p-1 bg-slate-900 border border-white/10 text-white rounded-lg text-[7px] font-black uppercase tracking-wider flex items-center gap-0.5 active:scale-90"
                      >
                        <RefreshCcw className="w-2.5 h-2.5" />
                        Flip
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPipCamera(false)}
                        className="p-1 bg-rose-950/80 border border-rose-500/10 text-rose-400 rounded-lg text-[7px] font-black uppercase tracking-wider active:scale-90"
                      >
                        Hide
                      </button>
                    </div>
                    
                    <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[6px] text-white/70 tracking-widest font-black uppercase">
                      Workspace
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video progress stepper slider */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[8.5px] font-black text-white/40 uppercase tracking-widest">
            <span>Video Timeline</span>
            <span>{currentStepIndex + 1} of {steps.length} Steps</span>
          </div>
          
          <div className="flex gap-1">
            {steps.map((_, i) => {
              const isActive = i === currentStepIndex;
              const isPassed = i < currentStepIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sounds.playTrash();
                    setCurrentStepIndex(i);
                  }}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 relative ${
                    isActive 
                      ? 'bg-orange-400 shadow-[0_0_8px_#f97316]' 
                      : isPassed 
                        ? 'bg-orange-400/40' 
                        : 'bg-white/5'
                  }`}
                  title={`Go to step ${i + 1}`}
                >
                  {isActive && (
                    <span className="absolute -inset-0.5 border border-orange-300 rounded-full animate-ping pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>


      </div>

      {/* Materials List & Step list overview (Right Column) */}
      <div className="w-full lg:w-[280px] flex flex-col gap-4 shrink-0">
        {/* Project Meta Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-3 flex items-center gap-2.5">
            <Hourglass className="w-4 h-4 text-orange-400 animate-pulse" />
            <div>
              <span className="text-[7.5px] font-black text-white/40 uppercase tracking-wider block">Duration</span>
              <span className="text-[10px] font-black text-white">{estimatedTime}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-3 flex items-center gap-2.5">
            <Hammer className="w-4 h-4 text-orange-400" />
            <div>
              <span className="text-[7.5px] font-black text-white/40 uppercase tracking-wider block">Difficulty</span>
              <span className="text-[10px] font-black text-white">{difficulty}</span>
            </div>
          </div>
        </div>

        {/* Required Materials list */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-2.5">
          <h4 className="text-[8.5px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Supplies checklist
          </h4>
          <ul className="space-y-1.5">
            {materialsNeeded.map((mat, i) => (
              <li key={i} className="text-[9.5px] font-bold text-white/80 flex items-start gap-2">
                <span className="text-orange-400 shrink-0 mt-0.5">•</span>
                {mat}
              </li>
            ))}
          </ul>
        </div>

        {/* Vertical step summary navigation */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex-1 flex flex-col gap-2.5 min-h-[160px] max-h-[220px] lg:max-h-[280px] overflow-y-auto no-scrollbar">
          <h4 className="text-[8.5px] font-black uppercase tracking-widest text-white/40">Steps Summary</h4>
          <div className="space-y-2">
            {steps.map((step, i) => {
              const isActive = i === currentStepIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    sounds.playTrash();
                    setCurrentStepIndex(i);
                  }}
                  className={`w-full text-left p-2 rounded-xl border transition-all flex gap-2.5 ${
                    isActive 
                      ? 'bg-orange-400/10 border-orange-400/30' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className={`w-4 h-4 rounded text-[8.5px] font-black flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-orange-400 text-slate-950' : 'bg-white/5 text-white/40'
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`text-[9px] font-bold line-clamp-2 leading-relaxed ${isActive ? 'text-white' : 'text-white/40'}`}>
                    {step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Close Button / Close Player */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Exit Guide
          </button>
        )}
      </div>
    </div>
  );
};
