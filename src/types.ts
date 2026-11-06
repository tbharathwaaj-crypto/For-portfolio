export type PetSpecies = 'dog' | 'cat';

export type GrowthStage = 1 | 2 | 3 | 4;

export type RoomTheme = 'morning' | 'afternoon' | 'sunset' | 'night' | 'rainy';

export type BedStyle = 'woven' | 'fluffy' | 'plaid';

export type RugStyle = 'terracotta' | 'sage' | 'boho';

export type ReminderCategory =
  | 'self_care'
  | 'productivity'
  | 'learning'
  | 'wellbeing'
  | 'daily_routine';

export type RepeatFrequency = 'none' | 'daily' | 'weekdays' | 'weekends' | 'interval';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  category: ReminderCategory;
  time: string; // "HH:MM"
  frequency: RepeatFrequency;
  intervalMinutes?: number; // e.g. 30, 60
  checklist?: ChecklistItem[];
  completedToday: boolean;
  completedAt?: string;
  snoozedUntil?: string; // ISO string
  treatReward: number;
  createdAt: string;
}

export interface PetJournalEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'adoption' | 'growth' | 'care' | 'milestone' | 'habit';
  badgeIcon: string;
}

export interface UserProfile {
  preferredName: string;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  lastVisitAt: string;
}

export interface PetState {
  species: PetSpecies;
  name: string;
  growthStage: GrowthStage;
  ageStartedAt: string;
  bondPoints: number;
  growthPoints: number;
  treatBalance: number;
  equippedAccessory?: string;
  lastPettedAt?: string;
  lastFedAt?: string;
  lastFedTimestamp: number;
  hungerLevel: number; // 0 to 100% (100% = full, decays to 30% near next task, drops to 10% after 5m)
  mood: 'happy' | 'sleepy' | 'playful' | 'curious' | 'cozy';
}

export interface RoomCustomization {
  theme: RoomTheme;
  autoTimeOfDay: boolean;
  bedStyle: BedStyle;
  rugStyle: RugStyle;
  showFairyLights: boolean;
  showPlants: boolean;
  rainEffect: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  browserNotifications: boolean;
  focusMode: boolean;
  petCheerAnimations: boolean;
}

export type PetAnimationState =
  | 'idle'
  | 'greeting'
  | 'walking'
  | 'sitting'
  | 'lying'
  | 'sleeping'
  | 'stretching'
  | 'eating'
  | 'playing'
  | 'petting'
  | 'celebrating';
