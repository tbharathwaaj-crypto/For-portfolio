import { db } from '../storage/db';
import { sound } from '../audio/soundManager';
import { CozyPetAppScript } from '../scene/CozyPetAppScript';
import {
  Reminder,
  ReminderCategory,
  RepeatFrequency,
  RoomTheme,
  BedStyle,
  RugStyle,
  PetSpecies,
} from '../types';

export class UIManager {
  private script: CozyPetAppScript;
  private container: HTMLElement;
  private activeTab: 'room' | 'reminders' | 'journal' | 'habitat' | 'settings' = 'room';
  private zenMode = false;
  private selectedCategory: ReminderCategory | 'all' = 'all';

  // Sub-modal states
  private isAddReminderOpen = false;
  private editingReminderId: string | null = null;
  private isGrowthModalOpen = false;
  private isFeedModalOpen = false;
  private isOnboardingOpen = false;
  private onboardingStep = 1;
  private tempOnboardingData = {
    species: 'dog' as PetSpecies,
    petName: 'Milo',
    userName: 'Friend',
    selectedReminders: [0, 1, 2],
  };

  constructor(script: CozyPetAppScript) {
    this.script = script;
    this.container = document.getElementById('pawse-app') || document.body;

    this.isOnboardingOpen = false;

    // Hook script callbacks
    this.script.onPetInteracted = (action) => {
      this.render();
      if (action === 'pet') {
        this.showToast('You gently petted your buddy! 💖 (+2 Bond)');
      } else if (action === 'feed') {
        this.showToast('Yum! Your pet enjoyed a delicious treat! 🍖 (+5 Bond)');
      } else if (action === 'play') {
        this.showToast('Playtime! Your pet bounces with joy! 🎾 (+4 Bond)');
      } else if (action === 'sleep') {
        this.showToast('Your pet curled up for a peaceful nap in bed. 💤');
      } else if (action === 'wake') {
        this.showToast('Good morning! Your pet stretched and wagged its tail.');
      }
    };

    this.script.onObjectSelected = (target) => {
      if (target === 'bowl') {
        this.openFeedModal();
      } else if (target === 'bookshelf') {
        this.showToast('A cozy bookshelf with mindful reading and green succulents.');
      }
    };

    // Auto-refresh hunger status and countdowns every 10 seconds without interfering with open modals
    setInterval(() => {
      if (this.isAddReminderOpen || this.isOnboardingOpen) return;
      this.render();
    }, 10000);

    this.render();
  }

