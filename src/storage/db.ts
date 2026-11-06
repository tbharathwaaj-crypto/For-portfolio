import {
  UserProfile,
  PetState,
  Reminder,
  PetJournalEntry,
  RoomCustomization,
  NotificationSettings,
} from '../types';

const STORAGE_KEYS = {
  USER: 'pawse_user',
  PET: 'pawse_pet',
  REMINDERS: 'pawse_reminders',
  JOURNAL: 'pawse_journal',
  ROOM: 'pawse_room',
  SETTINGS: 'pawse_settings',
  DAILY_DATE: 'pawse_daily_date',
};

const DEFAULT_USER: UserProfile = {
  preferredName: 'Friend',
  hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(),
  lastVisitAt: new Date().toISOString(),
};

const DEFAULT_PET: PetState = {
  species: 'dog',
  name: 'Milo',
  growthStage: 1,
  ageStartedAt: new Date().toISOString(),
  bondPoints: 15,
  growthPoints: 20,
  treatBalance: 3,
  lastFedTimestamp: Date.now(),
  hungerLevel: 100,
  mood: 'happy',
};

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    title: 'Drink a glass of water',
    description: 'A quick sip to refresh your mind and stay energized.',
    category: 'self_care',
    time: '10:00',
    frequency: 'daily',
    completedToday: false,
    treatReward: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    title: 'Mindful stretch & eye break',
    description: 'Look 20 feet away, roll your shoulders, and breathe deeply.',
    category: 'wellbeing',
    time: '12:30',
    frequency: 'daily',
    completedToday: false,
    treatReward: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    title: 'Review today’s key priorities',
    description: 'Pick the top 2-3 things that will make you feel accomplished.',
    category: 'productivity',
    time: '14:00',
    frequency: 'weekdays',
    checklist: [
      { id: 'c1', title: 'Complete most important focus item', completed: false },
      { id: 'c2', title: 'Reply to pending gentle messages', completed: false },
      { id: 'c3', title: 'Organize desk for clarity', completed: false },
    ],
    completedToday: false,
    treatReward: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-4',
    title: 'Learn or read for 10 minutes',
    description: 'Explore an article, a book chapter, or an inspiring idea.',
    category: 'learning',
    time: '16:30',
    frequency: 'daily',
    completedToday: false,
    treatReward: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-5',
    title: 'Evening pause & wind-down',
    description: 'Close your work tabs, praise yourself for today, and rest.',
    category: 'daily_routine',
    time: '18:30',
    frequency: 'daily',
    completedToday: false,
    treatReward: 1,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_JOURNAL: PetJournalEntry[] = [
  {
    id: 'jour-1',
    date: new Date().toISOString(),
    title: 'Welcome Home!',
    description: 'Today our cozy journey began. Milo settled into his warm little room and wagged his tail happily.',
    category: 'adoption',
    badgeIcon: 'paw',
  },
];

const DEFAULT_ROOM: RoomCustomization = {
  theme: 'afternoon',
  autoTimeOfDay: false,
  bedStyle: 'woven',
  rugStyle: 'terracotta',
  showFairyLights: true,
  showPlants: true,
  rainEffect: false,
};

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  browserNotifications: false,
  focusMode: false,
  petCheerAnimations: true,
};

