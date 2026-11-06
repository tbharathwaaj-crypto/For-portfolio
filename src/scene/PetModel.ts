import * as THREE from 'three';
import { PetSpecies, GrowthStage, PetAnimationState } from '../types';

/**
 * 3D Low-Poly Virtual Pet Model with faceted geometric styling and rich idle animation logic.
 */
export class PetModel extends THREE.Group {
  public species: PetSpecies;
  public stage: GrowthStage;
  public animState: PetAnimationState = 'idle';

  // Articulated low-poly nodes
  private baseGroup!: THREE.Group;
  private bodyMesh!: THREE.Mesh;
  private bellyMesh!: THREE.Mesh;
  private headGroup!: THREE.Group;
  private headMesh!: THREE.Mesh;
  private snoutMesh!: THREE.Mesh;
  private noseMesh!: THREE.Mesh;
  private leftEar!: THREE.Group;
  private rightEar!: THREE.Group;
  private leftEyeGroup!: THREE.Group;
  private rightEyeGroup!: THREE.Group;
  private leftEyelid!: THREE.Mesh;
  private rightEyelid!: THREE.Mesh;
  private tongueMesh!: THREE.Mesh;
  private collarGroup!: THREE.Group;
  private tailGroup!: THREE.Group;
  private tailSegments: THREE.Mesh[] = [];

  // Low-poly Limbs & Paws
  private frontLeftLeg!: THREE.Group;
  private frontRightLeg!: THREE.Group;
  private backLeftLeg!: THREE.Group;
  private backRightLeg!: THREE.Group;

  // Stage Accessories (Low-poly)
  private bandanaGroup!: THREE.Group;
  private sweaterMesh!: THREE.Mesh;
  private crownGroup!: THREE.Group;