  public render() {
    const user = db.getUser();
    const pet = db.getPet();
    const room = db.getRoom();
    const settings = db.getSettings();
    const reminders = db.getReminders();
    const growth = db.calculateGrowthStage(pet.growthPoints);

    const completedCount = reminders.filter((r) => r.completedToday).length;
    const totalCount = reminders.length;
    const hungerInfo = db.calculateHunger();

    this.container.innerHTML = `
      <div id="pawse-ui-overlay" class="relative w-full h-full pointer-events-none text-[#46372F] font-sans">
        
        <!-- TOP NAVIGATION BAR -->
        <header class="absolute top-0 left-0 right-0 p-3 sm:p-5 flex items-center justify-between z-30 transition-all ${
          this.zenMode ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
        }">
          
          <!-- Logo & Brand -->
          <div class="pointer-events-auto flex items-center gap-2.5 bg-white/85 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-[#E8DCCF]">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#EF6905] to-[#F5D7BD] flex items-center justify-center text-white text-lg shadow-sm">
              🐾
            </div>
            <div>
              <div class="font-extrabold text-base tracking-tight text-[#46372F] font-heading flex items-center gap-1.5 leading-none">
                PAWSE
                <span class="text-[10px] uppercase tracking-wider font-bold bg-[#FFF4CC] text-[#EF6905] px-1.5 py-0.5 rounded-full">Cozy XR</span>
              </div>
              <div class="text-[11px] text-[#87776B] font-medium leading-none mt-1 hidden sm:block">A little break. A happier you.</div>
            </div>
          </div>

          <!-- Central Navigation Tabs -->
          <nav class="pointer-events-auto hidden md:flex items-center gap-1 bg-white/85 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-[#E8DCCF]">
            <button id="nav-room" class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              this.activeTab === 'room' ? 'bg-[#EF6905] text-white shadow-xs' : 'text-[#87776B] hover:text-[#46372F] hover:bg-[#F8F0E5]'
            }">
              🏡 Pet Room
            </button>
            <button id="nav-reminders" class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all relative ${
              this.activeTab === 'reminders' ? 'bg-[#EF6905] text-white shadow-xs' : 'text-[#87776B] hover:text-[#46372F] hover:bg-[#F8F0E5]'
            }">
              📋 Reminders
              ${totalCount > completedCount ? `<span class="ml-1 bg-[#EF6905] text-white px-1.5 py-0.2 rounded-full text-[10px]">${totalCount - completedCount}</span>` : ''}
            </button>
            <button id="nav-journal" class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              this.activeTab === 'journal' ? 'bg-[#EF6905] text-white shadow-xs' : 'text-[#87776B] hover:text-[#46372F] hover:bg-[#F8F0E5]'
            }">
              📖 Journal
            </button>
            <button id="nav-habitat" class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              this.activeTab === 'habitat' ? 'bg-[#EF6905] text-white shadow-xs' : 'text-[#87776B] hover:text-[#46372F] hover:bg-[#F8F0E5]'
            }">
              🎨 Habitat
            </button>
            <button id="nav-settings" class="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              this.activeTab === 'settings' ? 'bg-[#EF6905] text-white shadow-xs' : 'text-[#87776B] hover:text-[#46372F] hover:bg-[#F8F0E5]'
            }">
              ⚙️
            </button>
          </nav>

          <!-- Status Indicators & Quick Controls -->
          <div class="pointer-events-auto flex items-center gap-2">
            
            <!-- Pet Hunger / Fullness Level Badge -->
            <button id="btn-hunger-badge" class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-[#E8DCCF] flex items-center gap-2 hover:bg-[#FFF4CC] transition-all cursor-pointer group" title="Pet Hunger Level: ${hungerInfo.hungerPercent}% - ${hungerInfo.statusLabel}">
              <span class="text-base">${hungerInfo.hungerPercent <= 10 ? '🚨' : hungerInfo.hungerPercent <= 30 ? '🥣' : '🍖'}</span>
              <div class="text-left min-w-[72px]">
                <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#87776B] leading-none mb-1">
                  <span>Hunger</span>
                  <span class="font-extrabold" style="color: ${hungerInfo.urgencyColor};">${hungerInfo.hungerPercent}%</span>
                </div>
                <!-- Visual Meter Bar -->
                <div class="w-full h-2 bg-[#F0E6D8] rounded-full overflow-hidden border border-[#E8DCCF]/60">
                  <div class="h-full rounded-full transition-all duration-500" style="width: ${hungerInfo.hungerPercent}%; background-color: ${hungerInfo.urgencyColor};"></div>
                </div>
              </div>
            </button>

            <!-- Growth Badge -->
            <button id="btn-growth-badge" class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-[#E8DCCF] flex items-center gap-1.5 hover:bg-[#FFF4CC] transition-all cursor-pointer">
              <span class="text-sm">🌱</span>
              <div class="text-left">
                <div class="text-[10px] font-bold uppercase tracking-wider text-[#829B76] leading-none">Stage ${pet.growthStage}</div>
                <div class="text-xs font-bold text-[#46372F] leading-tight font-heading">${growth.title}</div>
              </div>
            </button>

            <!-- Treat Inventory -->
            <button id="btn-treat-badge" class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-[#E8DCCF] flex items-center gap-1.5 hover:bg-[#FFF4CC] transition-all cursor-pointer">
              <span class="text-sm">${pet.species === 'dog' ? '🦴' : '🐟'}</span>
              <div class="text-left">
                <div class="text-[10px] font-bold uppercase tracking-wider text-[#C98262] leading-none">Treats</div>
                <div class="text-xs font-bold text-[#EF6905] leading-tight font-heading">${pet.treatBalance} available</div>
              </div>
            </button>

            <!-- Audio Toggle -->
            <button id="btn-sound-toggle" class="w-9 h-9 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E8DCCF] shadow-sm flex items-center justify-center text-sm hover:bg-[#F8F0E5] transition-all cursor-pointer" title="Toggle sound">
              ${settings.soundEnabled ? '🔔' : '🔕'}
            </button>

            <!-- Zen Mode Toggle -->
            <button id="btn-zen-mode" class="w-9 h-9 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E8DCCF] shadow-sm flex items-center justify-center text-sm hover:bg-[#F8F0E5] transition-all cursor-pointer" title="Zen view (hide controls)">
              👁️
            </button>
          </div>
        </header>

        <!-- ZEN MODE FLOATING RESTORE BUTTON -->
        ${
          this.zenMode
            ? `
          <button id="btn-zen-restore" class="pointer-events-auto absolute top-5 right-5 z-40 bg-white/90 hover:bg-white text-[#46372F] px-4 py-2 rounded-2xl shadow-md border border-[#E8DCCF] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all">
            <span>✨</span> Show Controls
          </button>
        `
            : ''
        }

        <!-- CONTEXTUAL GREETING BUBBLE (Above pet) -->
        ${
          this.activeTab === 'room' && !this.zenMode
            ? `
          <div class="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-sm w-11/12">
            <div class="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-md border border-[#E8DCCF] flex items-start gap-3 transition-all hover:scale-[1.01]">
              <div class="text-2xl pt-0.5">
                ${pet.mood === 'sleepy' ? '💤' : pet.mood === 'playful' ? '🎾' : hungerInfo.hungerPercent <= 10 ? '🥣' : '💖'}
              </div>
              <div class="flex-1 text-left">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-xs font-heading text-[#EF6905]">${pet.name} says</span>
                  <span class="text-[10px] text-[#87776B] font-medium">${hungerInfo.statusLabel}</span>
                </div>
                <p class="text-xs text-[#46372F] font-medium leading-relaxed mt-0.5">
                  ${this.getPetContextualGreeting(user.preferredName, pet.name, pet.species, completedCount, totalCount, hungerInfo)}
                </p>
              </div>
            </div>
          </div>
        `
            : ''
        }

        <!-- BOTTOM PET ACTION BAR / DOCK (Pinned to Bottom) -->
        ${
          this.activeTab === 'room' && !this.zenMode
            ? `
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-11/12 max-w-lg">
            <div class="bg-white/95 backdrop-blur-md p-2 rounded-3xl shadow-lg border border-[#E8DCCF] flex items-center justify-around gap-1">
              
              <!-- Feed Button -->
              <button id="btn-action-feed" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-[#FFF4CC] transition-all cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-[#FFF4CC] group-hover:scale-110 group-active:scale-95 transition-transform flex items-center justify-center text-xl shadow-xs relative">
                  🍖
                  <span class="absolute -bottom-1 -right-1 text-[9px] font-black px-1 rounded-full text-white shadow-xs" style="background-color: ${hungerInfo.urgencyColor};">${hungerInfo.hungerPercent}%</span>
                </div>
                <span class="text-[11px] font-bold text-[#46372F] font-heading mt-1">Feed (${pet.treatBalance})</span>
              </button>

              <!-- Play Button -->
              <button id="btn-action-play" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-[#F5D7BD]/50 transition-all cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-[#F5D7BD] group-hover:scale-110 group-active:scale-95 transition-transform flex items-center justify-center text-xl shadow-xs">
                  🎾
                </div>
                <span class="text-[11px] font-bold text-[#46372F] font-heading mt-1">Play</span>
              </button>

              <!-- Pet / Cuddle Button -->
              <button id="btn-action-pet" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-[#FFD6E0]/50 transition-all cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EF476F] to-[#FF8FA3] group-hover:scale-110 group-active:scale-95 transition-transform flex items-center justify-center text-xl text-white shadow-xs">
                  🖐️
                </div>
                <span class="text-[11px] font-bold text-[#46372F] font-heading mt-1">Pet</span>
              </button>

              <!-- Rest / Wake Button -->
              <button id="btn-action-rest" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-[#C7D6BE]/50 transition-all cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-[#C7D6BE] group-hover:scale-110 group-active:scale-95 transition-transform flex items-center justify-center text-xl shadow-xs">
                  ${this.script.pet?.animState === 'sleeping' ? '☀️' : '💤'}
                </div>
                <span class="text-[11px] font-bold text-[#46372F] font-heading mt-1">${this.script.pet?.animState === 'sleeping' ? 'Wake' : 'Rest'}</span>
              </button>

              <!-- Reminders Quick Access -->
              <button id="btn-action-quick-tasks" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl hover:bg-[#D8E8F2]/50 transition-all cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-[#D8E8F2] group-hover:scale-110 group-active:scale-95 transition-transform flex items-center justify-center text-xl shadow-xs relative">
                  📋
                  ${totalCount > completedCount ? `<span class="absolute -top-1 -right-1 w-4 h-4 bg-[#EF6905] text-white rounded-full text-[9px] flex items-center justify-center font-bold">${totalCount - completedCount}</span>` : ''}
                </div>
                <span class="text-[11px] font-bold text-[#46372F] font-heading mt-1">Tasks</span>
              </button>
            </div>
          </div>
        `
            : ''
        }

        <!-- MOBILE BOTTOM NAVIGATION (for narrow screens) -->
        <div class="md:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-auto bg-white/95 backdrop-blur-md border-t border-[#E8DCCF] flex items-center justify-around py-1.5 px-2 ${
          this.zenMode ? 'hidden' : ''
        }">
          <button id="m-nav-room" class="flex flex-col items-center py-1 px-3 rounded-xl ${this.activeTab === 'room' ? 'text-[#EF6905] font-bold' : 'text-[#87776B]'}">
            <span class="text-lg">🏡</span>
            <span class="text-[10px]">Room</span>
          </button>
          <button id="m-nav-reminders" class="flex flex-col items-center py-1 px-3 rounded-xl ${this.activeTab === 'reminders' ? 'text-[#EF6905] font-bold' : 'text-[#87776B]'}">
            <span class="text-lg">📋</span>
            <span class="text-[10px]">Tasks</span>
          </button>
          <button id="m-nav-journal" class="flex flex-col items-center py-1 px-3 rounded-xl ${this.activeTab === 'journal' ? 'text-[#EF6905] font-bold' : 'text-[#87776B]'}">
            <span class="text-lg">📖</span>
            <span class="text-[10px]">Journal</span>
          </button>
          <button id="m-nav-habitat" class="flex flex-col items-center py-1 px-3 rounded-xl ${this.activeTab === 'habitat' ? 'text-[#EF6905] font-bold' : 'text-[#87776B]'}">
            <span class="text-lg">🎨</span>
            <span class="text-[10px]">Habitat</span>
          </button>
        </div>

        <!-- REMINDERS & TASK MANAGEMENT PANEL (Floating Drawer) -->
        ${this.activeTab === 'reminders' ? this.renderRemindersPanel(reminders, completedCount, totalCount) : ''}

        <!-- PET JOURNAL SCRAPBOOK PANEL -->
        ${this.activeTab === 'journal' ? this.renderJournalPanel() : ''}

        <!-- HABITAT CUSTOMIZER PANEL -->
        ${this.activeTab === 'habitat' ? this.renderHabitatPanel(room) : ''}

        <!-- SETTINGS PANEL -->
        ${this.activeTab === 'settings' ? this.renderSettingsPanel(settings, user, pet) : ''}

        <!-- MODAL: ADD / EDIT REMINDER -->
        ${this.isAddReminderOpen ? this.renderAddReminderModal() : ''}

        <!-- MODAL: PET GROWTH & STATUS -->
        ${this.isGrowthModalOpen ? this.renderGrowthModal(pet, growth) : ''}

        <!-- MODAL: FEED PET TREATS -->
        ${this.isFeedModalOpen ? this.renderFeedModal(pet) : ''}

        <!-- ONBOARDING WIZARD (First Visit or Replay) -->
        ${this.isOnboardingOpen ? this.renderOnboardingModal() : ''}

        <!-- TOAST CONTAINER -->
        <div id="pawse-toast-container" class="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  // Returns affectionate personalized greetings based on time, reminders, and bond
  private getPetContextualGreeting(
    userName: string,
    petName: string,
    species: PetSpecies,
    completed: number,
    total: number,
    hungerInfo?: { hungerPercent: number; nextTask?: Reminder; nextTaskMinutes?: number; isOverdueBy5Min: boolean; statusLabel: string }
  ): string {
    const isDog = species === 'dog';
    if (hungerInfo?.isOverdueBy5Min && hungerInfo.nextTask) {
      return isDog
        ? `“*Whimper*... My tummy is rumbling! Task '${hungerInfo.nextTask.title}' was due 5+ mins ago! Complete it to feed me! 🥣 (Hunger: 10%)”`
        : `“*Meow*... I'm feeling hungry. '${hungerInfo.nextTask.title}' was due 5+ minutes ago. Please complete it so I can eat! 🥣 (Hunger: 10%)”`;
    }
    if (hungerInfo && hungerInfo.hungerPercent <= 30 && hungerInfo.nextTask) {
      return isDog
        ? `“Sniff sniff! Nearing task time for '${hungerInfo.nextTask.title}'! Complete it to feed me to 100%! 🍖 (Hunger: ${hungerInfo.hungerPercent}%)”`
        : `“*Prrp*... Task time approaches for '${hungerInfo.nextTask.title}'. Complete it and give me lunch! 🐟 (Hunger: ${hungerInfo.hungerPercent}%)”`;
    }
    if (hungerInfo && hungerInfo.hungerPercent === 100) {
      return isDog
        ? `“*Burp!* Milo is 100% full and happy! Thank you for finishing your habits today, ${userName}! 🌟”`
        : `“Purrrrr... I'm 100% full and content. You take good care of us, ${userName}. 🌸”`;
    }
    if (completed === total && total > 0) {
      return isDog
        ? `“Woohoo, ${userName}! You completed all your daily tasks! I'm so proud of you!” 🌟`
        : `“All done for today, ${userName}? Good. Let's curl up by the window together.” 🐾`;
    }
    if (completed > 0) {
      return isDog
        ? `“Nice job on your habits today, ${userName}! Milo has an extra treat ready for later!” 🍖`
        : `“You took care of your little tasks, ${userName}. My purrs are all for you.” 🌿`;
    }
    return isDog
      ? `“Hi, ${userName}! Remember to drink some water and stretch. Milo is right here cheering you on!” 💧`
      : `“Welcome to our quiet room, ${userName}. Take a slow deep breath with me.” 🌸`;
  }

  private renderRemindersPanel(reminders: Reminder[], completedCount: number, totalCount: number): string {
    const hungerInfo = db.calculateHunger();
    const categories: { key: ReminderCategory | 'all'; label: string; icon: string }[] = [
      { key: 'all', label: 'All', icon: '✨' },
      { key: 'self_care', label: 'Self-Care', icon: '💧' },
      { key: 'wellbeing', label: 'Well-being', icon: '🌿' },
      { key: 'productivity', label: 'Productivity', icon: '⚡' },
      { key: 'learning', label: 'Learning', icon: '📚' },
      { key: 'daily_routine', label: 'Routine', icon: '🌅' },
    ];

    const filtered = reminders.filter((r) =>
      this.selectedCategory === 'all' ? true : r.category === this.selectedCategory
    );

    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const now = new Date();

    return `
      <div class="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/35 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-[#E8DCCF] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Panel Header -->
          <div class="p-4 sm:p-6 bg-[#F8F0E5] border-b border-[#E8DCCF] flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">📋</span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-[#46372F] font-heading">Reminders & Daily Habits</h2>
              </div>
              <p class="text-xs sm:text-sm text-[#87776B] mt-0.5">Every completed habit rewards your pet with treats and grows your bond.</p>
            </div>
            <button id="btn-close-reminders" class="w-9 h-9 rounded-2xl bg-white border border-[#E8DCCF] text-[#46372F] hover:bg-[#F5D7BD] transition-all flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <!-- Progress Banner -->
          <div class="px-4 sm:px-6 py-3 bg-[#FFF4CC]/50 border-b border-[#E8DCCF] flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex justify-between text-xs font-bold text-[#46372F] mb-1">
                <span>Today's Progress (${completedCount}/${totalCount} completed)</span>
                <span class="text-[#EF6905]">${percent}%</span>
              </div>
              <div class="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#E8DCCF]">
                <div class="h-full bg-gradient-to-r from-[#EF6905] to-[#829B76] rounded-full transition-all duration-500" style="width: ${percent}%"></div>
              </div>
            </div>
            <button id="btn-open-add-reminder" class="px-3.5 py-2 rounded-xl bg-[#EF6905] hover:bg-[#d65e04] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap">
              <span>+</span> Add Habit
            </button>
          </div>

          <!-- PET HUNGER & FEEDING RULE BANNER -->
          <div class="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FFF4CC]/90 to-[#F5D7BD]/70 border-b border-[#E8DCCF]">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">${hungerInfo.hungerPercent <= 10 ? '🚨' : hungerInfo.hungerPercent <= 30 ? '🥣' : '🍖'}</span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase tracking-wider text-[#46372F]">Pet Hunger Bar:</span>
                    <span class="text-sm font-black" style="color: ${hungerInfo.urgencyColor};">${hungerInfo.hungerPercent}%</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-2xs" style="background-color: ${hungerInfo.urgencyColor};">${hungerInfo.statusLabel}</span>
                  </div>
                  <div class="w-48 sm:w-64 h-2 bg-white/90 rounded-full overflow-hidden border border-[#E8DCCF] mt-1">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${hungerInfo.hungerPercent}%; background-color: ${hungerInfo.urgencyColor};"></div>
                  </div>
                </div>
              </div>

              <!-- Quick Time Simulators for Testing Rules -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button id="btn-test-complete-feed" class="px-2.5 py-1 rounded-lg bg-[#829B76] hover:bg-[#6e8563] text-white font-extrabold text-[10px] shadow-xs cursor-pointer flex items-center gap-1 transition-all" title="Complete next task and feed pet to 100%">
                  🍖 Complete & Feed (100%)
                </button>
                <button id="btn-test-approaching" class="px-2 py-1 rounded-lg bg-white border border-[#E8DCCF] hover:bg-[#FFF4CC] text-[#46372F] font-bold text-[10px] cursor-pointer transition-all" title="Simulate nearing task time (Hunger ~30%)">
                  ⏳ Near Task (~30%)
                </button>
                <button id="btn-test-overdue" class="px-2 py-1 rounded-lg bg-white border border-[#E8DCCF] hover:bg-[#FDE8E8] text-[#E63946] font-bold text-[10px] cursor-pointer transition-all" title="Simulate 5+ min overdue without feeding (Hunger 10%)">
                  ⚠️ +5m Overdue (10%)
                </button>
              </div>
            </div>
            <p class="text-[11px] text-[#87776B] mt-2 leading-tight">
              💡 <strong>Feeding Rule:</strong> Completing a habit feeds your pet to <strong>100%</strong>. Nearing task time, hunger drops to <strong>30%</strong>. If 5+ minutes pass without feeding, hunger decreases to <strong>10%</strong>!
            </p>
          </div>

          <!-- Category Filter Pills -->
          <div class="px-4 sm:px-6 py-2.5 border-b border-[#E8DCCF] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            ${categories
              .map(
                (c) => `
              <button data-cat="${c.key}" class="filter-pill px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  this.selectedCategory === c.key
                    ? 'bg-[#46372F] text-white shadow-xs'
                    : 'bg-[#F8F0E5] text-[#87776B] hover:text-[#46372F]'
                }">
                <span>${c.icon}</span> ${c.label}
              </button>
            `
              )
              .join('')}
          </div>

          <!-- Reminders List -->
          <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
            ${
              filtered.length === 0
                ? `
              <div class="text-center py-10 text-[#87776B]">
                <div class="text-4xl mb-2">🌿</div>
                <p class="font-bold text-sm">No reminders found in this category.</p>
                <p class="text-xs mt-1">Tap "+ Add Habit" above to create one!</p>
              </div>
            `
                : filtered
                    .map((rem) => {
                      const isComplete = rem.completedToday;
                      const hasChecklist = rem.checklist && rem.checklist.length > 0;
                      const completedSubtasks = hasChecklist
                        ? rem.checklist!.filter((c) => c.completed).length
                        : 0;

                      const [h, m] = rem.time.split(':').map(Number);
                      const remDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
                      const diffMins = (now.getTime() - remDate.getTime()) / 60000;
                      let taskStatusTag = '';
                      if (isComplete) {
                        taskStatusTag = '<span class="text-[#829B76] font-bold bg-[#E8F0E3] px-2 py-0.5 rounded-full">✓ Pet Fed & Habit Done</span>';
                      } else if (diffMins > 5) {
                        taskStatusTag = '<span class="text-[#E63946] font-extrabold bg-[#FDE8E8] px-2 py-0.5 rounded-full animate-pulse">⚠️ +5m Overdue (Pet at 10%)</span>';
                      } else if (diffMins >= 0) {
                        taskStatusTag = '<span class="text-[#EF6905] font-extrabold bg-[#FFF4CC] px-2 py-0.5 rounded-full">🥣 Due Now (Pet at 30%)</span>';
                      } else if (diffMins > -30) {
                        taskStatusTag = `<span class="text-[#EF6905] font-bold bg-[#FFF4CC] px-2 py-0.5 rounded-full">⏳ In ${Math.abs(Math.round(diffMins))}m (Pet at ~30%)</span>`;
                      }

                      return `
                  <div class="p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isComplete
                      ? 'bg-[#F0F5ED] border-[#C7D6BE] opacity-80'
                      : 'bg-white border-[#E8DCCF] hover:shadow-md'
                  }">
                    <div class="flex items-start justify-between gap-3">
                      
                      <!-- Complete Checkbox -->
                      <button data-toggle-rem="${rem.id}" class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mt-0.5 ${
                        isComplete
                          ? 'bg-[#829B76] border-[#829B76] text-white'
                          : 'border-[#C98262] hover:border-[#EF6905] bg-white'
                      }">
                        ${isComplete ? '✓' : ''}
                      </button>

                      <!-- Content -->
                      <div class="flex-1 text-left">
                        <div class="flex items-center gap-2 flex-wrap">
                          <h4 class="font-bold text-sm sm:text-base text-[#46372F] ${
                            isComplete ? 'line-through text-[#87776B]' : ''
                          }">${rem.title}</h4>
                          <span class="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${this.getCategoryBadgeStyle(
                            rem.category
                          )}">
                            ${rem.category.replace('_', ' ')}
                          </span>
                          ${taskStatusTag}
                        </div>
                        
                        ${rem.description ? `<p class="text-xs text-[#87776B] mt-1">${rem.description}</p>` : ''}

                        <!-- Checklist Subtasks if any -->
                        ${
                          hasChecklist
                            ? `
                          <div class="mt-2.5 pt-2 border-t border-[#E8DCCF]/60 space-y-1.5">
                            <div class="text-[11px] font-bold text-[#87776B] mb-1">
                              Checklist (${completedSubtasks}/${rem.checklist!.length}):
                            </div>
                            ${rem.checklist!
                              .map(
                                (item) => `
                              <label class="flex items-center gap-2 text-xs text-[#46372F] cursor-pointer">
                                <input type="checkbox" data-subtask-rem="${rem.id}" data-subtask-id="${item.id}" ${
                                  item.completed ? 'checked' : ''
                                } class="rounded text-[#EF6905] focus:ring-0" />
                                <span class="${item.completed ? 'line-through text-[#87776B]' : ''}">${item.title}</span>
                              </label>
                            `
                              )
                              .join('')}
                          </div>
                        `
                            : ''
                        }

                        <!-- Metadata Footer -->
                        <div class="flex items-center gap-3 mt-3 text-[11px] text-[#87776B] flex-wrap">
                          <span>⏰ ${rem.time}</span>
                          <span>🔁 ${rem.frequency}</span>
                          <span class="text-[#EF6905] font-bold">🎁 +${rem.treatReward} Treat</span>
                          ${
                            !isComplete
                              ? `
                            <button data-feed-complete-rem="${rem.id}" class="ml-auto px-2.5 py-1 rounded-xl bg-[#829B76] hover:bg-[#6e8563] text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer">
                              <span>🍖</span> Feed Pet & Complete
                            </button>
                          `
                              : ''
                          }
                        </div>
                      </div>

                      <!-- Actions: Snooze, Delete -->
                      <div class="flex items-center gap-1">
                        <button data-snooze-rem="${rem.id}" class="p-1.5 text-xs text-[#87776B] hover:text-[#46372F] rounded-lg hover:bg-[#F8F0E5] transition-all" title="Snooze 10m">
                          💤
                        </button>
                        <button data-delete-rem="${rem.id}" class="p-1.5 text-xs text-[#87776B] hover:text-[#E63946] rounded-lg hover:bg-[#F8F0E5] transition-all" title="Delete">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                `;
                    })
                    .join('')
            }
          </div>
        </div>
      </div>
    `;
  }

