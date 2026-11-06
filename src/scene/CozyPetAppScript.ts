import * as THREE from 'three';
import * as xb from 'xrblocks';
import { PetModel } from './PetModel';
import { CozyRoom } from './CozyRoom';
import { db } from '../storage/db';
import { sound } from '../audio/soundManager';
import { PetSpecies, GrowthStage, RoomTheme, BedStyle, RugStyle } from '../types';

export class CozyPetAppScript extends xb.Script {
  public room!: CozyRoom;
  public pet!: PetModel;

  // Interactivity
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private hoveredTarget: string | null = null;

  // Movement & Targets
  private petTargetPos = new THREE.Vector3(0, 0.75, -1.7);
  private petTargetLook = new THREE.Vector3(0, 0, 1);
  private isMoving = false;
  private moveSpeed = 1.6;

  // Key locations in room (elevated to eye-level frustum)
  public readonly LOCATIONS = {
    RUG: new THREE.Vector3(0, 0.75, -1.7),
    BED: new THREE.Vector3(0.85, 0.75, -1.9),
    BOWL: new THREE.Vector3(-0.85, 0.75, -1.8),
    WINDOW: new THREE.Vector3(0, 0.75, -2.4),
  };

  // State timers
  private stateTimer = 0;
  private pendingReturnState: 'idle' | 'sleeping' = 'idle';

  // Callbacks
  public onPetInteracted?: (action: 'pet' | 'feed' | 'play' | 'sleep' | 'wake') => void;
  public onObjectSelected?: (objectName: string) => void;

  init() {
    const roomState = db.getRoom();
    const petState = db.getPet();

    // 1. Build Cozy Room at eye level
    this.room = new CozyRoom(roomState.theme, roomState.bedStyle, roomState.rugStyle);
    this.room.position.set(0, 0.75, 0);
    this.add(this.room);

    // 2. Build Pet Model at prime viewing location
    this.pet = new PetModel(petState.species, petState.growthStage);
    this.pet.position.copy(this.LOCATIONS.RUG);
    this.add(this.pet);

    // Initial camera placement for cozy room viewing
    if (xb.core.camera) {
      xb.core.camera.position.set(0, 1.45, 0.1);
      xb.core.camera.lookAt(0, 1.05, -1.7);
    }

    // Set up pointer event listeners on window
    this.setupPointerListeners();
  }