  // Particle System (Hearts, Stars, Zzz)
  private particleGroup!: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    initialScale: number;
  }[] = [];

  // Idle Animation Clocks & Variables
  private animTime = 0;
  private blinkTimer = 2.8;
  private isBlinking = false;
  private earTwitchTimer = 4.2;
  private earTwitchActive = 0;
  private weightShiftTimer = 6.0;
  private weightShiftOffset = 0;
  private idleHeadTiltTimer = 3.5;
  private targetHeadEuler = new THREE.Euler(0, 0, 0);

  constructor(species: PetSpecies = 'dog', stage: GrowthStage = 1) {
    super();
    this.species = species;
    this.stage = stage;
    this.name = `LowPolyPet_${species}`;

    this.buildLowPolyModel();
    this.updateGrowthScale();
  }

  private buildLowPolyModel() {
    // Clear previous children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    const isDog = this.species === 'dog';

    // Warm cozy low-poly palette
    const furColor = isDog ? 0xE8A86B : 0xF5C7A9; // Warm honey gold vs peach cream
    const bellyColor = isDog ? 0xFFF1DD : 0xFFF8F0;
    const noseColor = isDog ? 0x2E1C14 : 0xE58C9D; // Dark espresso vs soft coral pink
    const earInnerColor = isDog ? 0xD48E55 : 0xF5ABB7;
    const collarColor = isDog ? 0xEF6905 : 0x3A86FF;
    const eyeColor = 0x22150E;

    // Materials with FLAT SHADING enabled for authentic low-poly facets
    const furMat = new THREE.MeshStandardMaterial({
      color: furColor,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: bellyColor,
      roughness: 0.85,
      metalness: 0.02,
      flatShading: true,
    });

    const noseMat = new THREE.MeshStandardMaterial({
      color: noseColor,
      roughness: 0.35,
      metalness: 0.1,
      flatShading: true,
    });

    const earInnerMat = new THREE.MeshStandardMaterial({
      color: earInnerColor,
      roughness: 0.75,
      flatShading: true,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: eyeColor,
      roughness: 0.15,
      metalness: 0.2,
      flatShading: true,
    });

    const specMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    // Root offset container
    this.baseGroup = new THREE.Group();
    this.baseGroup.position.y = 0;
    this.add(this.baseGroup);

    // 1. Low-Poly Torso (Faceted Icosahedron / Chamfered Prism)
    // 1 subdivision gives clean, recognizable low-poly triangular facets
    const bodyGeo = new THREE.IcosahedronGeometry(0.20, 1);
    this.bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    this.bodyMesh.scale.set(0.95, 1.15, 1.35);
    this.bodyMesh.position.set(0, 0.26, 0);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.baseGroup.add(this.bodyMesh);

    // Low-poly belly patch
    const bellyGeo = new THREE.IcosahedronGeometry(0.18, 1);
    this.bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
    this.bellyMesh.scale.set(0.85, 1.05, 1.12);
    this.bellyMesh.position.set(0, -0.01, 0.09);
    this.bodyMesh.add(this.bellyMesh);

    // 2. Low-Poly Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.44, 0.20);
    this.baseGroup.add(this.headGroup);

    const headGeo = new THREE.IcosahedronGeometry(0.175, 1);
    this.headMesh = new THREE.Mesh(headGeo, furMat);
    this.headMesh.scale.set(1.08, 1.0, 1.05);
    this.headMesh.castShadow = true;
    this.headMesh.receiveShadow = true;
    this.headGroup.add(this.headMesh);

    // Low-poly Snout
    const snoutGeo = isDog
      ? new THREE.CylinderGeometry(0.065, 0.09, 0.13, 6) // 6-sided faceted puppy muzzle
      : new THREE.CylinderGeometry(0.06, 0.08, 0.09, 5); // 5-sided cute cat muzzle
    this.snoutMesh = new THREE.Mesh(snoutGeo, bellyMat);
    if (isDog) {
      this.snoutMesh.rotation.x = Math.PI / 2;
      this.snoutMesh.position.set(0, -0.03, 0.15);
      this.snoutMesh.scale.set(1.1, 0.9, 0.95);
    } else {
      this.snoutMesh.rotation.x = Math.PI / 2.1;
      this.snoutMesh.position.set(0, -0.035, 0.13);
      this.snoutMesh.scale.set(1.15, 0.8, 0.9);
    }
    this.snoutMesh.castShadow = true;
    this.headGroup.add(this.snoutMesh);

    // Low-poly Nose Button
    const noseGeo = isDog
      ? new THREE.DodecahedronGeometry(0.032, 0) // faceted nose
      : new THREE.ConeGeometry(0.024, 0.028, 4); // 4-sided pyramid cat nose
    this.noseMesh = new THREE.Mesh(noseGeo, noseMat);
    if (isDog) {
      this.noseMesh.scale.set(1.2, 0.85, 0.8);
      this.noseMesh.position.set(0, 0.015, 0.22);
    } else {
      this.noseMesh.rotation.x = Math.PI;
      this.noseMesh.position.set(0, -0.015, 0.185);
    }
    this.headGroup.add(this.noseMesh);

    // Low-poly Tongue
    const tongueGeo = new THREE.BoxGeometry(0.045, 0.012, 0.06);
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xFF6B8B,
      roughness: 0.4,
      flatShading: true,
    });
    this.tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    this.tongueMesh.position.set(0, -0.08, 0.16);
    this.tongueMesh.rotation.x = 0.35;
    this.tongueMesh.visible = false;
    this.headGroup.add(this.tongueMesh);

    // Low-poly Eyes & Eyelids
    this.leftEyeGroup = this.createLowPolyEye(0.07, 0.05, 0.135, eyeMat, specMat, furMat);
    this.rightEyeGroup = this.createLowPolyEye(-0.07, 0.05, 0.135, eyeMat, specMat, furMat);
    this.headGroup.add(this.leftEyeGroup, this.rightEyeGroup);

    // Low-poly Ears
    this.leftEar = new THREE.Group();
    this.rightEar = new THREE.Group();

    if (isDog) {
      // Floppy low-poly faceted origami dog ears
      const earGeo = new THREE.ConeGeometry(0.06, 0.17, 5);
      earGeo.scale(1.0, 1.0, 0.55);

      const leftEarMesh = new THREE.Mesh(earGeo, furMat);
      leftEarMesh.position.set(0, -0.08, 0);
      leftEarMesh.rotation.z = Math.PI;
      leftEarMesh.castShadow = true;
      this.leftEar.add(leftEarMesh);

      const rightEarMesh = leftEarMesh.clone();
      this.rightEar.add(rightEarMesh);

      this.leftEar.position.set(0.14, 0.11, 0.03);
      this.leftEar.rotation.set(0.2, 0, -0.55);

      this.rightEar.position.set(-0.14, 0.11, 0.03);
      this.rightEar.rotation.set(0.2, 0, 0.55);
    } else {
      // Pointy low-poly triangular cat ears (4-sided cone pyramid)
      const catEarGeo = new THREE.ConeGeometry(0.068, 0.14, 4);
      catEarGeo.scale(1.1, 1.0, 0.55);

      const leftEarMesh = new THREE.Mesh(catEarGeo, furMat);
      leftEarMesh.position.set(0, 0.07, 0);
      leftEarMesh.castShadow = true;
      this.leftEar.add(leftEarMesh);

      // Pink inner facet
      const innerEarGeo = new THREE.ConeGeometry(0.046, 0.10, 4);
      innerEarGeo.scale(1.0, 1.0, 0.45);
      const leftInner = new THREE.Mesh(innerEarGeo, earInnerMat);
      leftInner.position.set(0, 0.06, 0.015);
      this.leftEar.add(leftInner);

      const rightEarMesh = leftEarMesh.clone();
      this.rightEar.add(rightEarMesh);
      const rightInner = leftInner.clone();
      this.rightEar.add(rightInner);

      this.leftEar.position.set(0.10, 0.14, 0.02);
      this.leftEar.rotation.set(-0.15, 0.12, -0.35);

      this.rightEar.position.set(-0.10, 0.14, 0.02);
      this.rightEar.rotation.set(-0.15, -0.12, 0.35);
    }
    this.headGroup.add(this.leftEar, this.rightEar);

    // 3. Low-Poly Collar & Shiny Bell
    this.collarGroup = new THREE.Group();
    const collarGeo = new THREE.TorusGeometry(0.135, 0.018, 5, 12);
    const collarMat = new THREE.MeshStandardMaterial({
      color: collarColor,
      roughness: 0.4,
      flatShading: true,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.rotation.x = Math.PI / 2.2;
    this.collarGroup.add(collarMesh);

    // Low-poly golden faceted bell/pendant
    const bellGeo = new THREE.DodecahedronGeometry(0.026, 0);
    const bellMat = new THREE.MeshStandardMaterial({
      color: 0xF5B700,
      metalness: 0.85,
      roughness: 0.2,
      flatShading: true,
    });
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.position.set(0, -0.06, 0.13);
    this.collarGroup.add(bellMesh);

    this.collarGroup.position.set(0, 0.34, 0.13);
    this.baseGroup.add(this.collarGroup);

    // 4. Low-Poly Limbs & Blocky Paws
    this.frontLeftLeg = this.createLowPolyLeg(0.11, 0.15, furMat, bellyMat);
    this.frontRightLeg = this.createLowPolyLeg(-0.11, 0.15, furMat, bellyMat);
    this.backLeftLeg = this.createLowPolyLeg(0.12, -0.14, furMat, bellyMat);
    this.backRightLeg = this.createLowPolyLeg(-0.12, -0.14, furMat, bellyMat);
    this.baseGroup.add(this.frontLeftLeg, this.frontRightLeg, this.backLeftLeg, this.backRightLeg);

    // 5. Low-Poly Segmented Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.28, -0.23);
    this.tailSegments = [];

    const numSegments = isDog ? 3 : 4;
    let parentSegment: THREE.Object3D = this.tailGroup;

    for (let s = 0; s < numSegments; s++) {
      const segLength = isDog ? 0.075 : 0.085;
      const segRadius = (isDog ? 0.038 : 0.026) * (1 - s * 0.18);
      // 5-sided faceted cylinder
      const segGeo = new THREE.CylinderGeometry(segRadius * 0.8, segRadius, segLength, 5);
      const segMesh = new THREE.Mesh(segGeo, furMat);
      segMesh.position.set(0, segLength * 0.5, -segLength * 0.35);
      segMesh.rotation.x = isDog ? -0.8 : -0.5;
      segMesh.castShadow = true;

      parentSegment.add(segMesh);
      this.tailSegments.push(segMesh);
      parentSegment = segMesh;
    }
    this.baseGroup.add(this.tailGroup);

    // 6. Low-Poly Stage Accessories
    this.bandanaGroup = this.createLowPolyBandana();
    this.bandanaGroup.position.set(0, 0.33, 0.16);
    this.bandanaGroup.visible = this.stage >= 2;
    this.baseGroup.add(this.bandanaGroup);

    const sweaterGeo = new THREE.IcosahedronGeometry(0.21, 1);
    const sweaterMat = new THREE.MeshStandardMaterial({
      color: 0x829B76,
      roughness: 0.9,
      flatShading: true,
    });
    this.sweaterMesh = new THREE.Mesh(sweaterGeo, sweaterMat);
    this.sweaterMesh.scale.set(1.0, 1.18, 1.30);
    this.sweaterMesh.position.set(0, 0.26, -0.01);
    this.sweaterMesh.visible = this.stage >= 3;
    this.baseGroup.add(this.sweaterMesh);

    this.crownGroup = this.createLowPolyCrown();
    this.crownGroup.position.set(0, 0.15, 0.02);
    this.crownGroup.visible = this.stage >= 4;
    this.headGroup.add(this.crownGroup);

    // 7. Particle container
    this.particleGroup = new THREE.Group();
    this.add(this.particleGroup);
  }

  private createLowPolyEye(
    x: number,
    y: number,
    z: number,
    eyeMat: THREE.Material,
    specMat: THREE.Material,
    furMat: THREE.Material
  ): THREE.Group {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(x, y, z);

    // 6-sided faceted eyeball
    const eyeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.02, 6);
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.rotation.x = Math.PI / 2;
    eyeGroup.add(eyeMesh);

    // White faceted catchlight
    const specGeo = new THREE.BoxGeometry(0.015, 0.015, 0.005);
    const spec = new THREE.Mesh(specGeo, specMat);
    spec.position.set(0.012, 0.012, 0.012);
    eyeGroup.add(spec);

    // Low-poly faceted eyelid for blinking
    const eyelidGeo = new THREE.BoxGeometry(0.085, 0.08, 0.015);
    const eyelidMesh = new THREE.Mesh(eyelidGeo, furMat);
    eyelidMesh.position.set(0, 0.04, 0.016);
    eyelidMesh.scale.set(1.0, 0.01, 1.0);
    eyeGroup.add(eyelidMesh);

    if (x > 0) {
      this.leftEyelid = eyelidMesh;
    } else {
      this.rightEyelid = eyelidMesh;
    }

    return eyeGroup;
  }

  private createLowPolyLeg(
    x: number,
    z: number,
    furMat: THREE.Material,
    pawMat: THREE.Material
  ): THREE.Group {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.14, z);

    // 5-sided faceted leg shaft
    const legGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.16, 5);
    const legMesh = new THREE.Mesh(legGeo, furMat);
    legMesh.castShadow = true;
    legMesh.position.set(0, -0.04, 0);
    legGroup.add(legMesh);

    // Blocky low-poly paw
    const pawGeo = new THREE.BoxGeometry(0.075, 0.04, 0.09);
    const pawMesh = new THREE.Mesh(pawGeo, pawMat);
    pawMesh.position.set(0, -0.11, 0.02);
    pawMesh.castShadow = true;
    legGroup.add(pawMesh);

    return legGroup;
  }

  private createLowPolyBandana(): THREE.Group {
    const group = new THREE.Group();
    const bandanaMat = new THREE.MeshStandardMaterial({
      color: 0xE63946,
      roughness: 0.8,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const shape = new THREE.Shape();
    shape.moveTo(-0.09, 0.02);
    shape.lineTo(0.09, 0.02);
    shape.lineTo(0, -0.12);
    shape.closePath();

    const bandanaGeo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(bandanaGeo, bandanaMat);
    mesh.rotation.x = 0.22;
    group.add(mesh);
    return group;
  }

  private createLowPolyCrown(): THREE.Group {
    const crown = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.12, 0.012, 4, 10);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x588157,
      roughness: 0.8,
      flatShading: true,
    });
    crown.add(new THREE.Mesh(ringGeo, ringMat));

    // Faceted low-poly flowers
    const colors = [0xF4A261, 0xE76F51, 0x2A9D8F, 0xE9C46A];
    for (let f = 0; f < 5; f++) {
      const a = (f / 5) * Math.PI * 2;
      const fMat = new THREE.MeshStandardMaterial({
        color: colors[f % colors.length],
        flatShading: true,
      });
      const fMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.024, 0), fMat);
      fMesh.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.015);
      crown.add(fMesh);
    }
    crown.rotation.x = Math.PI / 2.3;
    return crown;
  }

  public updateGrowthScale() {
    const scales = { 1: 0.9, 2: 1.05, 3: 1.22, 4: 1.35 };
    const s = scales[this.stage] || 1.0;
    this.scale.set(s, s, s);

    if (this.bandanaGroup) this.bandanaGroup.visible = this.stage >= 2;
    if (this.sweaterMesh) this.sweaterMesh.visible = this.stage >= 3;
    if (this.crownGroup) this.crownGroup.visible = this.stage >= 4;
  }

  public setGrowthStage(stage: GrowthStage) {
    this.stage = stage;
    this.updateGrowthScale();
  }

  public setSpecies(species: PetSpecies) {
    if (this.species !== species) {
      this.species = species;
      this.buildLowPolyModel();
      this.updateGrowthScale();
    }
  }

  public emitHeart() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#EF476F';
    ctx.beginPath();
    ctx.moveTo(32, 20);
    ctx.bezierCurveTo(32, 12, 22, 6, 12, 12);
    ctx.bezierCurveTo(0, 20, 8, 36, 32, 54);
    ctx.bezierCurveTo(56, 36, 64, 20, 52, 12);
    ctx.bezierCurveTo(42, 6, 32, 12, 32, 20);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(0.1, 0.1);
    const heart = new THREE.Mesh(geo, mat);

    heart.position.set(
      (Math.random() - 0.5) * 0.2,
      0.45 + Math.random() * 0.1,
      0.1 + (Math.random() - 0.5) * 0.2
    );

    this.particleGroup.add(heart);
    this.particles.push({
      mesh: heart,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        0.35 + Math.random() * 0.15,
        (Math.random() - 0.5) * 0.15
      ),
      life: 0,
      maxLife: 1.5,
      initialScale: 1.0,
    });
  }

  public emitZzz() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#90E0EF';
    ctx.font = 'bold 42px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(0.09, 0.09);
    const zzz = new THREE.Mesh(geo, mat);

    zzz.position.set(0.08, 0.45, 0.1);
    this.particleGroup.add(zzz);
    this.particles.push({
      mesh: zzz,
      velocity: new THREE.Vector3(0.05, 0.18, 0.02),
      life: 0,
      maxLife: 2.2,
      initialScale: 0.8,
    });
  }

  public lookAtTarget(worldPos: THREE.Vector3) {
    const local = worldPos.clone();
    this.worldToLocal(local);
    const dx = local.x;
    const dy = local.y - 0.44;
    const dz = local.z - 0.20;

    const yaw = Math.atan2(dx, dz);
    const pitch = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    this.targetHeadEuler.y = THREE.MathUtils.clamp(yaw, -0.7, 0.7);
    this.targetHeadEuler.x = THREE.MathUtils.clamp(pitch, -0.35, 0.35);
    this.targetHeadEuler.z = THREE.MathUtils.clamp(-yaw * 0.25, -0.25, 0.25);
  }

  /**
   * Main animation loop updating idle behaviors and state transitions.
   */
  public update(delta: number) {
    this.animTime += delta;
    const isDog = this.species === 'dog';
    const isSleeping = this.animState === 'sleeping';

    // 1. Natural Blinking Logic
    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      this.blinkTimer = 2.4 + Math.random() * 3.6;
    }

    if (isSleeping) {
      this.leftEyelid.scale.y = 1.0;
      this.rightEyelid.scale.y = 1.0;
    } else if (this.isBlinking) {
      this.leftEyelid.scale.y = 1.0;
      this.rightEyelid.scale.y = 1.0;
      if (this.blinkTimer > 2.2) {
        this.isBlinking = false;
      }
    } else {
      this.leftEyelid.scale.y = 0.01;
      this.rightEyelid.scale.y = 0.01;
    }

    // 2. Ear Twitch Timer for Idle Life
    this.earTwitchTimer -= delta;
    if (this.earTwitchTimer <= 0) {
      this.earTwitchActive = 0.35; // 350ms ear flick
      this.earTwitchTimer = 3.5 + Math.random() * 4.5;
    }
    if (this.earTwitchActive > 0) {
      this.earTwitchActive -= delta;
    }

    // 3. Weight Shifting Logic (shifting stance slightly during idle)
    this.weightShiftTimer -= delta;
    if (this.weightShiftTimer <= 0) {
      this.weightShiftOffset = (Math.random() - 0.5) * 0.04;
      this.weightShiftTimer = 5.0 + Math.random() * 4.0;
    }

    // 4. Subtle Ambient Head Tilts when Idle
    this.idleHeadTiltTimer -= delta;
    if (this.idleHeadTiltTimer <= 0) {
      if (this.animState === 'idle') {
        this.targetHeadEuler.z = (Math.random() - 0.5) * 0.25;
        this.targetHeadEuler.x = (Math.random() - 0.5) * 0.15;
      }
      this.idleHeadTiltTimer = 3.0 + Math.random() * 4.0;
    }

    // Smooth head damping
    this.headGroup.rotation.x = THREE.MathUtils.damp(this.headGroup.rotation.x, this.targetHeadEuler.x, 6, delta);
    this.headGroup.rotation.y = THREE.MathUtils.damp(this.headGroup.rotation.y, this.targetHeadEuler.y, 6, delta);
    this.headGroup.rotation.z = THREE.MathUtils.damp(this.headGroup.rotation.z, this.targetHeadEuler.z, 6, delta);

    // 5. State Machine & Idle Animation Logic
    switch (this.animState) {
      case 'idle': {
        // Rhythmic breathing: expansion and subtle Y rise
        const breath = Math.sin(this.animTime * 2.2);
        this.bodyMesh.scale.y = 1.15 + breath * 0.03;
        this.headGroup.position.y = 0.44 + breath * 0.01;

        // Weight shift
        this.baseGroup.position.x = THREE.MathUtils.damp(this.baseGroup.position.x, this.weightShiftOffset, 2, delta);

        // Low-poly tail wag / sway
        const wagSpeed = isDog ? 5.5 : 3.2;
        const wagAngle = isDog ? 0.35 : 0.24;
        const tailWag = Math.sin(this.animTime * wagSpeed) * wagAngle;
        this.tailGroup.rotation.y = tailWag;

        // Propagation along tail segments
        this.tailSegments.forEach((seg, idx) => {
          seg.rotation.y = Math.sin(this.animTime * wagSpeed - idx * 0.4) * (wagAngle * 0.4);
        });

        // Ear flick / twitch
        const earFlick = this.earTwitchActive > 0 ? Math.sin(this.earTwitchActive * 35) * 0.15 : 0;
        this.leftEar.rotation.z = (isDog ? -0.55 : -0.35) + Math.sin(this.animTime * 2) * 0.03 + earFlick;
        this.rightEar.rotation.z = (isDog ? 0.55 : 0.35) - Math.sin(this.animTime * 2) * 0.03 - earFlick * 0.5;

        this.tongueMesh.visible = false;
        break;
      }

      case 'greeting': {
        // Alert, happy perk up, rapid tail wag
        this.headGroup.rotation.z = Math.sin(this.animTime * 4) * 0.18;
        const wagSpeed = isDog ? 14.0 : 8.0;
        this.tailGroup.rotation.y = Math.sin(this.animTime * wagSpeed) * 0.65;
        this.bodyMesh.position.y = 0.26 + Math.abs(Math.sin(this.animTime * 5)) * 0.03;
        this.tongueMesh.visible = isDog;
        break;
      }

      case 'petting': {
        // Closed eyes, head leaning into hand, contented loving tail wag
        this.leftEyelid.scale.y = 0.95;
        this.rightEyelid.scale.y = 0.95;
        this.headGroup.position.y = 0.42;
        this.headGroup.rotation.z = 0.18;
        this.tailGroup.rotation.y = Math.sin(this.animTime * 8) * 0.5;
        this.tongueMesh.visible = isDog;

        if (Math.random() < 0.04) {
          this.emitHeart();
        }
        break;
      }

      case 'eating': {
        // Head dips down to bowl, rhythmic mouth chewing
        this.headGroup.position.y = 0.38 + Math.sin(this.animTime * 12) * 0.025;
        this.headGroup.rotation.x = -0.35;
        this.snoutMesh.scale.y = 0.95 + Math.sin(this.animTime * 14) * 0.1;
        this.tailGroup.rotation.y = Math.sin(this.animTime * 10) * 0.45;
        this.tongueMesh.visible = Math.sin(this.animTime * 14) > 0;
        break;
      }

      case 'playing': {
        // Playful pounce bounce
        const pounce = Math.sin(this.animTime * 7);
        this.bodyMesh.position.y = 0.26 + Math.abs(pounce) * 0.08;
        this.frontLeftLeg.rotation.x = -pounce * 0.5;
        this.frontRightLeg.rotation.x = pounce * 0.5;
        this.tailGroup.rotation.y = Math.sin(this.animTime * 16) * 0.7;
        this.tongueMesh.visible = true;
        break;
      }

      case 'celebrating': {
        // Jump with paws raised
        const jump = Math.sin(this.animTime * 8);
        this.position.y = Math.max(0, jump * 0.12);
        this.frontLeftLeg.rotation.x = -0.6;
        this.frontRightLeg.rotation.x = -0.6;
        this.tailGroup.rotation.y = Math.sin(this.animTime * 20) * 0.8;
        this.tongueMesh.visible = isDog;

        if (Math.random() < 0.06) {
          this.emitHeart();
        }
        break;
      }

      case 'sleeping': {
        // Deep rhythmic breathing curled in bed
        const deepBreath = Math.sin(this.animTime * 1.4);
        this.bodyMesh.scale.set(0.95 + deepBreath * 0.03, 1.05 + deepBreath * 0.04, 1.3);
        this.headGroup.position.set(0, 0.36, 0.22);
        this.headGroup.rotation.set(-0.25, 0, 0.15);
        this.tailGroup.rotation.y = 0.2;
        this.tongueMesh.visible = false;

        if (Math.random() < 0.02) {
          this.emitZzz();
        }
        break;
      }

      case 'stretching': {
        // Morning stretch
        this.frontLeftLeg.rotation.x = 0.4;
        this.frontRightLeg.rotation.x = 0.4;
        this.bodyMesh.position.y = 0.22;
        this.headGroup.rotation.x = -0.2;
        break;
      }
    }

    // 6. Particle System Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      const progress = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1.0 - progress;
      p.mesh.scale.setScalar(p.initialScale * (1.0 + progress * 0.4));

      if (progress >= 1.0) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        mat.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.particles.forEach((p) => {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
  }
}
