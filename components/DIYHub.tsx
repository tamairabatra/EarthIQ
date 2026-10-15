import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Trophy, Heart, Share2, Plus, Camera, Image as ImageIcon, 
  Trash2, Shirt, Zap, Leaf, Droplets, CheckCircle2, User, Award, ArrowRight, HelpCircle,
  FlipHorizontal, RefreshCcw, Bot, Clock, Lightbulb, X, Loader2, Wrench, Search
} from 'lucide-react';
import { TrashCategory, DIYPost, Challenge, ImpactStats } from '../types';
import { sounds } from '../utils/sound-effects';

interface DIYHubProps {
  prefilled: { item: string; category: TrashCategory; title: string; description?: string } | null;
  onClearPrefilled: () => void;
  points: number;
  onGainPoints: (pts: number) => void;
  onAdvanceDiyChallenge: () => void;
  challenges: Challenge[];
  isDark: boolean;
}

const DEFAULT_POSTS: DIYPost[] = [
  {
    id: 'post-new-0',
    title: 'Milk Carton Desk Organizer',
    item: 'Plastic Milk Carton',
    category: TrashCategory.RECYCLE,
    description: 'Cut the top off a clean milk carton, wrap it in decorative paper or paint it, and use it to store pens, scissors, and other desk supplies.',
    image: '/milk_carton_desk_organizer.jpg',
    author: 'EarthIQ Team',
    timestamp: Date.now(),
    likes: 120,
    pointsEarned: 150
  },
  {
    id: 'post-1',
    title: 'Self-Watering Herb Planters',
    item: 'Plastic Soda Bottles',
    category: TrashCategory.RECYCLE,
    description: 'Cut the bottles in half, flip the top neck-down into the bottom base, thread a cotton wick through the cap, and fill with soil. Perfect for growing basil on window sills!',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    author: 'Elena Green',
    timestamp: Date.now() - 3600000 * 4,
    likes: 42,
    pointsEarned: 150
  },
  {
    id: 'post-2',
    title: 'Braided Canine Pull Toy',
    item: 'Old Cotton T-Shirts',
    category: TrashCategory.TEXTILE,
    description: 'Sliced three old stained t-shirts into 2-inch wide strips, braided them tightly together, and knotted both ends securely. Safe, washable, and completely upcycled!',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80',
    author: 'Marcus Craft',
    timestamp: Date.now() - 3600000 * 18,
    likes: 29,
    pointsEarned: 150
  },
  {
    id: 'post-3',
    title: 'Vintage Kitchen Spice Containers',
    item: 'Glass Jam Jars',
    category: TrashCategory.RECYCLE,
    description: 'Soaked glass jars to remove labels, spray-painted the lids chalky black, and wrote spice labels with a white paint marker. Beautiful zero-waste pantry storage!',
    image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80',
    author: 'Sophia Chen',
    timestamp: Date.now() - 3600000 * 32,
    likes: 56,
    pointsEarned: 150
  }
];

