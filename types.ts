
export enum TrashCategory {
  RECYCLE = 'RECYCLE',
  ORGANIC = 'ORGANIC',
  TRASH = 'TRASH',
  HAZARDOUS = 'HAZARDOUS',
  ELECTRONIC = 'ELECTRONIC',
  TEXTILE = 'TEXTILE',
  REPAIR = 'REPAIR',
  UNKNOWN = 'UNKNOWN'
}

export interface LearnedItem {
  id: string;
  name: string;
  category: TrashCategory;
  timestamp: number;
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface ClassificationResult {
  item: string;
  category: TrashCategory;
  confidence: number;
  reason: string;
  disposalInstructions?: string;
  carbonImpact?: string;
  links?: GroundingLink[];
  diyProjects?: DIYProject[];
}

export interface DIYProject {
  title: string;
  description: string;
}

export interface DIYPost {
  id: string;
  title: string;
  item: string;
  category: TrashCategory;
  description: string;
  image: string;
  author: string;
  timestamp: number;
  likes: number;
  pointsEarned: number;
}

export interface ImpactStats {
  scannedCount: number;
  treesSaved: number;
  waterSaved: number;
  co2Reduced: number;
  points: number;
  level: number;
  streakCount?: number;
  lastScannedDate?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  category?: TrashCategory;
  isCompleted: boolean;
  icon: string;
  isCommunity?: boolean;
  participantsCount?: number;
}

export interface ScanHistoryItem {
  id: string;
  item: string;
  category: TrashCategory;
  confidence: number;
  timestamp: number;
  image: string; // Base64 data URI
  carbonImpact?: string;
  reason?: string;
}

export interface DetectedItem {
  item: string;
  category: TrashCategory;
  confidence: number;
  reason: string;
  disposalInstructions?: string;
  carbonImpact?: string;
  diyProjects?: DIYProject[];
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  materialGroup?: string; // Optional material subgroup e.g. "Textiles & Apparel", "Plastics", "Paper", etc.
}