  private setupPointerListeners() {
    const onPointerMove = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onPointerDown = (e: MouseEvent) => {
      // Ignore if clicking UI elements (e.g. modals, buttons)
      const target = e.target as HTMLElement;
      if (target && target.closest('#pawse-ui-overlay')) {
        return;
      }
      this.handleSceneClick();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
  }

  private handleSceneClick() {
    if (!xb.core.camera) return;

    this.raycaster.setFromCamera(this.mouse, xb.core.camera);

    // Check intersection with Pet first
    const petHits = this.raycaster.intersectObjects([this.pet], true);
    if (petHits.length > 0) {
      this.triggerPetAffection();
      return;
    }

    // Check intersection with Interactive Room Furniture
    for (const [key, obj] of Object.entries(this.room.interactiveTargets)) {
      const hits = this.raycaster.intersectObjects([obj], true);
      if (hits.length > 0) {
        this.handleTargetClicked(key);
        return;
      }
    }
  }

  private handleTargetClicked(targetName: string) {
    if (targetName === 'bowl') {
      this.feedPet();
    } else if (targetName === 'bed') {
      if (this.pet.animState === 'sleeping') {
        this.wakePet();
      } else {
        this.restPet();
      }
    } else if (targetName === 'window') {
      this.petTargetPos.copy(this.LOCATIONS.WINDOW);
      this.isMoving = true;
      this.pet.animState = 'walking';
      this.pendingReturnState = 'idle';
      this.stateTimer = 4.0;
    }

    this.onObjectSelected?.(targetName);
  }

  // Pet Action: Stroke / Petting
  public triggerPetAffection() {
    sound.playPetReaction(this.pet.species);
    this.pet.animState = 'petting';
    this.pet.emitHeart();
    this.stateTimer = 2.4;
    this.pendingReturnState = 'idle';

    // Update Pet State in DB
    const currentPet = db.getPet();
    db.savePet({
      bondPoints: currentPet.bondPoints + 2,
      growthPoints: currentPet.growthPoints + 1,
      lastPettedAt: new Date().toISOString(),
      mood: 'happy',
    });

    this.onPetInteracted?.('pet');
  }

  // Pet Action: Feeding (Manual or Automatic on Task Completion)
  public feedPet(isTaskCompletion = false) {
    const petState = db.getPet();
    if (!isTaskCompletion && petState.treatBalance <= 0) {
      this.onPetInteracted?.('feed');
      return;
    }

    // Deduct treat if manual, restore hunger to 100%
    db.savePet({
      treatBalance: isTaskCompletion ? petState.treatBalance : Math.max(0, petState.treatBalance - 1),
      bondPoints: petState.bondPoints + 5,
      growthPoints: petState.growthPoints + 3,
      lastFedAt: new Date().toISOString(),
      lastFedTimestamp: Date.now(),
      hungerLevel: 100,
      mood: 'happy',
    });

    // Pet moves towards bowl
    this.petTargetPos.copy(this.LOCATIONS.BOWL);
    this.isMoving = true;
    this.pet.animState = 'walking';

    // After reaching bowl, eats
    setTimeout(() => {
      sound.playTreatMunch();
      this.pet.animState = 'eating';
      this.pet.emitHeart();
      this.stateTimer = 3.2;
      this.pendingReturnState = 'idle';

      // Then returns to rug
      setTimeout(() => {
        this.petTargetPos.copy(this.LOCATIONS.RUG);
        this.isMoving = true;
        this.pet.animState = 'walking';
      }, 3300);
    }, 900);

    this.onPetInteracted?.('feed');
  }

  // Pet Action: Play
  public playWithPet() {
    sound.playToyBounce();
    this.pet.animState = 'playing';
    this.stateTimer = 3.6;
    this.pendingReturnState = 'idle';

    const petState = db.getPet();
    db.savePet({
      bondPoints: petState.bondPoints + 4,
      growthPoints: petState.growthPoints + 2,
      mood: 'playful',
    });

    this.onPetInteracted?.('play');
  }

  // Pet Action: Rest / Sleep in Bed
  public restPet() {
    this.petTargetPos.copy(this.LOCATIONS.BED);
    this.isMoving = true;
    this.pet.animState = 'walking';

    setTimeout(() => {
      this.pet.animState = 'sleeping';
      this.pet.emitZzz();
      db.savePet({ mood: 'sleepy' });
    }, 1000);

    this.onPetInteracted?.('sleep');
  }

  // Pet Action: Wake up and return to Rug
  public wakePet() {
    this.pet.animState = 'stretching';
    setTimeout(() => {
      this.petTargetPos.copy(this.LOCATIONS.RUG);
      this.isMoving = true;
      this.pet.animState = 'walking';
      this.pendingReturnState = 'idle';
      this.stateTimer = 1.2;
      db.savePet({ mood: 'happy' });
    }, 600);

    this.onPetInteracted?.('wake');
  }

  // Pet Action: Celebration (on reminder completion) -> Feeds food to pet and resets hunger to 100%!
  public celebrateReminderCompletion() {
    sound.playChime();
    sound.playPetReaction(this.pet.species);

    // Automatically feed the pet food on task completion
    this.feedPet(true);

    const currentPet = db.getPet();
    const newGrowth = currentPet.growthPoints + 5;
    const { stage } = db.calculateGrowthStage(newGrowth);

    db.savePet({
      treatBalance: currentPet.treatBalance + 1, // also awards a bonus treat to inventory!
      bondPoints: currentPet.bondPoints + 5,
      growthPoints: newGrowth,
      growthStage: stage,
      lastFedTimestamp: Date.now(),
      hungerLevel: 100,
      mood: 'happy',
    });

    if (stage !== currentPet.growthStage) {
      this.setPetGrowthStage(stage);
      db.addJournalEntry({
        title: `Growth Milestone: Reached Stage ${stage}!`,
        description: `${currentPet.name} grew into a stronger, happier companion alongside your daily mindful habits.`,
        category: 'growth',
        badgeIcon: 'sparkles',
      });
    }
  }

  // Customization methods
  public setPetSpecies(species: PetSpecies) {
    this.pet.setSpecies(species);
  }

  public setPetGrowthStage(stage: GrowthStage) {
    this.pet.setGrowthStage(stage);
  }

  public setTheme(theme: RoomTheme) {
    this.room.updateLightingTheme(theme);
    db.saveRoom({ theme });
  }

  public setBedStyle(style: BedStyle) {
    this.room.updateBedStyle(style);
    db.saveRoom({ bedStyle: style });
  }

  public setRugStyle(style: RugStyle) {
    this.room.updateRugStyle(style);
    db.saveRoom({ rugStyle: style });
  }

  // XR Blocks Frame Update
  update() {
    const delta = xb.getDeltaTime();

    // Update Room animations (curtains, dust)
    this.room.update(delta);

    // Update Pet Animation
    this.pet.update(delta);

    // Handle Pet Movement
    if (this.isMoving) {
      const dist = this.pet.position.distanceTo(this.petTargetPos);
      if (dist > 0.05) {
        const dir = this.petTargetPos.clone().sub(this.pet.position).normalize();
        this.pet.position.addScaledVector(dir, this.moveSpeed * delta);

        // Turn towards movement direction
        const angle = Math.atan2(dir.x, dir.z);
        this.pet.rotation.y = THREE.MathUtils.damp(this.pet.rotation.y, angle, 8, delta);
      } else {
        this.pet.position.copy(this.petTargetPos);
        this.isMoving = false;
        if (this.pet.animState === 'walking') {
          this.pet.animState = this.pendingReturnState;
          if (this.petTargetPos.equals(this.LOCATIONS.RUG)) {
            this.pet.rotation.y = 0; // face user
          }
        }
      }
    }

    // State Timer (resets temporary actions like petting, eating, celebrating back to idle)
    if (this.stateTimer > 0) {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        if (!this.isMoving) {
          this.pet.animState = this.pendingReturnState;
        }
      }
    }

    // Head tracking cursor if close and idle
    if (xb.core.camera && (this.pet.animState === 'idle' || this.pet.animState === 'greeting')) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.mouse, xb.core.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.6);
      const targetPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, targetPoint);
      if (targetPoint) {
        this.pet.lookAtTarget(targetPoint);
      }
    }
  }

  // WebXR select handler (pinch / controller click)
  onSelectEnd(event: xb.SelectEvent) {
    if (this.pet.animState === 'sleeping') {
      this.wakePet();
    } else {
      this.triggerPetAffection();
    }
  }
}