class StorageManager {
  private user: UserProfile = DEFAULT_USER;
  private pet: PetState = DEFAULT_PET;
  private reminders: Reminder[] = DEFAULT_REMINDERS;
  private journal: PetJournalEntry[] = DEFAULT_JOURNAL;
  private room: RoomCustomization = DEFAULT_ROOM;
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadFromStorage();
    this.checkDailyReset();
  }

  private loadFromStorage() {
    try {
      const u = localStorage.getItem(STORAGE_KEYS.USER);
      if (u) this.user = { ...DEFAULT_USER, ...JSON.parse(u) };

      const p = localStorage.getItem(STORAGE_KEYS.PET);
      if (p) this.pet = { ...DEFAULT_PET, ...JSON.parse(p) };

      const r = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (r) this.reminders = JSON.parse(r);

      const j = localStorage.getItem(STORAGE_KEYS.JOURNAL);
      if (j) this.journal = JSON.parse(j);

      const rm = localStorage.getItem(STORAGE_KEYS.ROOM);
      if (rm) this.room = { ...DEFAULT_ROOM, ...JSON.parse(rm) };

      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
    } catch (e) {
      console.warn('Storage load fallback:', e);
    }
  }

  private checkDailyReset() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(STORAGE_KEYS.DAILY_DATE);
    if (lastDate !== today) {
      // New day: reset daily reminder completion states without losing history
      this.reminders = this.reminders.map((rem) => ({
        ...rem,
        completedToday: false,
        checklist: rem.checklist?.map((item) => ({ ...item, completed: false })),
      }));
      this.saveReminders();
      localStorage.setItem(STORAGE_KEYS.DAILY_DATE, today);
    }
  }

  // User
  getUser(): UserProfile {
    return { ...this.user };
  }

  saveUser(user: Partial<UserProfile>) {
    this.user = { ...this.user, ...user };
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
    } catch {}
  }

  // Pet
  getPet(): PetState {
    const hunger = this.calculateHunger();
    return {
      ...this.pet,
      hungerLevel: hunger.hungerPercent,
    };
  }

  savePet(pet: Partial<PetState>) {
    this.pet = { ...this.pet, ...pet };
    try {
      localStorage.setItem(STORAGE_KEYS.PET, JSON.stringify(this.pet));
    } catch {}
  }

  // Calculate pet hunger / fullness (100% -> decays toward 30% near task -> 10% if >5 min overdue)
  calculateHunger(): {
    hungerPercent: number;
    nextTask?: Reminder;
    nextTaskMinutes?: number;
    isOverdueBy5Min: boolean;
    statusLabel: string;
    urgencyColor: string;
  } {
    const now = new Date();
    const nowMs = now.getTime();
    const lastFed = this.pet.lastFedTimestamp || (nowMs - 60000);

    // Get uncompleted reminders for today
    const uncompleted = this.reminders
      .filter((r) => !r.completedToday)
      .map((r) => {
        const [h, m] = r.time.split(':').map(Number);
        const taskDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
        return {
          reminder: r,
          taskTimeMs: taskDate.getTime(),
        };
      })
      .sort((a, b) => a.taskTimeMs - b.taskTimeMs);

    if (uncompleted.length === 0) {
      // All tasks completed today!
      const elapsedHours = (nowMs - lastFed) / (3600 * 1000);
      const hungerPercent = Math.max(70, Math.round(100 - elapsedHours * 10));
      return {
        hungerPercent,
        isOverdueBy5Min: false,
        statusLabel: 'Happily Full 🌟',
        urgencyColor: '#829B76',
      };
    }

    const next = uncompleted[0];
    const taskTimeMs = next.taskTimeMs;
    const diffMs = nowMs - taskTimeMs;
    const diffMinutes = diffMs / 60000;

    // Rule 1: "nearing the next task time, it will be decreasing. near to 30%"
    if (diffMs < 0) {
      // Before task time: smoothly decaying from 100% down to 30%
      const totalIntervalMs = Math.max(120000, taskTimeMs - lastFed);
      const elapsedSinceFed = Math.max(0, nowMs - lastFed);
      const progress = Math.min(1, Math.max(0, elapsedSinceFed / totalIntervalMs));
      const hungerPercent = Math.round(100 - progress * 70);
      const minsRemaining = Math.max(1, Math.round(-diffMs / 60000));

      return {
        hungerPercent,
        nextTask: next.reminder,
        nextTaskMinutes: minsRemaining,
        isOverdueBy5Min: false,
        statusLabel: hungerPercent > 60 ? 'Satisfied' : `Peckish (Task in ${minsRemaining}m)`,
        urgencyColor: hungerPercent > 60 ? '#829B76' : '#EF6905',
      };
    }

    // Task time has arrived or passed!
    // Rule 2: "and if you crossed 5 minutes after the task and didnt feed it. that 30% will decrease to 10%"
    if (diffMinutes <= 5) {
      // Between 0 and 5 minutes after task time: exactly 30%
      return {
        hungerPercent: 30,
        nextTask: next.reminder,
        nextTaskMinutes: 0,
        isOverdueBy5Min: false,
        statusLabel: 'Hungry (Task Due Now!) 🥣',
        urgencyColor: '#EF6905',
      };
    }

    // Crossed 5 minutes after task without feeding: decreases to 10%!
    return {
      hungerPercent: 10,
      nextTask: next.reminder,
      nextTaskMinutes: Math.round(diffMinutes),
      isOverdueBy5Min: true,
      statusLabel: 'Very Hungry (Task +5m Overdue!) ⚠️',
      urgencyColor: '#E63946',
    };
  }

  // Reminders
  getReminders(): Reminder[] {
    return [...this.reminders];
  }

  saveReminders(reminders?: Reminder[]) {
    if (reminders) this.reminders = reminders;
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(this.reminders));
    } catch {}
  }

  addReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'completedToday'>): Reminder {
    const newRem: Reminder = {
      ...reminder,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      completedToday: false,
      createdAt: new Date().toISOString(),
    };
    this.reminders.push(newRem);
    this.saveReminders();
    return newRem;
  }

  updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
    const index = this.reminders.findIndex((r) => r.id === id);
    if (index === -1) return null;
    this.reminders[index] = { ...this.reminders[index], ...updates };
    this.saveReminders();
    return this.reminders[index];
  }

  deleteReminder(id: string): boolean {
    const initLen = this.reminders.length;
    this.reminders = this.reminders.filter((r) => r.id !== id);
    if (this.reminders.length !== initLen) {
      this.saveReminders();
      return true;
    }
    return false;
  }

  // Journal
  getJournal(): PetJournalEntry[] {
    return [...this.journal];
  }

  addJournalEntry(entry: Omit<PetJournalEntry, 'id' | 'date'>) {
    const newEntry: PetJournalEntry = {
      ...entry,
      id: `jour-${Date.now()}`,
      date: new Date().toISOString(),
    };
    this.journal.unshift(newEntry);
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(this.journal));
    } catch {}
  }

  // Room
  getRoom(): RoomCustomization {
    return { ...this.room };
  }

  saveRoom(room: Partial<RoomCustomization>) {
    this.room = { ...this.room, ...room };
    try {
      localStorage.setItem(STORAGE_KEYS.ROOM, JSON.stringify(this.room));
    } catch {}
  }

  // Settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  saveSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch {}
  }

  // Growth calculation helper
  calculateGrowthStage(growthPoints: number): { stage: 1 | 2 | 3 | 4; nextMilestone: number; title: string } {
    if (growthPoints >= 180) {
      return { stage: 4, nextMilestone: 250, title: 'Forever Companion' };
    }
    if (growthPoints >= 100) {
      return { stage: 3, nextMilestone: 180, title: 'Best Friend' };
    }
    if (growthPoints >= 40) {
      return { stage: 2, nextMilestone: 100, title: 'Growing Buddy' };
    }
    return { stage: 1, nextMilestone: 40, title: 'Little One' };
  }

  // Reset demo
  resetData() {
    localStorage.clear();
    this.user = { ...DEFAULT_USER };
    this.pet = { ...DEFAULT_PET };
    this.reminders = [...DEFAULT_REMINDERS];
    this.journal = [...DEFAULT_JOURNAL];
    this.room = { ...DEFAULT_ROOM };
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveUser(this.user);
    this.savePet(this.pet);
    this.saveReminders();
    this.saveRoom(this.room);
    this.saveSettings(this.settings);
  }
}

export const db = new StorageManager();