export const DIYHub: React.FC<DIYHubProps> = ({ 
  prefilled, 
  onClearPrefilled, 
  points, 
  onGainPoints, 
  onAdvanceDiyChallenge,
  challenges,
  isDark
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'post'>('feed');
  const [posts, setPosts] = useState<DIYPost[]>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_diy_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((p: DIYPost) => {
          if (p.id === 'post-new-0' || p.title.toLowerCase().includes('milk carton')) {
            return { ...p, image: '/milk_carton_desk_organizer.jpg' };
          }
          return p;
        });
        if (!updated.some((p: DIYPost) => p.id === 'post-new-0' || p.title.toLowerCase().includes('milk carton'))) {
          return [DEFAULT_POSTS[0], ...updated];
        }
        return updated;
      }
      return DEFAULT_POSTS;
    } catch (e) {
      return DEFAULT_POSTS;
    }
  });

  // Form states
  const [title, setTitle] = useState('');
  const [item, setItem] = useState('');
  const [category, setCategory] = useState<TrashCategory>(TrashCategory.RECYCLE);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [author, setAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCelebration, setSuccessCelebration] = useState(false);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  // AI DIY Tutorial generation states
  const [generatingTutorialId, setGeneratingTutorialId] = useState<string | null>(null);
  const [activeTutorial, setActiveTutorial] = useState<{
    title: string;
    item: string;
    materialsNeeded: string[];
    difficulty: string;
    estimatedTime: string;
    steps: string[];
    tips: string[];
    imageUrl?: string;
  } | null>(null);
  const [tutorialError, setTutorialError] = useState<string | null>(null);

  // DIY Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    id: string;
    title: string;
    description: string;
    category: TrashCategory;
    item: string;
  }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Frequently opened state
  const [frequentlyOpened, setFrequentlyOpened] = useState<{
    id: string;
    title: string;
    item: string;
    description: string;
    category: TrashCategory;
    image?: string;
    openedCount: number;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('ecoscan_frequently_opened');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const trackOpen = (proj: { id: string; title: string; item: string; description: string; category: TrashCategory; image?: string }) => {
    setFrequentlyOpened(prev => {
      const existingIndex = prev.findIndex(item => item.id === proj.id || (item.title === proj.title && item.item === proj.item));
      let updated = [...prev];
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          openedCount: updated[existingIndex].openedCount + 1
        };
      } else {
        updated.push({
          id: proj.id || `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: proj.title,
          item: proj.item,
          description: proj.description,
          category: proj.category,
          image: proj.image,
          openedCount: 1
        });
      }
      updated.sort((a, b) => b.openedCount - a.openedCount);
      localStorage.setItem('ecoscan_frequently_opened', JSON.stringify(updated));
      return updated;
    });
  };

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    setIsSearching(true);
    setSearchError(null);
    sounds.playHoldSteady();

    try {
      const response = await fetch("/api/diy-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: query.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to search DIY projects");
      }

      const data = await response.json();
      const mappedResults = (data.projects || []).map((p: any, idx: number) => ({
        id: `search-${encodeURIComponent(p.title)}-${idx}`,
        title: p.title,
        description: p.description,
        category: (p.category as TrashCategory) || TrashCategory.RECYCLE,
        item: query.trim(),
      }));

      setSearchResults(mappedResults);
      if (mappedResults.length === 0) {
        setSearchError(`No direct upcycling projects found for "${query}". Try searching for materials like "bottle", "fabric", "paper", etc.`);
      } else {
        sounds.playSuccess();
      }
    } catch (err: any) {
      console.error("Error searching DIY projects:", err);
      setSearchError("Could not connect to upcycling search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchDIYs = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleGenerateTutorial = async (proj: { id: string; title: string; item: string; description: string; category: TrashCategory; image?: string }) => {
    // Instant pre-generated tutorial support for Milk Carton Desk Organizer
    if (proj.id === 'post-new-0' || proj.title.toLowerCase().includes('milk carton')) {
      setActiveTutorial({
        title: 'Milk Carton Desk Organizer',
        item: 'Plastic Milk Carton',
        materialsNeeded: [
          '1 Clean plastic milk carton or jug (rinsed & dried)',
          'Utility scissors or craft hobby knife',
          'Jute twine / hemp rope (for rim & nozzle wrap)',
          'Turquoise / pastel non-toxic acrylic craft paint',
          'Wooden craft beads & fine gold paint pen / markers',
          'Craft glue or hot glue gun'
        ],
        difficulty: 'Easy (Beginner Friendly)',
        estimatedTime: '20 mins',
        steps: [
          'Step 1: Prep & Clean — Thoroughly rinse out the milk carton with warm soapy water and peel off any plastic labeling. Allow to dry completely.',
          'Step 2: Measure & Cut — Lay the carton on its side. Using utility scissors or a craft blade, carefully cut open a rectangular compartment across the top face to form your organizer slot, keeping the handle and pouring spout intact.',
          'Step 3: Paint & Letter — Apply 1-2 coats of pastel turquoise acrylic paint across the outer surface. Once dry, write "ORGANIZE!" or paint floral branch motifs with a fine gold paint marker.',
          'Step 4: Twine & Bead Trim — Wrap natural jute twine neatly around the top cut rim and the threaded nozzle, securing with craft glue. Thread small wooden beads onto the twine for rustic charm.',
          'Step 5: Fill & Enjoy — Place your pens, pencils, highlighters, scissors, and rulers in their new compartments on your desk!'
        ],
        tips: [
          'Lightly scuff smooth plastic with fine sandpaper before painting so acrylic adheres evenly.',
          'For extra desk stability, place 2-3 small decorative clean pebbles inside the bottom base.',
          'Use the side nozzle ring as a handy holder for paperclips, USB drives, or tape loops.'
        ],
        imageUrl: proj.image || '/milk_carton_desk_organizer.jpg',
      });
      trackOpen(proj);
      sounds.playSuccess();
      return;
    }

    setGeneratingTutorialId(proj.id);
    setTutorialError(null);
    sounds.playHoldSteady();
    try {
      const response = await fetch("/api/diy-tutorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: proj.title,
          item: proj.item,
          description: proj.description,
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
        title: proj.title,
        item: proj.item,
        materialsNeeded: parsed.materialsNeeded || [],
        difficulty: parsed.difficulty || "Medium",
        estimatedTime: parsed.estimatedTime || "30 mins",
        steps: parsed.steps || [],
        tips: parsed.tips || [],
        imageUrl: proj.image || parsed.imageUrl,
      });
      
      // Track that this tutorial was successfully opened
      trackOpen(proj);
      
      sounds.playSuccess();
    } catch (err: any) {
      console.error("Error generating tutorial:", err);
      setTutorialError("Could not generate DIY tutorial. Please try again.");
    } finally {
      setGeneratingTutorialId(null);
    }
  };

  // DIY Camera integration states
  const [diyCameraMode, setDiyCameraMode] = useState<'file' | 'camera'>('file');
  const [isDiyCameraActive, setIsDiyCameraActive] = useState(false);
  const [isDiyCameraInitializing, setIsDiyCameraInitializing] = useState(false);
  const [diyFacingMode, setDiyFacingMode] = useState<'user' | 'environment'>('environment');
  const [diyIsMirrored, setDiyIsMirrored] = useState(false);
  const [diyCameraError, setDiyCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const diyVideoRef = useRef<HTMLVideoElement>(null);
  const diyCanvasRef = useRef<HTMLCanvasElement>(null);
  const diyStreamRef = useRef<MediaStream | null>(null);

  const stopDiyCamera = () => {
    if (diyStreamRef.current) {
      diyStreamRef.current.getTracks().forEach(track => track.stop());
      diyStreamRef.current = null;
    }
    if (diyVideoRef.current) {
      diyVideoRef.current.srcObject = null;
    }
    setIsDiyCameraActive(false);
  };

  const startDiyCamera = async (mode: 'user' | 'environment' = diyFacingMode) => {
    if (isDiyCameraInitializing) return;
    setIsDiyCameraInitializing(true);
    setDiyCameraError(null);
    stopDiyCamera(); // Clean stop first

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn("DIY Camera custom constraints failed, trying basic fallback...", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      diyStreamRef.current = stream;
      if (diyVideoRef.current) {
        diyVideoRef.current.srcObject = stream;
        diyVideoRef.current.onloadedmetadata = () => {
          diyVideoRef.current?.play().catch(e => console.error("DIY Video play error:", e));
        };
      }
      setIsDiyCameraActive(true);
      setDiyFacingMode(mode);
      setDiyIsMirrored(mode === 'user');
    } catch (err: any) {
      console.warn("DIY Camera status info:", err.message || err);
      let msg = "Could not access camera.";
      if (err.name === 'NotAllowedError') msg = "Camera permission denied. Please allow camera access.";
      else if (err.name === 'NotFoundError') msg = "No camera found on this device.";
      setDiyCameraError(msg);
    } finally {
      setIsDiyCameraInitializing(false);
    }
  };

  const toggleDiyFacingMode = () => {
    const nextMode = diyFacingMode === 'environment' ? 'user' : 'environment';
    setDiyFacingMode(nextMode);
    if (isDiyCameraActive) {
      startDiyCamera(nextMode);
    }
  };

  const captureDiyFrame = () => {
    if (!diyVideoRef.current || !diyCanvasRef.current) return;
    const video = diyVideoRef.current;
    const canvas = diyCanvasRef.current;

    if (video.readyState < 2) {
      setDiyCameraError("Camera feed not ready yet.");
      return;
    }

    canvas.width = 640;
    canvas.height = (video.videoHeight / video.videoWidth) * 640;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (diyIsMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImage(dataUrl);
    stopDiyCamera();
    sounds.playSuccess();
  };

  // Safely cleanup camera track resource on component lifecycle transitions
  useEffect(() => {
    return () => {
      stopDiyCamera();
    };
  }, []);

  useEffect(() => {
    if (activeSubTab !== 'post') {
      stopDiyCamera();
    }
  }, [activeSubTab]);

  const lastPrefilledRef = useRef<string | null>(null);

  // If there is a prefilled item from the scan results, prepopulate search and show top search results first!
  useEffect(() => {
    if (prefilled) {
      const key = `${prefilled.item}-${prefilled.title}-${prefilled.description || ''}`;
      if (lastPrefilledRef.current !== key) {
        lastPrefilledRef.current = key;
        setTitle(prefilled.title || '');
        setItem(prefilled.item || '');
        setCategory(prefilled.category);
        setActiveSubTab('feed');
        
        const queryToSearch = prefilled.item || prefilled.title || '';
        if (queryToSearch) {
          setSearchQuery(queryToSearch);
          // Add a small delay to ensure state updates have propagated
          setTimeout(() => executeSearch(queryToSearch), 100);
        }
      }
    }
  }, [prefilled]);

  const savePosts = (newPosts: DIYPost[]) => {
    setPosts(newPosts);
    localStorage.setItem('ecoscan_diy_posts', JSON.stringify(newPosts));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLikePost = (id: string) => {
    if (likedPosts.includes(id)) {
      setLikedPosts(prev => prev.filter(pId => pId !== id));
      savePosts(posts.map(p => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPosts(prev => [...prev, id]);
      savePosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
      sounds.playSuccess();
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !item.trim() || !description.trim()) return;

    setIsSubmitting(true);
    sounds.playHoldSteady();

    // Simulate upload / curation verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Choose a fallback upcycle-relevant stock image if no image was uploaded
    let finalImage = image;
    if (!finalImage) {
      if (category === TrashCategory.RECYCLE) {
        finalImage = 'https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?auto=format&fit=crop&w=600&q=80'; // Green jars/bottles
      } else if (category === TrashCategory.TEXTILE) {
        finalImage = 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80'; // Fabrics/wool
      } else if (category === TrashCategory.ORGANIC) {
        finalImage = 'https://images.unsplash.com/photo-1595181745480-1a74d28cc887?auto=format&fit=crop&w=600&q=80'; // Planter pot
      } else {
        finalImage = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80'; // Creativity background
      }
    }

    const newPost: DIYPost = {
      id: `post-${Date.now()}`,
      title: title.trim(),
      item: item.trim(),
      category: category,
      description: description.trim(),
      image: finalImage,
      author: author.trim() || 'Eco Craft Creator',
      timestamp: Date.now(),
      likes: 0,
      pointsEarned: 150
    };

    const updatedPosts = [newPost, ...posts];
    savePosts(updatedPosts);

    // Give points!
    onGainPoints(150);

    // Advance DIY Alchemist personal challenge & community challenge
    onAdvanceDiyChallenge();

    sounds.playSuccess();
    setSuccessCelebration(true);
    setIsSubmitting(false);

    // Clear form
    setTitle('');
    setItem('');
    setCategory(TrashCategory.RECYCLE);
    setDescription('');
    setImage(null);
    setAuthor('');
    onClearPrefilled();
  };

  const getCategoryDetails = (cat: TrashCategory) => {
    switch (cat) {
      case TrashCategory.RECYCLE:
        return { label: 'Recyclables', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Trash2 className="w-3.5 h-3.5" /> };
      case TrashCategory.ORGANIC:
        return { label: 'Organics', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <Leaf className="w-3.5 h-3.5" /> };
      case TrashCategory.ELECTRONIC:
        return { label: 'Electronics', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: <Zap className="w-3.5 h-3.5" /> };
      case TrashCategory.TEXTILE:
        return { label: 'Textiles', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <Shirt className="w-3.5 h-3.5" /> };
      case TrashCategory.REPAIR:
        return { label: 'Repairables', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: <Award className="w-3.5 h-3.5" /> };
      default:
        return { label: 'General', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <HelpCircle className="w-3.5 h-3.5" /> };
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-full bg-transparent">
      {/* Top Header info */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Upcycle Info Hub</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Share Crafts • Divert Waste • Gain Points</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 shrink-0 self-start sm:self-auto">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Upcycle Score</p>
            <p className="text-xs font-black text-white">{points} pts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/70 p-1.5 rounded-2xl border border-white/10 mb-5 shrink-0 shadow-xl gap-2 items-center">
        <button
          onClick={() => {
            setActiveSubTab('feed');
            onClearPrefilled();
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'feed'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Upcycle Feed
        </button>
        <button
          onClick={() => setActiveSubTab('post')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'post'
              ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Post Craft (+150)
        </button>
      </div>

      <div className="flex-1 space-y-5 pb-8">
        <AnimatePresence mode="wait">
          {activeSubTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* AI Upcycle Search Section */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">Search DIY Projects & Upcycling Ideas</h3>
                      <p className="text-[10px] text-slate-300 font-bold">Search any household item or material to find step-by-step DIY upcycling guides</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSearchDIYs} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type an item (e.g. Glass Bottle, Old Denim, Cardboard Box, Tin Can)..."
                      className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 rounded-2xl pl-10 pr-8 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all font-bold shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Searching DIY...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Search DIY Projects</span>
                      </>
                    )}
                  </button>
                </form>


                {searchError && (
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{searchError}</p>
                )}

                {/* Search Results rendering */}
                {searchResults.length > 0 && (
                  <div className="pt-3 space-y-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" /> Upcycling Projects for "{searchQuery}"
                      </span>
                      <button
                        onClick={() => {
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Clear Results
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {searchResults.map((result) => {
                        const resultCatDetails = getCategoryDetails(result.category);
                        const isGeneratingThis = generatingTutorialId === result.id;
                        return (
                          <div
                            key={result.id}
                            className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-400/50 transition-all shadow-md group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded-md ${resultCatDetails.color}`}>
                                  {resultCatDetails.label}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors leading-snug">{result.title}</h4>
                              <p className="text-[10px] text-slate-300 font-medium leading-relaxed line-clamp-3">{result.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerateTutorial({
                                id: result.id,
                                title: result.title,
                                item: result.item,
                                description: result.description,
                                category: result.category
                              })}
                              disabled={generatingTutorialId !== null}
                              className="w-full py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer shadow-sm"
                            >
                              {isGeneratingThis ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-slate-950" />
                                  Generating Guide...
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3 h-3 text-slate-950" />
                                  View AI Step-by-Step Guide
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Frequently Opened DIY Section */}
              {frequentlyOpened.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Frequently Opened Tutorials</h3>
                    </div>
                    <button
                      onClick={() => {
                        setFrequentlyOpened([]);
                        localStorage.removeItem('ecoscan_frequently_opened');
                      }}
                      className="text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-all"
                    >
                      Clear History
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {frequentlyOpened.slice(0, 4).map((opened) => {
                      const openedCatDetails = getCategoryDetails(opened.category);
                      const isGeneratingThis = generatingTutorialId === opened.id;
                      return (
                        <div
                          key={opened.id}
                          className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest border rounded ${openedCatDetails.color}`}>
                                {openedCatDetails.label}
                              </span>
                              <span className="text-[7px] text-white/30 font-black uppercase tracking-widest">
                                {opened.openedCount} Open{opened.openedCount > 1 ? 's' : ''}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white truncate">{opened.title}</h4>
                            <p className="text-[9px] text-white/40 font-bold truncate">For: {opened.item}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGenerateTutorial({
                              id: opened.id,
                              title: opened.title,
                              item: opened.item,
                              description: opened.description,
                              category: opened.category,
                              image: opened.image
                            })}
                            disabled={generatingTutorialId !== null}
                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-400 border border-emerald-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-1"
                          >
                            {isGeneratingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                            ) : (
                              <>
                                <Wrench className="w-3 h-3" />
                                Open
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shared Feed cards */}
              <div className="space-y-4">
                {posts.map((post) => {
                  const catDetails = getCategoryDetails(post.category);
                  const isLiked = likedPosts.includes(post.id);
                  return (
                    <motion.div
                      key={post.id}
                      layoutId={`post-card-${post.id}`}
                      className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-xl"
                    >
                      <div className="aspect-video w-full relative">
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border rounded-xl flex items-center gap-1.5 ${catDetails.color}`}>
                            {catDetails.icon}
                            {catDetails.label}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-white/10 text-amber-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Earned +{post.pointsEarned} XP
                        </div>
                        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-black text-white tracking-tight">{post.title}</h3>
                            <p className="text-[10px] font-bold text-white/40">
                              Upcycled from: <strong className="text-white/70 font-black">{post.item}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-300">{post.author}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                          {post.description}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${
                                isLiked
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                              {post.likes} Hearts
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleGenerateTutorial(post)}
                              disabled={generatingTutorialId !== null}
                              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/25 disabled:opacity-50 transition-all active:scale-95"
                            >
                              {generatingTutorialId === post.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  BUILDING...
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                                  AI Tutorial
                                </>
                              )}
                            </button>
                          </div>
                          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeSubTab === 'post' && (
            <motion.div
              key="post"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmitPost} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-white/5 pb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Post Your Upcycled Project</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Project Title</label>
                    <input 
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Self-Watering Soda Bottle Herb Planter..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Item Upcycled</label>
                      <input 
                        type="text"
                        required
                        value={item}
                        onChange={(e) => setItem(e.target.value)}
                        placeholder="e.g. 2L Sprite Bottle, Old Linen Bed Sheet..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Trash Material Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TrashCategory)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/50 transition-all font-bold"
                      >
                        <option value={TrashCategory.RECYCLE} className="bg-slate-900 text-white">Recyclables (Bottles, Glass, Cans)</option>
                        <option value={TrashCategory.TEXTILE} className="bg-slate-900 text-white">Textiles (Clothing, T-Shirts, Fabric)</option>
                        <option value={TrashCategory.ORGANIC} className="bg-slate-900 text-white">Organics (Food scraps, Cardboard)</option>
                        <option value={TrashCategory.ELECTRONIC} className="bg-slate-900 text-white">Electronics (Cables, Old Phones)</option>
                        <option value={TrashCategory.REPAIR} className="bg-slate-900 text-white">Other Repair / Wood / Plastic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">My Nickname (Optional)</label>
                    <input 
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. UpcycleQueen, GreenEcoLover..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">DIY Instructions & Description</label>
                    <textarea 
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe what materials you used and 1-2 steps of how to craft this upcycled masterpiece!"
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 transition-all font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1.5">Attach DIY Craft Photo</label>
                    
                    {/* Capture Mode Toggle Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 mb-3.5 max-w-[280px]">
                      <button
                        type="button"
                        onClick={() => {
                          setDiyCameraMode('file');
                          stopDiyCamera();
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          diyCameraMode === 'file'
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiyCameraMode('camera');
                          startDiyCamera('environment');
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          diyCameraMode === 'camera'
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Camera className="w-3 h-3" />
                        Live Camera
                      </button>
                    </div>

                    {/* Photo Container based on Mode */}
                    {diyCameraMode === 'file' ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-2xl p-5 hover:border-amber-400/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 bg-black/10 hover:bg-black/20"
                      >
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        {image ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                            <img src={image} alt="Uploaded project" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImage(null);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white border border-white/10 text-[9px] font-black tracking-widest uppercase"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                              <ImageIcon className="w-5 h-5 text-white/40" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-white">Click to select craft photo</p>
                              <p className="text-[8px] font-bold text-white/30 uppercase tracking-wider mt-0.5">Supports PNG, JPG, or WEBP</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      // Live Camera Capture Block
                      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center">
                        <canvas ref={diyCanvasRef} className="hidden" />

                        {image ? (
                          // If snapshot is captured
                          <div className="relative w-full h-full">
                            <img src={image} alt="Captured project snapshot" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setImage(null);
                                  startDiyCamera();
                                }}
                                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                Retake Photo
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setImage(null)}
                              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white border border-white/10 text-[9px] font-black tracking-widest uppercase"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          // Live camera preview active
                          <>
                            <video
                              ref={diyVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover ${isDiyCameraActive ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
                              style={{ transform: diyIsMirrored ? 'scaleX(-1)' : 'none' }}
                            />

                            {/* Camera controls overlay */}
                            {isDiyCameraActive && (
                              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2 items-center">
                                {/* Capture Snapshot Button */}
                                <button
                                  type="button"
                                  onClick={captureDiyFrame}
                                  className="w-12 h-12 bg-white hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 relative"
                                  title="Take photo of your craft"
                                >
                                  <Camera className="w-5 h-5 text-slate-950" />
                                  <span className="absolute -inset-1 border border-white/40 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                                </button>
                                
                                <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest">
                                  <button
                                    type="button"
                                    onClick={toggleDiyFacingMode}
                                    className="text-white/80 hover:text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1"
                                  >
                                    <RefreshCcw className="w-3 h-3" />
                                    Flip Camera
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDiyIsMirrored(prev => !prev)}
                                    className="text-white/80 hover:text-white bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1"
                                  >
                                    <FlipHorizontal className="w-3 h-3" />
                                    Mirror: {diyIsMirrored ? "ON" : "OFF"}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Camera Loading/Status indicators */}
                            {!isDiyCameraActive && !diyCameraError && (
                              <div className="flex flex-col items-center gap-2">
                                <Plus className="w-8 h-8 text-amber-400 animate-spin" />
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Initializing Camera Stream...</p>
                              </div>
                            )}

                            {diyCameraError && (
                              <div className="p-4 text-center space-y-2">
                                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">{diyCameraError}</p>
                                <button
                                  type="button"
                                  onClick={() => startDiyCamera()}
                                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                  Retry Connection
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Plus className="w-4 h-4 animate-spin" />
                        PUBLISHING...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        SHARE DIY & EARN +150 PTS
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('feed');
                      onClearPrefilled();
                    }}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Celebration Popup Modal */}
      <AnimatePresence>
        {successCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] p-6 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-widest text-white">Upcycle Accomplished!</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mt-1">Earned +150 Reward Points</p>
                </div>
                <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                  Your creative DIY upcycling project has been successfully published to the Eco Community Feed. Other eco-warriors can now draw inspiration from your sustainable craft!
                </p>

                <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Challenge Updates</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-white/70">
                      <span>DIY Alchemist Goal:</span>
                      <span className="text-emerald-400">+1 Step Completed</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-white/70">
                      <span>Global Drive:</span>
                      <span className="text-purple-400">+1 Community Scan/Upcycle</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSuccessCelebration(false);
                    setActiveSubTab('feed');
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  Awesome, View Feed
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI DIY Tutorial Overlay Modal */}
      <AnimatePresence>
        {(activeTutorial || generatingTutorialId !== null || tutorialError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col transition-all duration-300">
              {/* Header */}
              <div className="p-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-amber-400/10 rounded-lg border border-amber-400/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">AI Recipe & Visual Guide</span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">
                      {activeTutorial?.title || "Generating Tutorial..."}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTutorial(null);
                    setGeneratingTutorialId(null);
                    setTutorialError(null);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar touch-pan-y flex-1">
                {generatingTutorialId !== null ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-black text-white uppercase tracking-widest animate-pulse">Generating Recipe & Rendering AI Visual</p>
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
                        setGeneratingTutorialId(null);
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
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 shadow-xl group">
                        <img
                          src={activeTutorial.imageUrl}
                          alt={activeTutorial.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
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
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-wider">Duration</p>
                          <p className="text-[10px] font-black text-white">{activeTutorial.estimatedTime}</p>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-2.5">
                        <Wrench className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-wider">Difficulty</p>
                          <p className="text-[10px] font-black text-white">{activeTutorial.difficulty}</p>
                        </div>
                      </div>
                    </div>

                    {/* Materials section */}
                    <div className="space-y-2 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        Required Materials & Tools
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {activeTutorial.materialsNeeded.map((mat, i) => (
                          <li key={i} className="text-[10px] text-white/80 font-bold flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">•</span>
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
                            <div className="w-5 h-5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-[10px] text-white/80 font-bold leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expert Tips */}
                    {activeTutorial.tips && activeTutorial.tips.length > 0 && (
                      <div className="space-y-2 bg-amber-400/5 border border-amber-400/15 rounded-2xl p-4">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" />
                          Expert Upcycling Tips
                        </h4>
                        <ul className="space-y-1.5 pt-1">
                          {activeTutorial.tips.map((tip, i) => (
                            <li key={i} className="text-[10px] text-white/70 font-medium leading-relaxed flex items-start gap-2">
                              <span className="text-amber-400 shrink-0 mt-0.5">★</span>
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
                      setGeneratingTutorialId(null);
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
