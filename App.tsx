
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ClassificationCard } from './components/ClassificationCard';
import { ImpactDashboard } from './components/ImpactDashboard';
import { LocalInfo } from './components/LocalInfo';
import { CommunityChallenges } from './components/CommunityChallenges';
import { EcoChatbot } from './components/EcoChatbot';
import { EcoLand } from './components/EcoLand';
import { triggerHaptic } from './utils/haptic';
import { UnidentifiedPopup } from './components/UnidentifiedPopup';
import { DonationMap } from './components/DonationMap';
import { DIYHub } from './components/DIYHub';
import { ScanHistoryView } from './components/ScanHistoryView';
import { GroupedScanResults } from './components/GroupedScanResults';
import { TrashCategory, GroundingLink, ClassificationResult, ImpactStats, Challenge, LearnedItem, ScanHistoryItem, DIYProject, DetectedItem } from './types';
import { sounds } from './utils/sound-effects';
import { decode, decodeAudioData } from './utils/audio-utils';
import { safeParseAIJson } from './utils/jsonParser';
import { AlertCircle, RotateCcw, Camera, Scan, Loader2, RefreshCcw, FlipHorizontal, Upload, Trophy, Bot, Sparkles, Map, X, ExternalLink, BookOpen, Target, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  // UI States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchingCenters, setIsSearchingCenters] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'impact' | 'coach' | 'donation' | 'diy' | 'history' | 'more'>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_active_tab') || sessionStorage.getItem('ecoscan_active_tab');
      if (saved && ['scan', 'impact', 'coach', 'donation', 'diy', 'history'].includes(saved)) {
        return saved as any;
      }
    } catch (e) {}
    return 'scan';
  });
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isPreviewDevice, setIsPreviewDevice] = useState(true);
  
  // DIY States
  const [diyProjects, setDiyProjects] = useState<DIYProject[]>([]);
  const [prefilledDiy, setPrefilledDiy] = useState<{ title: string; item: string; category: TrashCategory; description?: string } | null>(null);
  const [donationPreselection, setDonationPreselection] = useState<{ itemLabel: string; category: TrashCategory } | null>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_donation_preselection');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [timeStr, setTimeStr] = useState("12:45");
  const [showEducation, setShowEducation] = useState(false);
  const [showLocalInfo, setShowLocalInfo] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showEcoLand, setShowEcoLand] = useState(false);

  // Synchronize activeTab to persistence
  useEffect(() => {
    try {
      localStorage.setItem('ecoscan_active_tab', activeTab);
      sessionStorage.setItem('ecoscan_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  // Synchronize donationPreselection to persistence
  useEffect(() => {
    try {
      if (donationPreselection) {
        localStorage.setItem('ecoscan_donation_preselection', JSON.stringify(donationPreselection));
      } else {
        localStorage.removeItem('ecoscan_donation_preselection');
      }
    } catch (e) {}
  }, [donationPreselection]);

  // Handle visibility resume / PWA focus recovery when returning from external apps like Google Maps
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        const savedTab = localStorage.getItem('ecoscan_active_tab');
        if (savedTab && ['scan', 'impact', 'coach', 'donation', 'diy', 'history'].includes(savedTab)) {
          setActiveTab(prev => (prev === 'more' ? prev : (savedTab as any)));
        }
        
        // Re-affirm dark/light theme to prevent any white-out or unstyled flashes
        const savedTheme = localStorage.getItem('theme');
        const isLightTheme = savedTheme === 'light';
        const root = document.documentElement;
        const body = document.body;
        if (isLightTheme) {
          root.classList.add('light');
          root.classList.remove('dark');
          body.classList.add('light');
          body.classList.remove('dark');
        } else {
          root.classList.add('dark');
          root.classList.remove('light');
          body.classList.add('dark');
          body.classList.remove('light');
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved !== 'light';
  });

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      sounds.playSuccess();
      return next;
    });
  }, []);

  // Synchronize dark/light theme class on document element & body
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }
  }, [isDark]);

  // Monitor screen size & tick simulated clock
  useEffect(() => {
    const checkSize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTimeStr(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 60000);

    return () => {
      window.removeEventListener('resize', checkSize);
      clearInterval(clockInterval);
    };
  }, []);

  const handleGainPoints = useCallback((pts: number) => {
    setImpactStats(prev => {
      const newPoints = prev.points + pts;
      const newLevel = Math.floor(newPoints / 1000) + 1;
      return {
        ...prev,
        points: newPoints,
        level: newLevel
      };
    });
  }, []);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Data States
  const [currentCategory, setCurrentCategory] = useState<TrashCategory>(TrashCategory.UNKNOWN);
  const [itemLabel, setItemLabel] = useState("");
  const [currentItemImpact, setCurrentItemImpact] = useState<{ treesSaved: number; waterSaved: number; co2Reduced: number } | null>(null);
  const [reason, setReason] = useState("");
  const [carbonImpact, setCarbonImpact] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<GroundingLink[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isTeaching, setIsTeaching] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  const selectActiveItem = (index: number) => {
    if (index < 0 || index >= detectedItems.length) return;
    setSelectedItemIndex(index);
    const result = detectedItems[index];
    
    setItemLabel(result.item);
    const fullReason = `${result.reason} ${result.disposalInstructions || ''}`;
    setReason(fullReason);
    setCarbonImpact(result.carbonImpact || "");
    setCurrentCategory(result.category);
    setConfidence(result.confidence || 0);
    setDiyProjects(result.diyProjects || []);

    // Recompute impact stats for this specific item to display
    let itemTrees = 0;
    let itemWater = 0;
    let itemCo2 = 0;

    if (result.category === TrashCategory.RECYCLE) {
      itemTrees = 0.02;
      itemWater = 1.5;
      itemCo2 = 0.3;
    } else if (result.category === TrashCategory.ORGANIC) {
      itemCo2 = 0.15;
      itemWater = 0.2;
    } else if (result.category === TrashCategory.ELECTRONIC) {
      itemCo2 = 1.2;
      itemWater = 5.0;
    } else if (result.category === TrashCategory.TEXTILE) {
      itemWater = 2.5;
      itemCo2 = 0.8;
    } else if (result.category === TrashCategory.HAZARDOUS) {
      itemCo2 = 0.1;
    } else if (result.category === TrashCategory.REPAIR) {
      itemWater = 3.5;
      itemCo2 = 1.5;
    }
    setCurrentItemImpact({ treesSaved: itemTrees, waterSaved: itemWater, co2Reduced: itemCo2 });
    
    // Play sound of category
    switch (result.category) {
      case TrashCategory.RECYCLE: sounds.playRecycle(); break;
      case TrashCategory.ORGANIC: sounds.playOrganic(); break;
      case TrashCategory.TRASH: sounds.playTrash(); break;
      default: sounds.playSpecial(); break;
    }
  };
  
  // Custom Knowledge state
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_learned_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Scan History State
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [expandedHistoryItemId, setExpandedHistoryItemId] = useState<string | null>(null);

  const toggleExpandHistoryItem = (id: string) => {
    setExpandedHistoryItemId(prev => prev === id ? null : id);
  };

  const handleClearHistory = () => {
    setScanHistory([]);
  };

  useEffect(() => {
    localStorage.setItem('ecoscan_scan_history', JSON.stringify(scanHistory));
  }, [scanHistory]);
  
  // Impact Stats State
  const [impactStats, setImpactStats] = useState<ImpactStats>(() => {
    const defaultStats = {
      scannedCount: 0,
      treesSaved: 0,
      waterSaved: 0,
      co2Reduced: 0,
      points: 0,
      level: 1
    };
    try {
      const saved = localStorage.getItem('eco_impact_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultStats, ...parsed };
      }
      return defaultStats;
    } catch (e) {
      return defaultStats;
    }
  });

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    try {
      const saved = localStorage.getItem('eco_challenges');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 4) {
          return parsed;
        }
      }
      return [
        {
          id: '1',
          title: 'Plastic Pioneer',
          description: 'Scan 5 recyclable items to earn your first badge.',
          target: 5,
          current: 0,
          reward: 100,
          category: TrashCategory.RECYCLE,
          isCompleted: false,
          icon: 'zap'
        },
        {
          id: '2',
          title: 'Organic Master',
          description: 'Compost 3 organic waste items.',
          target: 3,
          current: 0,
          reward: 150,
          category: TrashCategory.ORGANIC,
          isCompleted: false,
          icon: 'leaf'
        },
        {
          id: '3',
          title: 'Eco Explorer',
          description: 'Scan items from 4 different categories.',
          target: 4,
          current: 0,
          reward: 500,
          isCompleted: false,
          icon: 'star'
        },
        {
          id: '4',
          title: 'Great Global Clean-Up',
          description: 'Community Challenge: Scan 10,000 items this week. Every scan you perform contributes!',
          target: 10000,
          current: 8432,
          reward: 500,
          isCompleted: false,
          isCommunity: true,
          participantsCount: 12402,
          icon: 'star'
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Save stats whenever they change
  useEffect(() => {
    localStorage.setItem('eco_impact_stats', JSON.stringify(impactStats));
  }, [impactStats]);

  useEffect(() => {
    localStorage.setItem('eco_challenges', JSON.stringify(challenges));
  }, [challenges]);
  
  // Refs for hardware/media
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize geolocation once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Geolocation warning:", err.message)
      );
    }
    return () => {
      stopCamera();
    };
  }, []);

  // Ensure stream stays attached to video element if it's active
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Auto-play failed:", e));
    }
  }, [isCameraActive, capturedImage]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    if (isInitializingCamera) return;
    
    setIsInitializingCamera(true);
    setError(null);
    stopCamera(); // Clean start

    try {
      let stream;
      try {
        // Phase 1: Try high-quality environment/rear camera if available
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn("High-res environment camera failed, retrying with fallback generic constraints:", firstErr);
        // Phase 2: Fallback to basic generic video stream (any available camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Playback error:", e));
        };
      }
      
      setIsCameraActive(true);
      console.log("Camera started successfully, streamRef:", streamRef.current);
      resetScanner(false);
      sounds.playConnected();
    } catch (err: any) {
      console.error("Camera access failed:", err);
      let msg = "Camera access failed.";
      
      const isInIframe = window.self !== window.top;
      
      if (err.name === 'NotAllowedError' || (err.message && (err.message.includes('denied') || err.message.includes('permission')))) {
        if (isInIframe) {
          msg = "Camera access is restricted inside the preview frame. Click 'Open in New Tab' to grant camera access and use real-time scanning!";
        } else {
          msg = "Permission denied. Please click the camera/lock icon in your browser address bar to allow camera access.";
        }
      } else if (err.name === 'NotFoundError') {
        msg = "No camera found on this device. You can still upload photos from your library!";
      } else {
        msg = "Could not access camera. Please ensure camera permissions are granted in your browser settings, or upload a photo instead.";
      }
      
      setError(msg);
      sounds.playError();
    } finally {
      setIsInitializingCamera(false);
    }
  };

  // Compress and resize image before setting it, to dramatically speed up upload and Gemini analysis
  const compressAndSetImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 640;
      let width = img.width || 640;
      let height = img.height || 480;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width) || 480;
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height) || 640;
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setCapturedImage(compressedDataUrl);
      } else {
        setCapturedImage(dataUrl);
      }
      setIsAnalysisComplete(false);
      setError(null);
      stopCamera();
      sounds.playSuccess();
    };
    img.onerror = () => {
      setCapturedImage(dataUrl);
      setIsAnalysisComplete(false);
      setError(null);
      stopCamera();
      sounds.playSuccess();
    };
    img.src = dataUrl;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      compressAndSetImage(dataUrl);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        compressAndSetImage(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please drop an image file.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.readyState < 2) {
      setError("Camera feed not ready. Please wait a moment.");
      return null;
    }

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    // Scale down high-resolution feeds to max 960px for fast, reliable network uploads on mobile
    const maxDimension = 960;
    let targetWidth = videoWidth;
    let targetHeight = videoHeight;
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * maxDimension);
        targetWidth = maxDimension;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * maxDimension);
        targetHeight = maxDimension;
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Mirror the capture to match the mirrored preview
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    // Capture full video frame cleanly
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedImage(dataUrl);
    setIsAnalysisComplete(false);
    return dataUrl;
  };

  const speakText = async (textToSpeak: string) => {
    // Permanently disabled
    return;
  };

  const handleTeachItem = useCallback(async (name: string, category: TrashCategory) => {
    setIsTeaching(true);
    setError(null);
    sounds.playHoldSteady();

    try {
      // Simulate visual training delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newItem: LearnedItem = {
        id: Date.now().toString(),
        name: name,
        category: category,
        timestamp: Date.now()
      };

      const updatedLearnedItems = [...learnedItems, newItem];
      setLearnedItems(updatedLearnedItems);
      localStorage.setItem('ecoscan_learned_items', JSON.stringify(updatedLearnedItems));

      // Reward points for AI training contribution
      const newPoints = impactStats.points + 100;
      const calculatedLevel = Math.floor(newPoints / 500) + 1;
      const updatedStats = {
        ...impactStats,
        points: newPoints,
        level: calculatedLevel
      };
      setImpactStats(updatedStats);
      localStorage.setItem('eco_impact_stats', JSON.stringify(updatedStats));

      setFeedback(`${name} (${category})`);
      sounds.playSuccess();
    } catch (err: any) {
      setError("Failed to register custom AI training item: " + err.message);
    } finally {
      setIsTeaching(false);
    }
  }, [learnedItems, impactStats]);

  const getCategoryImpact = (category: TrashCategory) => {
    switch (category) {
      case TrashCategory.RECYCLE: return { trees: 0.02, water: 1.5, co2: 0.3, points: 70 };
      case TrashCategory.ORGANIC: return { trees: 0, water: 0.2, co2: 0.15, points: 65 };
      case TrashCategory.ELECTRONIC: return { trees: 0, water: 5.0, co2: 1.2, points: 150 };
      case TrashCategory.TEXTILE: return { trees: 0, water: 2.5, co2: 0.8, points: 90 };
      case TrashCategory.HAZARDOUS: return { trees: 0, water: 0, co2: 0.1, points: 80 };
      case TrashCategory.REPAIR: return { trees: 0, water: 3.5, co2: 1.5, points: 100 };
      default: return { trees: 0, water: 0, co2: 0, points: 50 };
    }
  };

  const filterBoundedItems = (items: DetectedItem[]) => {
    return items.filter((item) => {
      if (!item || !item.item || !item.item.trim()) return false;
      if (item.boundingBox && Array.isArray(item.boundingBox) && item.boundingBox.length >= 4) {
        const [ymin, xmin, ymax, xmax] = item.boundingBox;
        if (isNaN(ymin) || isNaN(xmin) || isNaN(ymax) || isNaN(xmax)) return false;
        const centerX = (xmin + xmax) / 2;
        const centerY = (ymin + ymax) / 2;
        if (centerX < 15 || centerX > 985 || centerY < 15 || centerY > 985) return false;
        if (xmax <= xmin || ymax <= ymin) return false;
      }
      return true;
    });
  };

  const handleAnalyze = async (userFeedback?: string) => {
    triggerHaptic(100);
    if (isAnalyzing) return;
    
    let imageData = capturedImage;
    if (!imageData && !userFeedback) {
      imageData = captureFrame();
    }
    
    if (!imageData) return;

    setIsAnalyzing(true);
    if (userFeedback) {
      setIsSubmittingFeedback(true);
      setFeedback(userFeedback);
    } else {
      setFeedback(null);
    }
    
    setError(null);
    setItemLabel("");
    setCurrentItemImpact(null);
    setReason("");
    setCarbonImpact("");
    setConfidence(0);
    setGroundingLinks([]);
    sounds.playHoldSteady();

    try {
      let learnedPromptSection = "";
      if (learnedItems.length > 0) {
        const itemsList = learnedItems.map(item => `- "${item.name}" belongs strictly to ${item.category}`).join("\n");
        learnedPromptSection = `\n\nDYNAMIC KNOWLEDGE BASE MEMORY: The user has previously taught you the following specific categorizations. If the scanned image represents or matches any of these items, respect this user-taught knowledge and classify it accordingly:\n${itemsList}`;
      }

      const prompt = userFeedback 
        ? `The user says this item was identified incorrectly. User comment: "${userFeedback}". Re-identify all items in the scanned image taking the user's comment into account. STRICT FRAME BOUNDARY MANDATE: Perform item detection ONLY on physical items strictly located INSIDE the image frame boundaries [0-1000 scale]. DO NOT detect ambient background environment (floors, walls, distant furniture, room fixtures). Return a JSON object containing an array of 'items' where each item contains: 'item', 'category', 'confidence', 'reason', 'disposalInstructions', 'carbonImpact', 'materialGroup', 'boundingBox' (array of 4 numbers [ymin, xmin, ymax, xmax] 0-1000 scale), and 'diyProjects'. Keep all texts brief and concise.
In the 'reason' field of each item, provide:
1. A very short explanation of what the item is (strictly 1 sentence).
2. Exactly three concise, action-oriented bullet points (using '-' bullets) on separate lines (using newlines '\\n') labeled exactly as:
- **Recycle**: [Concise instruction on how and where to recycle, max 1 sentence]
- **Reuse**: [Concise suggestion on how to reuse, upcycle or repurpose, max 1 sentence]
- **Donate**: [Concise guidance on how or where to donate if usable, max 1 sentence]`
        : `STRICT CAMERA FRAME BOUNDARY DIRECTIVE:
You MUST ONLY detect and identify distinct waste, recyclable, or upcyclable physical items that are strictly WITHIN the visible image frame boundaries (coordinates [0,0] to [1000,1000]).
1. DO NOT detect ambient background environment (e.g., floors, walls, distant room furniture, shadows, ceiling, or room fixtures).
2. DO NOT detect or infer any object that is cut off or located outside the image frame boundaries.
3. Every detected item MUST have an accurate 2D 'boundingBox' exactly in this format: [ymin, xmin, ymax, xmax] (e.g., [100, 200, 500, 600]) where all 4 values are numbers normalized from 0 to 1000 scale.
4. If an object is not a distinct, identifiable waste or upcycling target located inside the frame, strictly IGNORE it.
5. If no item is clearly inside the frame boundaries, return an empty 'items' array: {"items": []}.

Scan the frame thoroughly to detect and identify ALL distinct items present INSIDE the frame bounds, even if they are small or of different types (e.g. if there is a shirt and a bottle inside the frame, identify both separately).
Classify each item into RECYCLE, ORGANIC, TRASH, HAZARDOUS, ELECTRONIC, TEXTILE, or REPAIR.
For each detected item, accurately pinpoint its 2D location with 'boundingBox': [ymin, xmin, ymax, xmax] normalized to 0-1000 scale. Set 'materialGroup' appropriately (e.g. 'Textiles & Apparel', 'Plastics & Containers', 'Paper & Cardboard', 'Organic & Food', 'E-Waste', 'Glass').
Return a JSON object with 'items' array where each item contains: 'item', 'category', 'confidence', 'reason', 'disposalInstructions', 'carbonImpact', 'materialGroup', 'boundingBox', and 'diyProjects'.
In the 'reason' field of each item, provide:
1. A very short explanation of what the item is (strictly 1 sentence).
2. Exactly three concise, action-oriented bullet points (using '-' bullets) on separate lines (using newlines '\\n') labeled exactly as:
- **Recycle**: [Concise instruction on how and where to recycle, max 1 sentence]
- **Reuse**: [Concise suggestion on how to reuse, upcycle or repurpose, max 1 sentence]
- **Donate**: [Concise guidance on how or where to donate if usable, max 1 sentence]
In the 'diyProjects' field of each item, you MUST ALWAYS provide an array of 2 to 3 creative, highly specific DIY upcycling or reuse projects for EVERY object detected (whether it is glass, plastic, metal, wood, textile, e-waste, cardboard, paper, organic waste, tire, tools, furniture, shoes, electronics, keys, etc.). Each project must have a 'title' (short descriptive name of the upcycling project) and 'description' (clear instructions on how to create the upcycled craft in 1-2 simple sentences).`;

      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data, prompt, learnedPromptSection }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await response.json();
      const textResponse = data.text;
      if (!textResponse) throw new Error("Empty response from AI");

      interface AnalysisResponse {
        items: DetectedItem[];
      }

      const result = safeParseAIJson<AnalysisResponse>(textResponse, { items: [] });

      if (!result.items || result.items.length === 0) {
        throw new Error("No items detected within the camera frame boundary. Please place your item clearly inside the frame.");
      }

      const boundedItems = filterBoundedItems(result.items);

      if (boundedItems.length === 0) {
        throw new Error("No items detected inside the camera frame boundary. Please position your item clearly within the frame.");
      }

      result.items = boundedItems;

      setDetectedItems(result.items);
      setSelectedItemIndex(0);

      const firstItem = result.items[0];

      setItemLabel(firstItem.item);
      const fullReason = `${firstItem.reason} ${firstItem.disposalInstructions || ''}`;
      setReason(fullReason);
      setCarbonImpact(firstItem.carbonImpact || "");
      setCurrentCategory(firstItem.category);
      setConfidence(firstItem.confidence || 0);
      setDiyProjects(firstItem.diyProjects || []);
      setIsAnalysisComplete(true);
      setIsAnalyzing(false);
      setIsSubmittingFeedback(false);

      if (imageData) {
        const historyItems: ScanHistoryItem[] = result.items.map((item, index) => ({
          id: `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          item: item.item,
          category: item.category,
          confidence: item.confidence || 0,
          timestamp: Date.now(),
          image: imageData,
          carbonImpact: item.carbonImpact || "",
          reason: `${item.reason} ${item.disposalInstructions || ''}`
        }));
        setScanHistory(prev => [...historyItems, ...prev].slice(0, 10));
      }

      let totalTrees = 0;
      let totalWater = 0;
      let totalCo2 = 0;
      let totalPoints = 0;

      let activeItemImpact = getCategoryImpact(result.items[0].category);

      result.items.forEach((item, index) => {
        const impact = getCategoryImpact(item.category);
        totalTrees += impact.trees;
        totalWater += impact.water;
        totalCo2 += impact.co2;
        totalPoints += impact.points;
      });

      setCurrentItemImpact({ treesSaved: activeItemImpact.trees, waterSaved: activeItemImpact.water, co2Reduced: activeItemImpact.co2 });

      setImpactStats(prev => {
        const newPoints = prev.points + totalPoints;
        const newLevel = Math.floor(newPoints / 1000) + 1;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        let newStreak = prev.streakCount || 0;
        const lastDateStr = prev.lastScannedDate;

        if (!lastDateStr) {
          newStreak = 1;
        } else if (lastDateStr === todayStr) {
          newStreak = newStreak || 1;
        } else {
          const lastDate = new Date(lastDateStr);
          const currentDate = new Date(todayStr);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        return {
          scannedCount: prev.scannedCount + result.items.length,
          treesSaved: prev.treesSaved + totalTrees,
          waterSaved: prev.waterSaved + totalWater,
          co2Reduced: prev.co2Reduced + totalCo2,
          points: newPoints,
          level: newLevel,
          streakCount: newStreak,
          lastScannedDate: todayStr
        };
      });

      setChallenges(prev => prev.map(challenge => {
        if (challenge.isCompleted) return challenge;

        let newCurrent = challenge.current;
        
        result.items.forEach(item => {
          if (challenge.category && challenge.category === item.category) {
            if (challenge.id === '2') {
              newCurrent += 2.5;
            } else {
              newCurrent += 1;
            }
          }
          if (challenge.id === '4') {
            newCurrent = Math.min(challenge.target, newCurrent + 0.25); 
          }
          if (challenge.id === '8') {
            newCurrent += 1;
          }
        });

        const isNowCompleted = newCurrent >= challenge.target;
        if (isNowCompleted && !challenge.isCompleted) {
          setImpactStats(s => ({ ...s, points: s.points + challenge.reward }));
          sounds.playSuccess();
        }

        return {
          ...challenge,
          current: Math.min(challenge.target, newCurrent),
          isCompleted: isNowCompleted
        };
      }));

      switch (firstItem.category) {
        case TrashCategory.RECYCLE: sounds.playRecycle(); break;
        case TrashCategory.ORGANIC: sounds.playOrganic(); break;
        case TrashCategory.TRASH: sounds.playTrash(); break;
        default: sounds.playSpecial(); break;
      }
      sounds.playSuccess();

    } catch (err: any) {
      console.error("Analysis error:", err);
      let userErrMsg = "Analysis failed. Please try again with a clearer view of the item.";
      if (err && typeof err === 'object') {
        userErrMsg = err.message || err.error?.message || err.error?.code || JSON.stringify(err);
      } else if (typeof err === 'string') {
        userErrMsg = err;
      }

      if (typeof userErrMsg === 'string' && (userErrMsg.includes("Load failed") || userErrMsg.includes("Failed to fetch") || userErrMsg.includes("NetworkError") || err.name === 'AbortError')) {
        userErrMsg = "Scan request timed out or network was interrupted. Please ensure a stable connection and try again.";
      }
      setError(userErrMsg);
      sounds.playError();
      setCapturedImage(null);
      setIsAnalyzing(false);
      setIsSubmittingFeedback(false);
    }
  };

  const handleFindCenters = useCallback(() => {
    if (!itemLabel) return;
    setDonationPreselection({ itemLabel, category: currentCategory });
    
    // Proactively fetch/refresh current location when the user requests finding a disposal center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => console.warn("Geolocation update failed:", err.message),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    
    setActiveTab('donation');
    sounds.playSuccess();
  }, [itemLabel, currentCategory]);

  const resetScanner = (full: boolean = true) => {
    setCapturedImage(null);
    setIsAnalysisComplete(false);
    setDetectedItems([]);
    setSelectedItemIndex(0);
    
    // Stop AI talking immediately
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
      setIsReadingAloud(false);
    }

    if (full) {
      setCurrentCategory(TrashCategory.UNKNOWN);
      setItemLabel("");
      setReason("");
      setCarbonImpact("");
      setConfidence(0);
      setGroundingLinks([]);
      setDiyProjects([]);
      setError(null);
      setShowEducation(false);
      setShowLocalInfo(false);
      setShowChallenges(false);
      setShowEcoLand(false);
    }
  };

  const handleAdvanceDiyChallenge = useCallback(() => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.isCompleted) return challenge;

      let newCurrent = challenge.current;
      
      if (challenge.id === '12') { // DIY Alchemist
        newCurrent += 1;
      }
      if (challenge.id === '13') { // Community Craft Guild
        newCurrent += 1;
      }

      const isNowCompleted = newCurrent >= challenge.target;
      if (isNowCompleted && !challenge.isCompleted) {
        // Add reward points
        setImpactStats(s => ({ ...s, points: s.points + challenge.reward }));
        sounds.playSuccess();
      }

      return {
        ...challenge,
        current: Math.min(challenge.target, newCurrent),
        isCompleted: isNowCompleted
      };
    }));
  }, []);

  const handleShareDiy = useCallback((title: string, item: string, category: TrashCategory) => {
    setPrefilledDiy({ title, item, category });
    setActiveTab('diy');
    sounds.playSuccess();
  }, []);

  const handleOpenDiyHubForItem = useCallback((item: string, category: TrashCategory, title?: string, description?: string) => {
    setPrefilledDiy({ 
      title: title || `Upcycled ${item}`, 
      item, 
      category,
      description: description || `Creative upcycling project for ${item}`
    });
    setActiveTab('diy');
    sounds.playSuccess();
  }, []);

  const handleOpenDonationHubForItem = useCallback((item: string, category: TrashCategory) => {
    setDonationPreselection({ itemLabel: item, category });
    setActiveTab('donation');
    sounds.playSuccess();
  }, []);

  const showSimulatedPhone = isPreviewDevice && !isMobileScreen;
  const useMobileLayout = isMobileScreen || showSimulatedPhone;

  return (
    <div className={`w-full ${
      useMobileLayout 
        ? 'h-screen h-[100dvh] overflow-hidden' 
        : 'min-h-screen overflow-y-auto'
    } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 dark:from-slate-900 via-slate-50 dark:via-slate-950 to-slate-100 dark:to-black select-none ${isDark ? 'dark' : 'light'}`}>
      
      {/* Top Controller Dashboard - Only on desktop */}
      {!isMobileScreen && (
        <div className="w-full max-w-[395px] mb-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-2.5 shadow-xl animate-in fade-in duration-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Publishable App Preview</span>
          </div>
          <button
            onClick={() => {
              setIsPreviewDevice(prev => !prev);
              sounds.playSuccess();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20 rounded-lg transition-all active:scale-95"
          >
            {isPreviewDevice ? (
              <>
                <Sparkles className="w-3 h-3 text-emerald-400" />
                🖥️ Web View
              </>
            ) : (
              <>
                <Bot className="w-3 h-3 text-emerald-400" />
                📱 Phone Mock
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Container - Phone chassis or full screen */}
      <div 
        className={`${
          showSimulatedPhone 
            ? 'relative w-[395px] h-[835px] rounded-[3.5rem] bg-slate-50 dark:bg-slate-950 border-[10px] border-slate-200 dark:border-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden ring-4 ring-slate-200/50 dark:ring-white/5' 
            : useMobileLayout
              ? 'w-full h-screen h-[100dvh] flex flex-col relative bg-slate-50 dark:bg-slate-950 overflow-hidden'
              : 'w-full min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950'
        } transition-all duration-500 ${isDark ? 'dark' : 'light'}`}
      >
        {/* iOS-Style status bar - Only in Phone Mock */}
        {showSimulatedPhone && (
          <div className="w-full h-11 bg-slate-950 px-6 shrink-0 flex items-center justify-between text-white select-none z-50 text-[11px] font-extrabold tracking-tight">
            {/* Left side: Time + Location dot */}
            <div className="flex items-center gap-1.5">
              <span>{timeStr}</span>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" title="Location GPS Active" />
            </div>

            {/* Dynamic Island / Notch */}
            <div className="w-24 h-5.5 bg-black rounded-full border border-white/5 flex items-center justify-center relative overflow-hidden" title="Simulated Dynamic Island">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-white/10 absolute left-3.5" />
              <div className="w-8 h-0.5 bg-slate-900 rounded-full absolute right-3.5" />
            </div>

            {/* Right side: Cellular, WiFi, Battery */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <svg className="w-3.5 h-2.5 text-white fill-current" viewBox="0 0 16 12">
                <rect x="0" y="9" width="1.5" height="3" rx="0.5" />
                <rect x="2.5" y="7" width="1.5" height="5" rx="0.5" />
                <rect x="5" y="5" width="1.5" height="7" rx="0.5" />
                <rect x="7.5" y="3" width="1.5" height="9" rx="0.5" />
                <rect x="10" y="1" width="1.5" height="11" rx="0.5" className="opacity-40" />
              </svg>
              <svg className="w-3 h-3 text-white stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeLinecap="round" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeLinecap="round" />
                <line x1="12" y1="20" x2="12.01" y2="20" strokeLinecap="round" />
              </svg>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">98%</span>
                <div className="w-4.5 h-2.5 border border-white/40 rounded px-0.5 py-px flex items-center">
                  <div className="w-full h-full bg-emerald-400 rounded-xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real App Interface */}
        <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full">
          <Header 
            isConnected={isCameraActive} 
            showReset={!!capturedImage && !isAnalyzing}
            onReset={() => resetScanner(true)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
          
          {/* Active Tab: SCANNER */}
          {activeTab === 'scan' && (
            <main className={`flex-1 flex flex-col ${
              useMobileLayout 
                ? 'w-full h-full overflow-y-auto gap-4 px-4 pt-4 pb-28' 
                : 'container mx-auto px-4 pt-24 pb-28 max-w-6xl flex flex-col lg:flex-row items-stretch lg:items-start gap-6 lg:gap-10'
            }`}>
              
              {/* Optical Engine Container (Camera/Image View) */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full ${
                  useMobileLayout 
                    ? 'aspect-[4/3] rounded-3xl shrink-0' 
                    : 'lg:flex-1 aspect-[4/3] sm:aspect-video lg:aspect-auto lg:h-[calc(100vh-14rem)] max-h-[60vh] lg:max-h-none rounded-[2.5rem]'
                } overflow-hidden bg-slate-900 border border-slate-800 transition-all duration-700 ${isDragging ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.01]' : 'ring-1 ring-white/10'} shadow-2xl`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
                
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className={`w-full h-full object-cover ${isCameraActive && !capturedImage ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                />

                {isCameraActive && !capturedImage && (
                  <>
                    {/* Top Left Target Badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 backdrop-blur-xl rounded-xl text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-emerald-400 border border-emerald-500/30 uppercase shadow-lg">
                      <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                      Scanner Active
                    </div>

                    {/* Top Right Mirror Button */}
                    <button
                      onClick={() => setIsMirrored(prev => !prev)}
                      className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white transition-all duration-300"
                      title="Mirror Camera view"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 shrink-0" />
                      Mirror: {isMirrored ? "ON" : "OFF"}
                    </button>

                    {/* Full Container Scanner Box Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
                      {/* Outer boundary frame styling for the entire container */}
                      <div className="absolute inset-2 sm:inset-3 rounded-[2rem] border-2 border-emerald-400/50 shadow-[inset_0_0_30px_rgba(16,185,129,0.15)]">
                        {/* Corner Accents outlining the full scanner container */}
                        <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                        <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />

                        {/* Moving Scan Line across the entire container */}
                        <motion.div 
                          className="absolute left-0 right-0 h-0.5 bg-emerald-400/90 shadow-[0_0_20px_rgba(52,211,153,0.9)]"
                          animate={{ top: ['2%', '98%', '2%'] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>

                      {/* Bottom Center Indicator Tag */}
                      <div className="absolute inset-x-0 bottom-16 sm:bottom-20 text-center pointer-events-none px-4">
                        <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-emerald-300 uppercase bg-slate-950/85 px-3 py-1 rounded-full border border-emerald-500/30 shadow-lg backdrop-blur-md">
                          Full View Scanner Field
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-xs space-y-4">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-1">Neural Analysis</h3>
                          <p className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-widest animate-pulse">Processing Visual Data...</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
                          <motion.div 
                            className="absolute top-0 bottom-0 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            animate={{ 
                              left: ["-100%", "100%"] 
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity, 
                              ease: "linear" 
                            }}
                            style={{ width: "50%" }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase tracking-tighter">
                          <span>Extracting Features</span>
                          <span>Classifying Material</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover" alt="Captured waste" />
                )}

                {/* Bounding box overlays for detected items strictly inside frame */}
                {capturedImage && detectedItems.length > 0 && isAnalysisComplete && !isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-auto z-20 overflow-hidden">
                    {detectedItems.map((item, idx) => {
                      if (!item.boundingBox || !Array.isArray(item.boundingBox) || item.boundingBox.length < 4) return null;
                      const [ymin, xmin, ymax, xmax] = item.boundingBox;
                      const isSelected = selectedItemIndex === idx;
                      const isHovered = hoveredItemIndex === idx;
                      
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectActiveItem(idx)}
                          onMouseEnter={() => setHoveredItemIndex(idx)}
                          onMouseLeave={() => setHoveredItemIndex(null)}
                          className={`absolute border-2 rounded-2xl transition-all duration-300 text-left focus:outline-none ${
                            isSelected 
                              ? 'border-emerald-400 bg-emerald-500/20 ring-4 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.5)] z-20' 
                              : isHovered 
                              ? 'border-amber-400 bg-amber-500/15 z-10' 
                              : 'border-white/50 bg-white/5 hover:border-emerald-300'
                          }`}
                          style={{
                            top: `${ymin / 10}%`,
                            left: `${xmin / 10}%`,
                            height: `${Math.max((ymax - ymin) / 10, 6)}%`,
                            width: `${Math.max((xmax - xmin) / 10, 6)}%`,
                          }}
                        >
                          <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider whitespace-nowrap shadow-xl border backdrop-blur-md transition-all flex items-center gap-1 ${
                            isSelected 
                              ? 'bg-emerald-500 text-slate-950 border-emerald-300 scale-105' 
                              : 'bg-slate-950/90 text-white border-white/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}`} />
                            {item.item}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {capturedImage && currentCategory === TrashCategory.UNKNOWN && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
                      <Scan className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1.5">Image Loaded</h3>
                    <p className="text-slate-300 text-[10px] font-medium mb-4 leading-relaxed max-w-[200px] mx-auto">
                      Ready for AI sorting analysis. Tap below to begin.
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-[180px]">
                      <button 
                        onClick={() => {
                          sounds.playShutter();
                          handleAnalyze();
                        }}
                        disabled={isAnalyzing}
                        className="group relative flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                      >
                        {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                        Identify Item
                      </button>
                      <button 
                        onClick={() => resetScanner(true)}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!isCameraActive && !isInitializingCamera && !capturedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 backdrop-blur-sm">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
                      <Camera className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h2 className="text-lg font-black mb-1.5 tracking-tight">EarthIQ Vision</h2>
                    <p className="text-slate-400 text-[10px] font-medium mb-5 leading-relaxed max-w-[200px] mx-auto">
                      Sort waste instantly with AI visual identification.
                    </p>
                    
                    <div className="flex flex-col gap-2.5 items-center justify-center w-full max-w-[220px]">
                      <button 
                        onClick={startCamera}
                        className="w-full group relative flex items-center justify-center gap-3 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                      >
                        <Scan className="w-4 h-4" />
                        Start Camera
                      </button>
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </button>
                    </div>
                  </div>
                )}

                {isInitializingCamera && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    <p className="text-[8px] font-black tracking-[0.4em] uppercase text-emerald-500/50">Waking Sensors...</p>
                  </div>
                )}

                {/* Mobile Camera Shutter Trigger button */}
                {isCameraActive && !capturedImage && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                    <button 
                      onClick={() => {
                        sounds.playShutter();
                        handleAnalyze();
                      }}
                      disabled={isAnalyzing}
                      className="group relative w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center p-1 hover:border-emerald-500/40 transition-all bg-black/40 backdrop-blur-xl disabled:opacity-50 active:scale-90 shadow-2xl"
                    >
                      <div className="w-full h-full rounded-full bg-white shadow-inner flex items-center justify-center overflow-hidden">
                        {isAnalyzing && <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />}
                        {!isAnalyzing && <div className="w-full h-full bg-white group-hover:bg-emerald-50 transition-colors" />}
                      </div>
                    </button>
                  </div>
                )}

                {error && (
                  <div className="absolute top-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl flex flex-col gap-3 shadow-2xl border border-rose-500/30 animate-in fade-in slide-in-from-top-4 z-50">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                          {error.toLowerCase().includes("camera") ? "Camera Access Notice" :
                           error.toLowerCase().includes("timed out") || error.toLowerCase().includes("network") || error.toLowerCase().includes("connection") ? "Network / Scan Notice" :
                           error.toLowerCase().includes("no item") ? "Item Placement Notice" : "Scanner Notice"}
                        </h4>
                        <p className="text-[9px] text-slate-300 font-bold leading-tight tracking-wide mt-0.5">{error}</p>
                      </div>
                      <button 
                        onClick={() => setError(null)} 
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button 
                        onClick={() => {
                          setError(null);
                          if (error.toLowerCase().includes("camera")) {
                            startCamera();
                          } else {
                            handleAnalyze();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-md"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                      <button 
                        onClick={() => {
                          setError(null);
                          fileInputRef.current?.click();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        <Upload className="w-3 h-3" />
                        Upload Photo
                      </button>
                      {window.self !== window.top && (
                        <a 
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-450 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open in New Tab
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Results Panel */}
              <div className={`w-full ${useMobileLayout ? '' : 'lg:w-[420px] shrink-0'} flex flex-col gap-4 pb-4`}>
                {detectedItems.length > 1 && (
                  <GroupedScanResults
                    items={detectedItems}
                    selectedIndex={selectedItemIndex}
                    onSelectItem={selectActiveItem}
                    hoveredIndex={hoveredItemIndex}
                    onHoverItem={setHoveredItemIndex}
                  />
                )}

                <ClassificationCard 
                  category={currentCategory}
                  item={itemLabel}
                  confidence={confidence}
                  reason={reason}
                  carbonImpact={carbonImpact}
                  locationAccess={!!userLocation}
                  links={groundingLinks}
                  isAnalyzing={isAnalyzing}
                  isSearchingCenters={isSearchingCenters}
                  onFindCenters={handleFindCenters}
                  isReadingAloud={false}
                  onReset={() => resetScanner(true)}
                  itemImpact={currentItemImpact || undefined}
                  onFeedback={handleAnalyze}
                  isSubmittingFeedback={isSubmittingFeedback}
                  feedback={feedback}
                  onTeachItem={handleTeachItem}
                  isTeaching={isTeaching}
                  userLocation={userLocation}
                  onOpenDiyHub={handleOpenDiyHubForItem}
                  onOpenDonationHub={handleOpenDonationHubForItem}
                />
              </div>
            </main>
          )}

          {/* Active Tab: ECO IMPACT */}
          {activeTab === 'impact' && (
            <main className={`flex-1 flex flex-col ${
              useMobileLayout 
                ? 'w-full h-full overflow-y-auto no-scrollbar gap-4 px-4 pt-4 pb-28' 
                : 'container mx-auto px-4 pt-24 pb-28 max-w-4xl gap-6'
            }`}>
              {showLocalInfo ? (
                <LocalInfo 
                  onClose={() => setShowLocalInfo(false)} 
                  location={userLocation}
                />
              ) : showChallenges ? (
                <CommunityChallenges 
                  challenges={challenges}
                  onClose={() => setShowChallenges(false)}
                  points={impactStats.points}
                  level={impactStats.level}
                />
              ) : showEcoLand ? (
                <EcoLand 
                  points={impactStats.points}
                  level={impactStats.level}
                  onClose={() => setShowEcoLand(false)}
                  onGainPoints={handleGainPoints}
                />
              ) : (
                <ImpactDashboard 
                  stats={impactStats} 
                  scanHistory={scanHistory}
                  challenges={challenges}
                  onClearHistory={() => {
                    setScanHistory([]);
                    sounds.playSuccess();
                  }}
                  onOpenLocalInfo={() => {
                    setShowLocalInfo(true);
                    setShowChallenges(false);
                    setShowEducation(false);
                    setShowEcoLand(false);
                  }}
                  onOpenChallenges={() => {
                    setShowChallenges(true);
                    setShowLocalInfo(false);
                    setShowEducation(false);
                    setShowEcoLand(false);
                  }}
                  onOpenEcoLand={() => {
                    setShowEcoLand(true);
                    setShowEducation(false);
                    setShowLocalInfo(false);
                    setShowChallenges(false);
                  }}
                />
              )}
            </main>
          )}



          {/* Active Tab: AI COACH */}
          {activeTab === 'coach' && (
            <main className={`flex-1 flex flex-col ${
              useMobileLayout 
                ? 'w-full h-full p-0 pb-28 overflow-hidden' 
                : 'container mx-auto px-4 pt-24 pb-28 max-w-4xl h-[calc(100vh-14rem)]'
            }`}>
              <EcoChatbot />
            </main>
          )}

          {/* Active Tab: DONATIONS */}
          {activeTab === 'donation' && (
            <main className={`flex-1 flex flex-col ${
              useMobileLayout 
                ? 'w-full h-full p-0 pb-28 overflow-hidden' 
                : 'container mx-auto px-4 pt-24 pb-28 max-w-7xl h-[calc(100vh-14rem)]'
            }`}>
              <DonationMap 
                userLocation={userLocation} 
                initialItemLabel={donationPreselection?.itemLabel}
                initialCategory={donationPreselection?.category}
                onLocationUpdate={(loc) => setUserLocation(loc)}
              />
            </main>
          )}

          {/* Active Tab: HISTORY */}
          {activeTab === 'history' && (
            <main className={`flex-1 flex flex-col w-full ${
              useMobileLayout 
                ? 'px-4 pt-4 pb-28 overflow-y-auto touch-pan-y bg-transparent' 
                : 'container mx-auto px-4 pt-24 pb-28 max-w-4xl overflow-y-auto touch-pan-y bg-transparent min-h-[calc(100vh-14rem)]'
            }`}>
              <ScanHistoryView 
                scanHistory={scanHistory}
                onClearHistory={handleClearHistory}
                expandedItemId={expandedHistoryItemId}
                toggleExpandItem={toggleExpandHistoryItem}
              />
            </main>
          )}

          {/* Active Tab: INFO HUB */}
          {activeTab === 'diy' && (
            <main className={`flex-1 flex flex-col w-full ${
              useMobileLayout 
                ? 'px-4 pt-4 pb-28 overflow-y-auto touch-pan-y bg-transparent' 
                : 'container mx-auto px-4 pt-24 pb-28 max-w-4xl overflow-y-auto touch-pan-y bg-transparent min-h-[calc(100vh-14rem)]'
            }`}>
              <DIYHub 
                prefilled={prefilledDiy}
                onClearPrefilled={() => setPrefilledDiy(null)}
                points={impactStats.points}
                onGainPoints={handleGainPoints}
                onAdvanceDiyChallenge={handleAdvanceDiyChallenge}
                challenges={challenges}
                isDark={isDark}
              />
            </main>
          )}

          {/* Native Mobile-Style Bottom Tab Bar */}
          <div 
            className={`${
              showSimulatedPhone 
                ? 'absolute bottom-0 pb-5 pt-2 h-20' 
                : 'fixed bottom-0 pb-safe pb-4 pt-2 h-20'
            } left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-4 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-500`}
            style={{ contentVisibility: 'auto' }}
          >
            <button
              onClick={() => {
                setActiveTab('scan');
                triggerHaptic(30);
                sounds.playSuccess();
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-all active:scale-95 ${
                activeTab === 'scan' 
                  ? 'text-emerald-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Scan className="w-4 h-4 transition-transform duration-300" />
                {activeTab === 'scan' && (
                  <span className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xs" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Scanner</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('impact');
                triggerHaptic(30);
                sounds.playSuccess();
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-all active:scale-95 ${
                activeTab === 'impact' 
                  ? 'text-emerald-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Trophy className="w-4 h-4 transition-transform duration-300" />
                {activeTab === 'impact' && (
                  <span className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xs" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Eco Impact</span>
            </button>


            <button
              onClick={() => {
                setActiveTab('diy');
                triggerHaptic(30);
                sounds.playSuccess();
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-all active:scale-95 ${
                activeTab === 'diy' 
                  ? 'text-amber-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-4 h-4 transition-transform duration-300" />
                {activeTab === 'diy' && (
                  <span className="absolute -inset-1 bg-amber-500/10 rounded-full blur-xs" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Info Hub</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                triggerHaptic(30);
                sounds.playSuccess();
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-all active:scale-95 ${
                activeTab === 'history' 
                  ? 'text-emerald-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Clock className="w-4 h-4 transition-transform duration-300" />
                {activeTab === 'history' && (
                  <span className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xs" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">History</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('coach');
                triggerHaptic(30);
                sounds.playSuccess();
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-all active:scale-95 ${
                activeTab === 'coach' 
                  ? 'text-emerald-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Bot className="w-4 h-4 transition-transform duration-300" />
                {activeTab === 'coach' && (
                  <span className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xs" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">AI Coach</span>
            </button>

            <button
              onClick={() => {
                setDonationPreselection(null);
                setActiveTab('donation');
                triggerHaptic(30);
                sounds.playSuccess();
              }}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-0.5 transition-all active:scale-95 ${
                activeTab === 'donation' 
                  ? 'text-emerald-400 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Map className="w-4 h-4 transition-transform duration-300" />
                {activeTab === 'donation' && (
                  <span className="absolute -inset-1 bg-emerald-500/10 rounded-full blur-xs" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Donations</span>
            </button>
          </div>

          {/* Apple / Android Home swipe bar - Only inside simulated phone frame */}
          {showSimulatedPhone && (
            <div className="absolute bottom-1.5 left-0 right-0 h-1.5 flex justify-center pointer-events-none z-50">
              <div className="w-24 h-1 bg-white/20 rounded-full" />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {currentCategory === TrashCategory.UNKNOWN && capturedImage && !isAnalyzing && isAnalysisComplete && (
          <UnidentifiedPopup 
            onClose={() => resetScanner(true)}
            onTeachItem={handleTeachItem}
            isTeaching={isTeaching}
            feedback={feedback}
          />
        )}
      </AnimatePresence>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