  private getCategoryBadgeStyle(category: ReminderCategory): string {
    switch (category) {
      case 'self_care':
        return 'bg-[#D8E8F2] text-[#2A6F97]';
      case 'wellbeing':
        return 'bg-[#C7D6BE] text-[#3B5A30]';
      case 'productivity':
        return 'bg-[#FFF4CC] text-[#B07D10]';
      case 'learning':
        return 'bg-[#F5D7BD] text-[#C98262]';
      case 'daily_routine':
        return 'bg-[#E8DCCF] text-[#6A584A]';
      default:
        return 'bg-[#F8F0E5] text-[#87776B]';
    }
  }

  private renderJournalPanel(): string {
    const journal = db.getJournal();
    const pet = db.getPet();

    return `
      <div class="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/35 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-[#E8DCCF] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <div class="p-4 sm:p-6 bg-[#F8F0E5] border-b border-[#E8DCCF] flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">📖</span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-[#46372F] font-heading">${pet.name}'s Memory Journal</h2>
              </div>
              <p class="text-xs sm:text-sm text-[#87776B] mt-0.5">Cherished milestones, growth memories, and shared moments.</p>
            </div>
            <button id="btn-close-journal" class="w-9 h-9 rounded-2xl bg-white border border-[#E8DCCF] text-[#46372F] hover:bg-[#F5D7BD] transition-all flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            ${
              journal.length === 0
                ? `
              <div class="text-center py-10 text-[#87776B]">
                <div class="text-4xl mb-2">🐾</div>
                <p class="font-bold">Your story together starts here.</p>
              </div>
            `
                : journal
                    .map(
                      (item) => `
              <div class="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-[#E8DCCF] shadow-xs">
                <div class="w-10 h-10 rounded-xl bg-[#FFF4CC] flex items-center justify-center text-xl shadow-xs shrink-0">
                  ${item.badgeIcon === 'sparkles' ? '✨' : item.badgeIcon === 'heart' ? '💖' : '🐾'}
                </div>
                <div class="text-left flex-1">
                  <div class="flex items-center justify-between flex-wrap">
                    <h4 class="font-bold text-base text-[#46372F] font-heading">${item.title}</h4>
                    <span class="text-[11px] text-[#87776B]">${new Date(item.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}</span>
                  </div>
                  <p class="text-xs text-[#87776B] mt-1 leading-relaxed">${item.description}</p>
                </div>
              </div>
            `
                    )
                    .join('')
            }
          </div>
        </div>
      </div>
    `;
  }

  private renderHabitatPanel(room: { theme: RoomTheme; bedStyle: BedStyle; rugStyle: RugStyle }): string {
    const themes: { id: RoomTheme; label: string; icon: string; desc: string }[] = [
      { id: 'morning', label: 'Morning Light', icon: '🌅', desc: 'Soft golden sunlight & gentle morning birds.' },
      { id: 'afternoon', label: 'Bright Daylight', icon: '🌤️', desc: 'Crisp airy room with clear blue skies.' },
      { id: 'sunset', label: 'Sunset Glow', icon: '🌇', desc: 'Deep warm orange amber & glowing table lamp.' },
      { id: 'night', label: 'Starlight Night', icon: '🌙', desc: 'Calm moonlit window & cozy fairy string lights.' },
      { id: 'rainy', label: 'Cozy Rain', icon: '🌧️', desc: 'Gentle raindrops on glass and soothing mist.' },
    ];

    const bedStyles: { id: BedStyle; label: string; color: string }[] = [
      { id: 'woven', label: 'Woven Rattan Basket', color: '#C89F7D' },
      { id: 'fluffy', label: 'Pastel Cloud Cushion', color: '#FCD5CE' },
      { id: 'plaid', label: 'Botanical Sage Cot', color: '#588157' },
    ];

    const rugStyles: { id: RugStyle; label: string; color: string }[] = [
      { id: 'terracotta', label: 'Warm Terracotta Boho', color: '#C98262' },
      { id: 'sage', label: 'Soft Sage Botanical', color: '#829B76' },
      { id: 'boho', label: 'Cream Nordic Weave', color: '#D4A373' },
    ];

    return `
      <div class="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/35 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-[#E8DCCF] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <div class="p-4 sm:p-6 bg-[#F8F0E5] border-b border-[#E8DCCF] flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎨</span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-[#46372F] font-heading">Habitat & Room Customizer</h2>
              </div>
              <p class="text-xs sm:text-sm text-[#87776B] mt-0.5">Style your cozy sanctuary, window lighting, and furniture.</p>
            </div>
            <button id="btn-close-habitat" class="w-9 h-9 rounded-2xl bg-white border border-[#E8DCCF] text-[#46372F] hover:bg-[#F5D7BD] transition-all flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-left">
            
            <!-- Lighting & Window Themes -->
            <div>
              <h3 class="text-sm font-extrabold uppercase tracking-wider text-[#87776B] mb-3">Lighting & Atmosphere</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${themes
                  .map(
                    (t) => `
                  <button data-select-theme="${t.id}" class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      room.theme === t.id
                        ? 'bg-[#FFF4CC] border-[#EF6905] shadow-xs ring-2 ring-[#EF6905]/20'
                        : 'bg-white border-[#E8DCCF] hover:border-[#EF6905]/50'
                    }">
                    <span class="text-2xl">${t.icon}</span>
                    <div>
                      <div class="font-bold text-sm text-[#46372F] font-heading">${t.label}</div>
                      <div class="text-[11px] text-[#87776B] mt-0.5 leading-tight">${t.desc}</div>
                    </div>
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Pet Bed Styles -->
            <div>
              <h3 class="text-sm font-extrabold uppercase tracking-wider text-[#87776B] mb-3">Pet Bed Style</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                ${bedStyles
                  .map(
                    (b) => `
                  <button data-select-bed="${b.id}" class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      room.bedStyle === b.id
                        ? 'bg-[#FFF4CC] border-[#EF6905] ring-2 ring-[#EF6905]/20'
                        : 'bg-white border-[#E8DCCF] hover:border-[#EF6905]/50'
                    }">
                    <span class="w-4 h-4 rounded-full border border-black/10 shrink-0" style="background-color: ${b.color}"></span>
                    <span class="font-bold text-xs text-[#46372F]">${b.label}</span>
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Rug Styles -->
            <div>
              <h3 class="text-sm font-extrabold uppercase tracking-wider text-[#87776B] mb-3">Rug Design</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                ${rugStyles
                  .map(
                    (r) => `
                  <button data-select-rug="${r.id}" class="p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      room.rugStyle === r.id
                        ? 'bg-[#FFF4CC] border-[#EF6905] ring-2 ring-[#EF6905]/20'
                        : 'bg-white border-[#E8DCCF] hover:border-[#EF6905]/50'
                    }">
                    <span class="w-4 h-4 rounded-full border border-black/10 shrink-0" style="background-color: ${r.color}"></span>
                    <span class="font-bold text-xs text-[#46372F]">${r.label}</span>
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  private renderSettingsPanel(
    settings: { soundEnabled: boolean; browserNotifications: boolean; focusMode: boolean },
    user: { preferredName: string },
    pet: { name: string; species: PetSpecies }
  ): string {
    return `
      <div class="absolute inset-0 z-30 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/35 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl border border-[#E8DCCF] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          <div class="p-4 sm:p-6 bg-[#F8F0E5] border-b border-[#E8DCCF] flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl">⚙️</span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-[#46372F] font-heading">Settings & Preferences</h2>
              </div>
              <p class="text-xs sm:text-sm text-[#87776B] mt-0.5">Customize names, audio, and mindfulness preferences.</p>
            </div>
            <button id="btn-close-settings" class="w-9 h-9 rounded-2xl bg-white border border-[#E8DCCF] text-[#46372F] hover:bg-[#F5D7BD] transition-all flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-left">
            
            <!-- Names Form -->
            <div class="space-y-3">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#87776B]">Personalization</h3>
              <div>
                <label class="block text-xs font-bold text-[#46372F] mb-1">Your Preferred Name</label>
                <input id="input-user-name" type="text" value="${user.preferredName}" class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8DCCF] font-medium text-sm text-[#46372F] focus:outline-hidden focus:border-[#EF6905]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#46372F] mb-1">Pet's Name</label>
                <input id="input-pet-name" type="text" value="${pet.name}" class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8DCCF] font-medium text-sm text-[#46372F] focus:outline-hidden focus:border-[#EF6905]" />
              </div>
              <button id="btn-save-names" class="px-4 py-2 bg-[#46372F] hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                Save Names
              </button>
            </div>

            <hr class="border-[#E8DCCF]" />

            <!-- Audio & Toggles -->
            <div class="space-y-3">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#87776B]">Preferences</h3>
              
              <label class="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E8DCCF] cursor-pointer">
                <div>
                  <div class="font-bold text-xs sm:text-sm text-[#46372F]">Sound Effects & Chimes</div>
                  <div class="text-[11px] text-[#87776B]">Soft harmonic bell and happy pet sounds.</div>
                </div>
                <input type="checkbox" id="toggle-sound-pref" ${settings.soundEnabled ? 'checked' : ''} class="w-5 h-5 text-[#EF6905] rounded focus:ring-0" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E8DCCF] cursor-pointer">
                <div>
                  <div class="font-bold text-xs sm:text-sm text-[#46372F]">Focus Mode</div>
                  <div class="text-[11px] text-[#87776B]">Keep pet quietly resting during deep work sessions.</div>
                </div>
                <input type="checkbox" id="toggle-focus-pref" ${settings.focusMode ? 'checked' : ''} class="w-5 h-5 text-[#EF6905] rounded focus:ring-0" />
              </label>
            </div>

            <hr class="border-[#E8DCCF]" />

            <!-- Replay Onboarding or Reset -->
            <div class="space-y-2 pt-1">
              <button id="btn-replay-onboarding" class="w-full py-2.5 rounded-xl bg-[#F8F0E5] hover:bg-[#F5D7BD] text-[#46372F] font-bold text-xs border border-[#E8DCCF] transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <span>🔄</span> Switch Pet Companion (Dog / Cat)
              </button>
              <button id="btn-reset-demo" class="w-full py-2.5 rounded-xl bg-white hover:bg-red-50 text-[#C98262] hover:text-[#E63946] font-bold text-xs border border-[#E8DCCF] transition-all cursor-pointer">
                Reset Demo Data to Defaults
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  private renderAddReminderModal(): string {
    return `
      <div class="absolute inset-0 z-40 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-md rounded-3xl shadow-2xl border border-[#E8DCCF] p-5 sm:p-6 text-left animate-in fade-in zoom-in-95 duration-200">
          
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-extrabold text-[#46372F] font-heading">Add Mindful Habit</h3>
            <button id="btn-cancel-add-reminder" class="w-8 h-8 rounded-full bg-[#F8F0E5] text-[#87776B] hover:text-[#46372F] flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-[#46372F] mb-1">Title</label>
              <input id="input-rem-title" type="text" placeholder="e.g. Drink fresh water, 5-min breathing" class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8DCCF] text-sm text-[#46372F] focus:border-[#EF6905] focus:outline-hidden" />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#46372F] mb-1">Description (Optional)</label>
              <input id="input-rem-desc" type="text" placeholder="A gentle note or encouragement" class="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8DCCF] text-sm text-[#46372F] focus:border-[#EF6905] focus:outline-hidden" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#46372F] mb-1">Category</label>
                <select id="select-rem-cat" class="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DCCF] text-xs font-bold text-[#46372F] focus:border-[#EF6905] focus:outline-hidden">
                  <option value="self_care">Self-Care 💧</option>
                  <option value="wellbeing">Well-being 🌿</option>
                  <option value="productivity">Productivity ⚡</option>
                  <option value="learning">Learning 📚</option>
                  <option value="daily_routine">Daily Routine 🌅</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#46372F] mb-1">Time</label>
                <input id="input-rem-time" type="time" value="11:00" class="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DCCF] text-xs font-bold text-[#46372F] focus:border-[#EF6905] focus:outline-hidden" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#46372F] mb-1">Repeat Frequency</label>
              <select id="select-rem-freq" class="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DCCF] text-xs font-bold text-[#46372F] focus:border-[#EF6905] focus:outline-hidden">
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
                <option value="none">One Time</option>
              </select>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button id="btn-cancel-add-reminder-btn" class="px-4 py-2 rounded-xl bg-[#F8F0E5] hover:bg-[#F5D7BD] text-[#46372F] font-bold text-xs transition-all cursor-pointer">
                Cancel
              </button>
              <button id="btn-save-new-reminder" class="px-5 py-2 rounded-xl bg-[#EF6905] hover:bg-[#d65e04] text-white font-bold text-xs shadow-sm transition-all cursor-pointer">
                Save Habit
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderGrowthModal(pet: { name: string; species: PetSpecies; growthPoints: number; bondPoints: number; growthStage: number }, growth: { stage: number; nextMilestone: number; title: string }): string {
    const progressPercent = Math.min(100, Math.round((pet.growthPoints / growth.nextMilestone) * 100));

    const perks = [
      { stage: 1, title: 'Little One', desc: 'Cute playful puppy/kitten basics & greetings.' },
      { stage: 2, title: 'Growing Buddy', desc: 'Stylish neck bandana & extra playful hops.' },
      { stage: 3, title: 'Best Friend', desc: 'Cozy knitted sweater & deeper mindful connection.' },
      { stage: 4, title: 'Forever Companion', desc: 'Floral laurel crown & room aura of peace.' },
    ];

    return `
      <div class="absolute inset-0 z-40 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-md rounded-3xl shadow-2xl border border-[#E8DCCF] p-5 sm:p-6 text-left animate-in fade-in zoom-in-95 duration-200">
          
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🌱</span>
              <h3 class="text-xl font-extrabold text-[#46372F] font-heading">${pet.name}'s Growth Journey</h3>
            </div>
            <button id="btn-close-growth" class="w-8 h-8 rounded-full bg-[#F8F0E5] text-[#87776B] hover:text-[#46372F] flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-4 rounded-2xl bg-[#FFF4CC]/50 border border-[#E8DCCF] mb-4">
            <div class="flex items-center justify-between text-xs font-bold text-[#46372F]">
              <span>Stage ${growth.stage}: ${growth.title}</span>
              <span class="text-[#EF6905]">${pet.growthPoints} / ${growth.nextMilestone} pts</span>
            </div>
            <div class="w-full h-3 bg-white rounded-full overflow-hidden border border-[#E8DCCF] mt-1.5">
              <div class="h-full bg-gradient-to-r from-[#EF6905] to-[#829B76] rounded-full" style="width: ${progressPercent}%"></div>
            </div>
            <p class="text-[11px] text-[#87776B] mt-1.5">Bond points: <strong class="text-[#EF6905]">${pet.bondPoints}</strong> 💖 (Earned through daily care & check-ins)</p>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-[#87776B]">Growth Stages</h4>
            ${perks
              .map(
                (p) => `
              <div class="p-2.5 rounded-xl border flex items-center gap-3 ${
                pet.growthStage >= p.stage ? 'bg-white border-[#829B76]/50 shadow-xs' : 'bg-[#F8F0E5]/60 border-dashed border-[#E8DCCF] opacity-60'
              }">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  pet.growthStage >= p.stage ? 'bg-[#829B76] text-white' : 'bg-[#E8DCCF] text-[#87776B]'
                }">
                  ${pet.growthStage >= p.stage ? '✓' : p.stage}
                </div>
                <div>
                  <div class="font-bold text-xs text-[#46372F]">${p.title}</div>
                  <div class="text-[11px] text-[#87776B]">${p.desc}</div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderFeedModal(pet: { treatBalance: number; name: string; species: PetSpecies }): string {
    const isDog = pet.species === 'dog';
    const hungerInfo = db.calculateHunger();
    const treats = isDog
      ? [
          { name: 'Crunchy Bone Biscuit', icon: '🦴', desc: 'Baked with love and oats.' },
          { name: 'Heart Berry Snack', icon: '🍓', desc: 'Sweet antioxidant berry bites.' },
          { name: 'Golden Cheese Drop', icon: '🧀', desc: 'Savory treat for a good pup.' },
        ]
      : [
          { name: 'Crispy Salmon Nibble', icon: '🐟', desc: 'Fresh catnip and wild salmon.' },
          { name: 'Creamy Milk Drop', icon: '🥛', desc: 'Lactose-free kitten treat.' },
          { name: 'Tuna Flake Delight', icon: '🍣', desc: 'Crunchy seaside feast.' },
        ];

    return `
      <div class="absolute inset-0 z-40 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
        <div class="bg-[#FFFEF5] w-full max-w-sm rounded-3xl shadow-2xl border border-[#E8DCCF] p-5 sm:p-6 text-left animate-in fade-in zoom-in-95 duration-200">
          
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${hungerInfo.hungerPercent <= 10 ? '🚨' : hungerInfo.hungerPercent <= 30 ? '🥣' : '🍖'}</span>
              <h3 class="text-xl font-extrabold text-[#46372F] font-heading">Feed ${pet.name}</h3>
            </div>
            <button id="btn-close-feed" class="w-8 h-8 rounded-full bg-[#F8F0E5] text-[#87776B] hover:text-[#46372F] flex items-center justify-center font-bold text-sm cursor-pointer">
              ✕
            </button>
          </div>

          <!-- Pet Hunger Progress Card -->
          <div class="p-3.5 rounded-2xl bg-white border border-[#E8DCCF] mb-3.5 shadow-2xs">
            <div class="flex items-center justify-between text-xs font-black text-[#46372F]">
              <span>Pet Hunger / Fullness:</span>
              <span class="text-sm font-black" style="color: ${hungerInfo.urgencyColor};">${hungerInfo.hungerPercent}%</span>
            </div>
            <div class="w-full h-2.5 bg-[#F8F0E5] rounded-full overflow-hidden border border-[#E8DCCF] mt-1.5">
              <div class="h-full rounded-full transition-all duration-500" style="width: ${hungerInfo.hungerPercent}%; background-color: ${hungerInfo.urgencyColor};"></div>
            </div>
            <div class="text-[11px] font-bold mt-1.5 flex items-center justify-between" style="color: ${hungerInfo.urgencyColor};">
              <span>Status: ${hungerInfo.statusLabel}</span>
              ${hungerInfo.nextTaskMinutes !== undefined ? `<span class="text-[#87776B] text-[10px]">Next task: ${hungerInfo.nextTask?.time || '--'}</span>` : ''}
            </div>
          </div>

          <p class="text-xs text-[#87776B] mb-3 leading-relaxed">
            💡 <strong>Automatic Feeding:</strong> Completing any habit feeds ${pet.name} to <strong>100% full</strong>. You also have <strong class="text-[#EF6905]">${pet.treatBalance} treats</strong> for manual feeding!
          </p>

          ${
            pet.treatBalance <= 0
              ? `
            <div class="p-3.5 rounded-2xl bg-[#F8F0E5] text-center text-[#87776B]">
              <div class="text-3xl mb-1">🥣</div>
              <p class="font-bold text-xs text-[#46372F]">No bonus treats in inventory.</p>
              <p class="text-[11px] mt-1">Complete one of your daily wellness habits to automatically feed ${pet.name} to 100%!</p>
              <button id="btn-go-to-reminders-from-feed" class="mt-3 px-4 py-2 rounded-xl bg-[#EF6905] text-white font-bold text-xs shadow-xs cursor-pointer">
                View Habits & Feed 🐾
              </button>
            </div>
          `
              : `
            <div class="space-y-2">
              <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#87776B]">Give a Bonus Treat:</div>
              ${treats
                .map(
                  (t) => `
                <button data-give-treat class="w-full p-2.5 rounded-2xl border border-[#E8DCCF] hover:border-[#EF6905] hover:bg-[#FFF4CC]/50 text-left transition-all cursor-pointer flex items-center gap-3">
                  <span class="text-2xl">${t.icon}</span>
                  <div class="flex-1">
                    <div class="font-bold text-xs text-[#46372F] font-heading">${t.name}</div>
                    <div class="text-[10px] text-[#87776B]">${t.desc}</div>
                  </div>
                  <span class="text-xs font-extrabold text-[#829B76]">Feed (+100%)</span>
                </button>
              `
                )
                .join('')}
            </div>
          `
          }
        </div>
      </div>
    `;
  }

  private renderOnboardingModal(): string {
    const step = this.onboardingStep;
    const starterHabits = [
      { title: 'Drink a glass of water', icon: '💧', time: '10:00' },
      { title: 'Screen break & stretch', icon: '🌿', time: '12:30' },
      { title: 'Review top 3 priorities', icon: '⚡', time: '14:00' },
      { title: '10 minutes of learning or reading', icon: '📚', time: '16:30' },
      { title: 'Evening pause & wind down', icon: '🌅', time: '18:30' },
    ];

    return `
      <div class="absolute inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-[#FFFEF5] w-full max-w-lg rounded-3xl shadow-2xl border border-[#E8DCCF] overflow-hidden flex flex-col text-left">
          
          <!-- Header Bar with Steps -->
          <div class="p-4 sm:p-5 bg-[#F8F0E5] border-b border-[#E8DCCF] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🐾</span>
              <h2 class="text-lg sm:text-xl font-extrabold text-[#46372F] font-heading">Welcome to PAWSE</h2>
            </div>
            <span class="text-xs font-extrabold text-[#EF6905] bg-[#FFF4CC] px-2.5 py-1 rounded-full">Step ${step} of 4</span>
          </div>

          <div class="p-5 sm:p-7 overflow-y-auto max-h-[75vh]">
            
            <!-- STEP 1: Choose Pet (Dog or Cat) -->
            ${
              step === 1
                ? `
              <div class="space-y-4">
                <div class="text-center">
                  <h3 class="text-xl font-extrabold text-[#46372F] font-heading">Choose Your Companion</h3>
                  <p class="text-xs text-[#87776B] mt-1">Pick a furry friend to share daily mindful breaks with.</p>
                </div>

                <div class="grid grid-cols-2 gap-3.5 pt-2">
                  <button data-select-species="dog" class="p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    this.tempOnboardingData.species === 'dog'
                      ? 'bg-[#FFF4CC] border-[#EF6905] ring-2 ring-[#EF6905]/20 shadow-sm'
                      : 'bg-white border-[#E8DCCF] hover:border-[#EF6905]/50'
                  }">
                    <div class="text-4xl mb-2">🐶</div>
                    <div class="font-extrabold text-base text-[#46372F] font-heading">Dog</div>
                    <div class="text-[11px] text-[#87776B] mt-1">Cheerful, playful, loyal, and energetic tail wagger.</div>
                  </button>

                  <button data-select-species="cat" class="p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    this.tempOnboardingData.species === 'cat'
                      ? 'bg-[#FFF4CC] border-[#EF6905] ring-2 ring-[#EF6905]/20 shadow-sm'
                      : 'bg-white border-[#E8DCCF] hover:border-[#EF6905]/50'
                  }">
                    <div class="text-4xl mb-2">🐱</div>
                    <div class="font-extrabold text-base text-[#46372F] font-heading">Cat</div>
                    <div class="text-[11px] text-[#87776B] mt-1">Calm, curious, independent, and soothing purrs.</div>
                  </button>
                </div>
              </div>
            `
                : ''
            }

            <!-- STEP 2: Name Pet and User -->
            ${
              step === 2
                ? `
              <div class="space-y-4">
                <div class="text-center">
                  <h3 class="text-xl font-extrabold text-[#46372F] font-heading">Introductions</h3>
                  <p class="text-xs text-[#87776B] mt-1">What should we call each other in our cozy room?</p>
                </div>

                <div class="space-y-3 pt-2">
                  <div>
                    <label class="block text-xs font-bold text-[#46372F] mb-1">Your Pet's Name</label>
                    <input id="onboard-pet-name" type="text" value="${this.tempOnboardingData.petName}" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DCCF] font-bold text-sm text-[#46372F] focus:border-[#EF6905] focus:outline-hidden" />
                    <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span class="text-[10px] text-[#87776B]">Suggestions:</span>
                      ${['Milo', 'Luna', 'Mochi', 'Coco', 'Toffee', 'Biscuit']
                        .map(
                          (n) => `
                        <button data-pick-name="${n}" class="text-[10px] font-bold bg-[#F8F0E5] hover:bg-[#F5D7BD] px-2 py-0.5 rounded-md text-[#46372F] cursor-pointer">${n}</button>
                      `
                        )
                        .join('')}
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-[#46372F] mb-1">Your Name</label>
                    <input id="onboard-user-name" type="text" value="${this.tempOnboardingData.userName}" class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DCCF] font-bold text-sm text-[#46372F] focus:border-[#EF6905] focus:outline-hidden" placeholder="e.g. Alex" />
                    <p class="text-[11px] text-[#87776B] mt-1">Used for friendly personalized greetings from your pet.</p>
                  </div>
                </div>
              </div>
            `
                : ''
            }

            <!-- STEP 3: Suggested Habits -->
            ${
              step === 3
                ? `
              <div class="space-y-4">
                <div class="text-center">
                  <h3 class="text-xl font-extrabold text-[#46372F] font-heading">Select Daily Wellness Habits</h3>
                  <p class="text-xs text-[#87776B] mt-1">Pick a few gentle reminders to start with (you can change them anytime).</p>
                </div>

                <div class="space-y-2 pt-1">
                  ${starterHabits
                    .map(
                      (h, idx) => `
                    <label class="p-3 rounded-2xl border border-[#E8DCCF] bg-white flex items-center justify-between cursor-pointer hover:border-[#EF6905]/60 transition-all">
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">${h.icon}</span>
                        <div>
                          <div class="font-bold text-xs sm:text-sm text-[#46372F]">${h.title}</div>
                          <div class="text-[11px] text-[#87776B]">Scheduled at ${h.time}</div>
                        </div>
                      </div>
                      <input type="checkbox" data-onboard-habit="${idx}" ${
                        this.tempOnboardingData.selectedReminders.includes(idx) ? 'checked' : ''
                      } class="w-5 h-5 text-[#EF6905] rounded focus:ring-0" />
                    </label>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
                : ''
            }

            <!-- STEP 4: Ready to Enter Home! -->
            ${
              step === 4
                ? `
              <div class="text-center space-y-4 py-2">
                <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#EF6905] to-[#F5D7BD] flex items-center justify-center text-4xl shadow-md">
                  🏡
                </div>
                <div>
                  <h3 class="text-2xl font-extrabold text-[#46372F] font-heading">Our Little Home is Ready!</h3>
                  <p class="text-xs sm:text-sm text-[#87776B] mt-1 max-w-sm mx-auto">
                    Take care of your day, share gentle moments together, and watch ${this.tempOnboardingData.petName} grow alongside you.
                  </p>
                </div>
                <div class="p-3.5 rounded-2xl bg-[#FFF4CC]/60 border border-[#E8DCCF] text-xs text-[#46372F]">
                  💖 <strong>Core Promise:</strong> Missing a reminder will never hurt your pet or reset your bond. PAWSE is a calm companion, not another pressure.
                </div>
              </div>
            `
                : ''
            }

          </div>

          <!-- Footer Buttons -->
          <div class="p-4 sm:p-5 bg-[#F8F0E5] border-t border-[#E8DCCF] flex items-center justify-between">
            ${
              step > 1
                ? `
              <button id="btn-onboard-back" class="px-4 py-2 rounded-xl bg-white border border-[#E8DCCF] text-xs font-bold text-[#46372F] hover:bg-[#F5D7BD] transition-all cursor-pointer">
                Back
              </button>
            `
                : '<div></div>'
            }

            <button id="btn-onboard-next" class="px-6 py-2.5 rounded-xl bg-[#EF6905] hover:bg-[#d65e04] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer">
              ${step === 4 ? 'Enter Pet Room 🐾' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Toast Notification Message
  public showToast(message: string) {
    const toastContainer = document.getElementById('pawse-toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className =
      'px-4 py-2.5 rounded-2xl bg-white/95 text-[#46372F] font-bold text-xs shadow-lg border border-[#E8DCCF] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  private attachEventListeners() {
    // Navigation Tabs
    document.getElementById('nav-room')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.render();
    });
    document.getElementById('nav-reminders')?.addEventListener('click', () => {
      this.activeTab = 'reminders';
      this.render();
    });
    document.getElementById('nav-journal')?.addEventListener('click', () => {
      this.activeTab = 'journal';
      this.render();
    });
    document.getElementById('nav-habitat')?.addEventListener('click', () => {
      this.activeTab = 'habitat';
      this.render();
    });
    document.getElementById('nav-settings')?.addEventListener('click', () => {
      this.activeTab = 'settings';
      this.render();
    });

    // Mobile Navigation
    document.getElementById('m-nav-room')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.render();
    });
    document.getElementById('m-nav-reminders')?.addEventListener('click', () => {
      this.activeTab = 'reminders';
      this.render();
    });
    document.getElementById('m-nav-journal')?.addEventListener('click', () => {
      this.activeTab = 'journal';
      this.render();
    });
    document.getElementById('m-nav-habitat')?.addEventListener('click', () => {
      this.activeTab = 'habitat';
      this.render();
    });

    // Close drawers
    document.getElementById('btn-close-reminders')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.render();
    });
    document.getElementById('btn-close-journal')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.render();
    });
    document.getElementById('btn-close-habitat')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.render();
    });
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.render();
    });

    // Zen Mode
    document.getElementById('btn-zen-mode')?.addEventListener('click', () => {
      this.zenMode = true;
      this.render();
    });
    document.getElementById('btn-zen-restore')?.addEventListener('click', () => {
      this.zenMode = false;
      this.render();
    });

    // Audio toggle
    document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
      const s = db.getSettings();
      db.saveSettings({ soundEnabled: !s.soundEnabled });
      if (!s.soundEnabled) sound.playPop();
      this.render();
    });

    // Pet Hunger Badge in Header
    document.getElementById('btn-hunger-badge')?.addEventListener('click', () => {
      this.openFeedModal();
    });

    // Pet Growth Badge modal
    document.getElementById('btn-growth-badge')?.addEventListener('click', () => {
      this.isGrowthModalOpen = true;
      this.render();
    });
    document.getElementById('btn-close-growth')?.addEventListener('click', () => {
      this.isGrowthModalOpen = false;
      this.render();
    });

    // Treat Badge modal
    document.getElementById('btn-treat-badge')?.addEventListener('click', () => {
      this.openFeedModal();
    });
    document.getElementById('btn-close-feed')?.addEventListener('click', () => {
      this.isFeedModalOpen = false;
      this.render();
    });
    document.getElementById('btn-go-to-reminders-from-feed')?.addEventListener('click', () => {
      this.isFeedModalOpen = false;
      this.activeTab = 'reminders';
      this.render();
    });

    // Bottom Action Bar Buttons
    document.getElementById('btn-action-feed')?.addEventListener('click', () => {
      this.openFeedModal();
    });
    document.getElementById('btn-action-play')?.addEventListener('click', () => {
      this.script.playWithPet();
    });
    document.getElementById('btn-action-pet')?.addEventListener('click', () => {
      this.script.triggerPetAffection();
    });
    document.getElementById('btn-action-rest')?.addEventListener('click', () => {
      if (this.script.pet?.animState === 'sleeping') {
        this.script.wakePet();
      } else {
        this.script.restPet();
      }
    });
    document.getElementById('btn-action-quick-tasks')?.addEventListener('click', () => {
      this.activeTab = 'reminders';
      this.render();
    });

    // Give Treat in Feed Modal
    document.querySelectorAll('[data-give-treat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.isFeedModalOpen = false;
        this.script.feedPet();
      });
    });

    // Reminders Category Filter Pills
    document.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).dataset.cat as ReminderCategory | 'all';
        this.selectedCategory = cat;
        this.render();
      });
    });

    // Feed Pet & Complete Button on Reminder Card
    document.querySelectorAll('[data-feed-complete-rem]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).dataset.feedCompleteRem!;
        const rems = db.getReminders();
        const rem = rems.find((r) => r.id === id);
        if (!rem) return;

        db.updateReminder(id, {
          completedToday: true,
          completedAt: new Date().toISOString(),
        });

        this.script.celebrateReminderCompletion();
        this.showToast(`Completed "${rem.title}" & fed pet! Hunger restored to 100%! 🍖`);
        this.render();
      });
    });

    // Simulation Test Buttons for Rule Verification
    document.getElementById('btn-test-complete-feed')?.addEventListener('click', () => {
      const rems = db.getReminders();
      const firstUncompleted = rems.find((r) => !r.completedToday);
      if (firstUncompleted) {
        db.updateReminder(firstUncompleted.id, {
          completedToday: true,
          completedAt: new Date().toISOString(),
        });
        this.script.celebrateReminderCompletion();
        this.showToast(`Completed "${firstUncompleted.title}" & fed pet! Hunger restored to 100%! 🍖`);
      } else {
        this.script.feedPet(true);
        this.showToast('Pet fed! Hunger restored to 100%! 🍖');
      }
      this.render();
    });

    document.getElementById('btn-test-approaching')?.addEventListener('click', () => {
      const rems = db.getReminders();
      const firstUncompleted = rems.find((r) => !r.completedToday);
      const now = new Date();
      // Set time to now + 2 minutes
      const targetDate = new Date(now.getTime() + 2 * 60000);
      const targetTimeStr = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
      
      if (!firstUncompleted && rems.length > 0) {
        db.updateReminder(rems[0].id, { completedToday: false, time: targetTimeStr });
      } else if (firstUncompleted) {
        db.updateReminder(firstUncompleted.id, { time: targetTimeStr });
      }
      // Set lastFedTimestamp to 40 minutes ago so hunger has decayed towards 30%
      db.savePet({ lastFedTimestamp: now.getTime() - 40 * 60000 });
      this.showToast('Simulated: Next task is in 2m. Pet hunger decreased to ~30%! 🥣');
      this.render();
    });

    document.getElementById('btn-test-overdue')?.addEventListener('click', () => {
      const rems = db.getReminders();
      const firstUncompleted = rems.find((r) => !r.completedToday);
      const now = new Date();
      // Set time to now - 6 minutes (>5 min overdue!)
      const targetDate = new Date(now.getTime() - 6 * 60000);
      const targetTimeStr = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
      
      if (!firstUncompleted && rems.length > 0) {
        db.updateReminder(rems[0].id, { completedToday: false, time: targetTimeStr });
      } else if (firstUncompleted) {
        db.updateReminder(firstUncompleted.id, { time: targetTimeStr });
      }
      this.showToast('Simulated: Task is 6m overdue without feeding! Pet hunger dropped to 10%! ⚠️');
      this.render();
    });

    // Toggle Reminder Completion
    document.querySelectorAll('[data-toggle-rem]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.toggleRem!;
        const rems = db.getReminders();
        const rem = rems.find((r) => r.id === id);
        if (!rem) return;

        const nextState = !rem.completedToday;
        db.updateReminder(id, {
          completedToday: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
        });

        if (nextState) {
          this.script.celebrateReminderCompletion();
          this.showToast(`Completed "${rem.title}"! +${rem.treatReward} treat earned! 🎉`);
        }
        this.render();
      });
    });

    // Checklist Subtask Checkboxes
    document.querySelectorAll('[data-subtask-rem]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.currentTarget as HTMLInputElement;
        const remId = target.dataset.subtaskRem!;
        const subId = target.dataset.subtaskId!;
        const rems = db.getReminders();
        const rem = rems.find((r) => r.id === remId);
        if (!rem || !rem.checklist) return;

        const updatedChecklist = rem.checklist.map((c) =>
          c.id === subId ? { ...c, completed: target.checked } : c
        );

        // Check if all subtasks completed
        const allCompleted = updatedChecklist.every((c) => c.completed);
        db.updateReminder(remId, {
          checklist: updatedChecklist,
          completedToday: allCompleted,
        });

        if (allCompleted && !rem.completedToday) {
          this.script.celebrateReminderCompletion();
          this.showToast(`All subtasks complete! +${rem.treatReward} treats earned! 🌟`);
        }
        this.render();
      });
    });

    // Snooze Reminder
    document.querySelectorAll('[data-snooze-rem]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.snoozeRem!;
        const rem = db.getReminders().find((r) => r.id === id);
        if (rem) {
          this.showToast(`Snoozed "${rem.title}" for 10 minutes. 💤`);
        }
      });
    });

    // Delete Reminder
    document.querySelectorAll('[data-delete-rem]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.deleteRem!;
        db.deleteReminder(id);
        this.showToast('Reminder deleted.');
        this.render();
      });
    });

    // Add Reminder Modal Open/Close
    document.getElementById('btn-open-add-reminder')?.addEventListener('click', () => {
      this.isAddReminderOpen = true;
      this.render();
    });
    document.getElementById('btn-cancel-add-reminder')?.addEventListener('click', () => {
      this.isAddReminderOpen = false;
      this.render();
    });
    document.getElementById('btn-cancel-add-reminder-btn')?.addEventListener('click', () => {
      this.isAddReminderOpen = false;
      this.render();
    });

    // Save New Reminder
    document.getElementById('btn-save-new-reminder')?.addEventListener('click', () => {
      const titleInput = document.getElementById('input-rem-title') as HTMLInputElement;
      const descInput = document.getElementById('input-rem-desc') as HTMLInputElement;
      const catSelect = document.getElementById('select-rem-cat') as HTMLSelectElement;
      const timeInput = document.getElementById('input-rem-time') as HTMLInputElement;
      const freqSelect = document.getElementById('select-rem-freq') as HTMLSelectElement;

      if (!titleInput || !titleInput.value.trim()) {
        alert('Please enter a habit title.');
        return;
      }

      db.addReminder({
        title: titleInput.value.trim(),
        description: descInput ? descInput.value.trim() : undefined,
        category: (catSelect.value as ReminderCategory) || 'self_care',
        time: timeInput.value || '11:00',
        frequency: (freqSelect.value as RepeatFrequency) || 'daily',
        treatReward: 1,
      });

      this.isAddReminderOpen = false;
      this.showToast('New habit added to your schedule! 📝');
      this.render();
    });

    // Habitat Theme / Furniture Customizers
    document.querySelectorAll('[data-select-theme]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const theme = (e.currentTarget as HTMLElement).dataset.selectTheme as RoomTheme;
        this.script.setTheme(theme);
        this.showToast(`Switched atmosphere to ${theme}!`);
        this.render();
      });
    });
    document.querySelectorAll('[data-select-bed]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const style = (e.currentTarget as HTMLElement).dataset.selectBed as BedStyle;
        this.script.setBedStyle(style);
        this.showToast('Updated pet bed style!');
        this.render();
      });
    });
    document.querySelectorAll('[data-select-rug]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const style = (e.currentTarget as HTMLElement).dataset.selectRug as RugStyle;
        this.script.setRugStyle(style);
        this.showToast('Updated cozy rug design!');
        this.render();
      });
    });

    // Save Settings Names
    document.getElementById('btn-save-names')?.addEventListener('click', () => {
      const uInput = document.getElementById('input-user-name') as HTMLInputElement;
      const pInput = document.getElementById('input-pet-name') as HTMLInputElement;

      if (uInput && uInput.value.trim()) {
        db.saveUser({ preferredName: uInput.value.trim() });
      }
      if (pInput && pInput.value.trim()) {
        db.savePet({ name: pInput.value.trim() });
      }
      this.showToast('Names updated successfully!');
      this.render();
    });

    // Settings Toggles
    document.getElementById('toggle-sound-pref')?.addEventListener('change', (e) => {
      const checked = (e.currentTarget as HTMLInputElement).checked;
      db.saveSettings({ soundEnabled: checked });
    });
    document.getElementById('toggle-focus-pref')?.addEventListener('change', (e) => {
      const checked = (e.currentTarget as HTMLInputElement).checked;
      db.saveSettings({ focusMode: checked });
      if (checked) {
        this.script.restPet();
        this.showToast('Focus Mode on: Pet is resting quietly.');
      }
    });

    // Replay Onboarding
    document.getElementById('btn-replay-onboarding')?.addEventListener('click', () => {
      this.activeTab = 'room';
      this.isOnboardingOpen = true;
      this.onboardingStep = 1;
      this.render();
    });

    // Reset Demo Data
    document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
      if (confirm('Reset all PAWSE data to default cozy state?')) {
        db.resetData();
        window.location.reload();
      }
    });

    // Onboarding Wizard Controls
    document.querySelectorAll('[data-select-species]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const sp = (e.currentTarget as HTMLElement).dataset.selectSpecies as PetSpecies;
        this.tempOnboardingData.species = sp;
        this.tempOnboardingData.petName = sp === 'dog' ? 'Milo' : 'Luna';
        this.script.setPetSpecies(sp);
        this.render();
      });
    });

    document.querySelectorAll('[data-pick-name]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = (e.currentTarget as HTMLElement).dataset.pickName!;
        this.tempOnboardingData.petName = name;
        const petInput = document.getElementById('onboard-pet-name') as HTMLInputElement;
        if (petInput) petInput.value = name;
      });
    });

    document.getElementById('btn-onboard-back')?.addEventListener('click', () => {
      if (this.onboardingStep > 1) {
        this.onboardingStep--;
        this.render();
      }
    });

    document.getElementById('btn-onboard-next')?.addEventListener('click', () => {
      if (this.onboardingStep === 2) {
        const petInput = document.getElementById('onboard-pet-name') as HTMLInputElement;
        const userInput = document.getElementById('onboard-user-name') as HTMLInputElement;
        if (petInput && petInput.value.trim()) {
          this.tempOnboardingData.petName = petInput.value.trim();
        }
        if (userInput && userInput.value.trim()) {
          this.tempOnboardingData.userName = userInput.value.trim();
        }
      }

      if (this.onboardingStep < 4) {
        this.onboardingStep++;
        this.render();
      } else {
        // Complete Onboarding!
        db.saveUser({
          preferredName: this.tempOnboardingData.userName,
          hasCompletedOnboarding: true,
        });
        db.savePet({
          species: this.tempOnboardingData.species,
          name: this.tempOnboardingData.petName,
        });

        this.script.setPetSpecies(this.tempOnboardingData.species);
        this.isOnboardingOpen = false;
        this.showToast(`Welcome home, ${this.tempOnboardingData.userName}! ${this.tempOnboardingData.petName} is happy to meet you.`);
        this.render();
      }
    });
  }

  private openFeedModal() {
    this.isFeedModalOpen = true;
    this.render();
  }
}
