import * as THREE from 'three';
import { RoomTheme, BedStyle, RugStyle } from '../types';
import {
  createWoodFloorTexture,
  createRugTexture,
  createWindowLandscapeTexture,
  createPaintingTexture,
} from './textures';

export class CozyRoom extends THREE.Group {
  public theme: RoomTheme = 'afternoon';
  public bedStyle: BedStyle = 'woven';
  public rugStyle: RugStyle = 'terracotta';

  // Room references
  public floorMesh!: THREE.Mesh;
  public rugMesh!: THREE.Mesh;
  public windowMesh!: THREE.Mesh;
  public windowLandscapeMesh!: THREE.Mesh;
  public windowGlassMesh!: THREE.Mesh;
  public rainParticlesGroup!: THREE.Group;
  public curtainsGroup!: THREE.Group;
  public petBedGroup!: THREE.Group;
  public foodBowlMesh!: THREE.Mesh;
  public waterBowlMesh!: THREE.Mesh;
  public toyBasketGroup!: THREE.Group;
  public bookshelfGroup!: THREE.Group;
  public fairyLightsGroup!: THREE.Group;
  public tableLampLight!: THREE.PointLight;
  public sunLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public dustParticles!: THREE.Points;

  // Clickable interactive target markers
  public interactiveTargets: { [key: string]: THREE.Object3D } = {};

  private animTime = 0;

  constructor(theme: RoomTheme = 'afternoon', bedStyle: BedStyle = 'woven', rugStyle: RugStyle = 'terracotta') {
    super();
    this.theme = theme;
    this.bedStyle = bedStyle;
    this.rugStyle = rugStyle;
    this.name = 'CozyRoom';

    this.buildRoom();
    this.updateLightingTheme(this.theme);
  }

  private buildRoom() {
    // 1. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xFFFBF0, 0x9E8C78, 2.2);
    this.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xFFF3D6, 2.5);
    this.sunLight.position.set(2.5, 4.5, -1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 12;
    this.sunLight.shadow.camera.left = -3;
    this.sunLight.shadow.camera.right = 3;
    this.sunLight.shadow.camera.top = 3;
    this.sunLight.shadow.camera.bottom = -3;
    this.sunLight.shadow.bias = -0.0005;
    this.add(this.sunLight);

    // 2. Floor (Wood planks)
    const floorGeo = new THREE.PlaneGeometry(6.5, 6.5);
    const floorTex = createWoodFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.05,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.add(this.floorMesh);

    // 3. Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF7EFE5, // cozy warm cream
      roughness: 0.9,
    });

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.8), wallMat);
    backWall.position.set(0, 1.4, -2.65);
    backWall.receiveShadow = true;
    this.add(backWall);

    // Baseboard along back wall
    const baseboardGeo = new THREE.BoxGeometry(6.5, 0.14, 0.04);
    const woodTrimMat = new THREE.MeshStandardMaterial({ color: 0x8A5A3C, roughness: 0.6 });
    const baseboard = new THREE.Mesh(baseboardGeo, woodTrimMat);
    baseboard.position.set(0, 0.07, -2.63);
    this.add(baseboard);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 4.0), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-3.25, 2.0, 0);
    leftWall.receiveShadow = true;
    this.add(leftWall);

    // 4. Large Cozy Window & Outdoor Scenery
    this.buildWindow();

    // 5. Woven Rug
    this.buildRug();

    // 6. Pet Bed
    this.buildPetBed();

    // 7. Food & Water Bowls
    this.buildBowls();

    // 8. Bookshelf with Books & Plants
    this.buildBookshelf();

    // 9. Indoor Houseplants
    this.buildPlants();

    // 10. Table Lamp with warm point light
    this.buildTableLamp();

    // 11. Fairy Lights
    this.buildFairyLights();

    // 12. Floating Dust / Sunbeam Particles
    this.buildDustParticles();

    // 13. Framed Wall Art
    this.buildWallArt();
  }

  private buildWindow() {
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 0.95, -2.6);

    const winWidth = 2.4;
    const winHeight = 1.7;

    // Outdoor Scenery Plane behind window
    const sceneryTex = createWindowLandscapeTexture(this.theme);
    const sceneryMat = new THREE.MeshBasicMaterial({ map: sceneryTex });
    this.windowLandscapeMesh = new THREE.Mesh(new THREE.PlaneGeometry(winWidth * 1.05, winHeight * 1.05), sceneryMat);
    this.windowLandscapeMesh.position.set(0, 0, -0.06);
    windowGroup.add(this.windowLandscapeMesh);

    // Window Glass with subtle reflection/tint
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xEEF8FF,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.22,
    });
    this.windowGlassMesh = new THREE.Mesh(new THREE.PlaneGeometry(winWidth, winHeight), glassMat);
    windowGroup.add(this.windowGlassMesh);

    // Window Wooden Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x6E442B, roughness: 0.6 });

    // Outer Frame (Top, Bottom, Left, Right)
    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.16, 0.08, 0.08), frameMat);
    tMesh.position.set(0, winHeight / 2 + 0.04, 0.02);
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.32, 0.12, 0.16), frameMat);
    bMesh.position.set(0, -winHeight / 2 - 0.06, 0.06); // Sturdy window sill!
    const lMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, winHeight + 0.08, 0.08), frameMat);
    lMesh.position.set(-winWidth / 2 - 0.04, 0, 0.02);
    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, winHeight + 0.08, 0.08), frameMat);
    rMesh.position.set(winWidth / 2 + 0.04, 0, 0.02);

    // Center Mullions
    const vertMullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, winHeight, 0.04), frameMat);
    vertMullion.position.set(0, 0, 0.01);
    const horizMullion = new THREE.Mesh(new THREE.BoxGeometry(winWidth, 0.05, 0.04), frameMat);
    horizMullion.position.set(0, 0.08, 0.01);

    windowGroup.add(tMesh, bMesh, lMesh, rMesh, vertMullion, horizMullion);

    // Curtains on sides
    this.curtainsGroup = new THREE.Group();
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0xFDF6E2, // soft ivory linen
      roughness: 0.95,
      side: THREE.DoubleSide,
    });

    const curtainGeo = new THREE.CylinderGeometry(0.22, 0.28, winHeight + 0.2, 16, 1, true, 0, Math.PI);

    const leftCurtain = new THREE.Mesh(curtainGeo, curtainMat);
    leftCurtain.position.set(-winWidth / 2 - 0.1, 0, 0.1);
    leftCurtain.rotation.y = Math.PI / 4;

    const rightCurtain = new THREE.Mesh(curtainGeo, curtainMat);
    rightCurtain.position.set(winWidth / 2 + 0.1, 0, 0.1);
    rightCurtain.rotation.y = -Math.PI / 4;

    this.curtainsGroup.add(leftCurtain, rightCurtain);
    windowGroup.add(this.curtainsGroup);

    // Rain Streaks Group for rainy theme
    this.rainParticlesGroup = new THREE.Group();
    this.rainParticlesGroup.visible = this.theme === 'rainy';
    windowGroup.add(this.rainParticlesGroup);

    this.add(windowGroup);
    this.interactiveTargets['window'] = windowGroup;
  }

  private buildRug() {
    const rugGeo = new THREE.PlaneGeometry(1.8, 1.3);
    const rugTex = createRugTexture(this.rugStyle);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTex,
      roughness: 0.95,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.rugMesh = new THREE.Mesh(rugGeo, rugMat);
    this.rugMesh.rotation.x = -Math.PI / 2;
    this.rugMesh.position.set(0, 0.005, -1.7); // Center of resting zone
    this.rugMesh.receiveShadow = true;
    this.add(this.rugMesh);
  }

  public updateRugStyle(style: RugStyle) {
    this.rugStyle = style;
    const tex = createRugTexture(style);
    (this.rugMesh.material as THREE.MeshStandardMaterial).map = tex;
    (this.rugMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
  }

  private buildPetBed() {
    this.petBedGroup = new THREE.Group();
    this.petBedGroup.position.set(0.85, 0, -1.9);

    // Styles: Woven basket, fluffy donut, wooden plaid
    const isWoven = this.bedStyle === 'woven';
    const isFluffy = this.bedStyle === 'fluffy';

    const rimColor = isWoven ? 0xC89F7D : isFluffy ? 0xFCD5CE : 0x588157;
    const cushionColor = isWoven ? 0xFAF0CA : isFluffy ? 0xFFFAF0 : 0xE9D8A6;

    // Bed Rim (Torus ring)
    const rimMat = new THREE.MeshStandardMaterial({ color: rimColor, roughness: 0.85 });
    const rimGeo = new THREE.TorusGeometry(0.38, 0.09, 16, 28);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.09;
    rim.castShadow = true;
    rim.receiveShadow = true;
    this.petBedGroup.add(rim);

    // Soft Cushion inside
    const cushionMat = new THREE.MeshStandardMaterial({ color: cushionColor, roughness: 0.95 });
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.32, 0.08, 24), cushionMat);
    cushion.position.y = 0.05;
    cushion.receiveShadow = true;
    this.petBedGroup.add(cushion);

    // Cozy mini folded pastel blanket
    const blanketMat = new THREE.MeshStandardMaterial({ color: 0xF4A261, roughness: 0.9 });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.28), blanketMat);
    blanket.position.set(0.12, 0.08, -0.06);
    blanket.rotation.y = 0.25;
    this.petBedGroup.add(blanket);

    this.add(this.petBedGroup);
    this.interactiveTargets['bed'] = this.petBedGroup;
  }

  public updateBedStyle(style: BedStyle) {
    this.bedStyle = style;
    this.remove(this.petBedGroup);
    this.buildPetBed();
  }

  private buildBowls() {
    const bowlsGroup = new THREE.Group();
    bowlsGroup.position.set(-0.85, 0, -1.8);

    // Wood placement mat
    const matGeo = new THREE.BoxGeometry(0.65, 0.015, 0.38);
    const matMat = new THREE.MeshStandardMaterial({ color: 0xD4A373, roughness: 0.8 });
    const mat = new THREE.Mesh(matGeo, matMat);
    mat.position.y = 0.008;
    mat.receiveShadow = true;
    bowlsGroup.add(mat);

    // Ceramic Bowl Material
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25 });

    // 1. Food Bowl
    const bowlGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.07, 24, 1, false);
    this.foodBowlMesh = new THREE.Mesh(bowlGeo, ceramicMat);
    this.foodBowlMesh.position.set(-0.16, 0.045, 0);
    this.foodBowlMesh.castShadow = true;
    bowlsGroup.add(this.foodBowlMesh);

    // Food contents (kibble pellets)
    const foodMat = new THREE.MeshStandardMaterial({ color: 0x8C5332, roughness: 0.9 });
    const food = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), foodMat);
    food.scale.set(1, 0.35, 1);
    food.position.set(-0.16, 0.065, 0);
    bowlsGroup.add(food);

    // 2. Water Bowl
    this.waterBowlMesh = new THREE.Mesh(bowlGeo, ceramicMat);
    this.waterBowlMesh.position.set(0.16, 0.045, 0);
    this.waterBowlMesh.castShadow = true;
    bowlsGroup.add(this.waterBowlMesh);

    // Glistening water
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x70C1B3,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.75,
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.01, 20), waterMat);
    water.position.set(0.16, 0.065, 0);
    bowlsGroup.add(water);

    this.add(bowlsGroup);
    this.interactiveTargets['bowl'] = bowlsGroup;
  }

  private buildBookshelf() {
    this.bookshelfGroup = new THREE.Group();
    this.bookshelfGroup.position.set(-1.8, 0, -2.1);
    this.bookshelfGroup.rotation.y = Math.PI / 4;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x805238, roughness: 0.65 });

    // Vertical side panels
    const sideGeo = new THREE.BoxGeometry(0.06, 1.8, 0.42);
    const lSide = new THREE.Mesh(sideGeo, woodMat);
    lSide.position.set(-0.48, 0.9, 0);
    const rSide = new THREE.Mesh(sideGeo, woodMat);
    rSide.position.set(0.48, 0.9, 0);
    this.bookshelfGroup.add(lSide, rSide);

    // Shelves (Bottom, Middle, Top)
    const shelfGeo = new THREE.BoxGeometry(0.96, 0.04, 0.42);
    for (let s = 0; s < 4; s++) {
      const shelf = new THREE.Mesh(shelfGeo, woodMat);
      shelf.position.set(0, 0.1 + s * 0.52, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.bookshelfGroup.add(shelf);
    }

    // Books on Middle Shelf
    const bookColors = [0xEF476F, 0x118AB2, 0x06D6A0, 0xFFD166, 0x8338EC];
    for (let b = 0; b < 6; b++) {
      const bMat = new THREE.MeshStandardMaterial({ color: bookColors[b % bookColors.length] });
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.32, 0.26), bMat);
      book.position.set(-0.35 + b * 0.055, 0.78, 0);
      book.castShadow = true;
      this.bookshelfGroup.add(book);
    }

    // Small Potted Succulent on Top Shelf
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.04, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0xDF7A5E })
    );
    pot.position.set(0.28, 1.72, 0);
    const plant = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.06),
      new THREE.MeshStandardMaterial({ color: 0x588157, roughness: 0.7 })
    );
    plant.position.set(0.28, 1.81, 0);
    this.bookshelfGroup.add(pot, plant);

    this.add(this.bookshelfGroup);
    this.interactiveTargets['bookshelf'] = this.bookshelfGroup;
  }

  private buildPlants() {
    // Large Monstera / Fiddle Leaf in ceramic pot near the window
    const plantGroup = new THREE.Group();
    plantGroup.position.set(1.6, 0, -2.2);

    const potMat = new THREE.MeshStandardMaterial({ color: 0xEAE2B7, roughness: 0.5 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.42, 18), potMat);
    pot.position.y = 0.21;
    pot.castShadow = true;
    plantGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x386641,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    for (let l = 0; l < 7; l++) {
      const angle = (l / 7) * Math.PI * 2;
      const leafGeo = new THREE.SphereGeometry(0.22, 12, 10);
      leafGeo.scale(0.8, 0.08, 1.3);

      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 0.18, 0.45 + l * 0.06, Math.sin(angle) * 0.18);
      leaf.rotation.set(0.35, angle, 0.3);
      leaf.castShadow = true;
      plantGroup.add(leaf);
    }
    this.add(plantGroup);
  }

  private buildTableLamp() {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(1.5, 0, -1.4);

    // Small accent side table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x936639, roughness: 0.7 });
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 20), tableMat);
    tableTop.position.y = 0.68;
    tableTop.castShadow = true;
    lampGroup.add(tableTop);

    // 3 tapered table legs
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.68, 8), tableMat);
      leg.position.set(Math.cos(a) * 0.22, 0.34, Math.sin(a) * 0.22);
      leg.rotation.z = Math.cos(a) * 0.08;
      lampGroup.add(leg);
    }

    // Ceramic Lamp Base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xDDA15E, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 14), baseMat);
    base.scale.set(1, 1.4, 1);
    base.position.set(0, 0.85, 0);
    lampGroup.add(base);

    // Linen Lampshade
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xFEFAE0,
      roughness: 0.9,
      emissive: 0xFFE082,
      emissiveIntensity: 0.35,
    });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.24, 18, 1, true), shadeMat);
    shade.position.set(0, 1.1, 0);
    lampGroup.add(shade);

    // Warm glow light inside lamp
    this.tableLampLight = new THREE.PointLight(0xFFD166, 1.2, 5.0, 1.5);
    this.tableLampLight.position.set(0, 1.1, 0);
    lampGroup.add(this.tableLampLight);

    this.add(lampGroup);
  }

  private buildFairyLights() {
    this.fairyLightsGroup = new THREE.Group();
    this.fairyLightsGroup.position.set(0, 2.3, -2.63);

    const numBulbs = 18;
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xFFF3B0,
      emissive: 0xFFD166,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    for (let b = 0; b < numBulbs; b++) {
      const x = -2.8 + b * 0.33;
      const sag = Math.sin((b / numBulbs) * Math.PI) * 0.22;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), bulbMat);
      bulb.position.set(x, -sag, 0);
      this.fairyLightsGroup.add(bulb);
    }
    this.add(this.fairyLightsGroup);
  }

  private buildDustParticles() {
    const count = 35;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.5;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xFFF4CC,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.add(this.dustParticles);
  }

  private buildWallArt() {
    const artGroup = new THREE.Group();
    artGroup.position.set(-1.3, 1.25, -2.63);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.7 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.04), frameMat);
    artGroup.add(frame);

    const canvasTex = createPaintingTexture();
    const canvasMat = new THREE.MeshBasicMaterial({ map: canvasTex });
    const painting = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.72), canvasMat);
    painting.position.z = 0.025;
    artGroup.add(painting);

    this.add(artGroup);
  }

  public updateLightingTheme(theme: RoomTheme) {
    this.theme = theme;

    // Update landscape texture
    const tex = createWindowLandscapeTexture(theme);
    (this.windowLandscapeMesh.material as THREE.MeshBasicMaterial).map = tex;
    (this.windowLandscapeMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;

    if (this.rainParticlesGroup) {
      this.rainParticlesGroup.visible = theme === 'rainy';
    }

    switch (theme) {
      case 'morning':
        this.hemiLight.color.setHex(0xFFF9E6);
        this.hemiLight.groundColor.setHex(0xA89988);
        this.hemiLight.intensity = 2.4;

        this.sunLight.color.setHex(0xFFE4A0);
        this.sunLight.intensity = 2.6;
        this.sunLight.position.set(-2.0, 3.5, -1.5);

        this.tableLampLight.intensity = 0.2;
        break;

      case 'afternoon':
        this.hemiLight.color.setHex(0xFFFFFF);
        this.hemiLight.groundColor.setHex(0x9E8C78);
        this.hemiLight.intensity = 2.2;

        this.sunLight.color.setHex(0xFFF3D6);
        this.sunLight.intensity = 2.8;
        this.sunLight.position.set(2.5, 4.5, -1.8);

        this.tableLampLight.intensity = 0.3;
        break;

      case 'sunset':
        this.hemiLight.color.setHex(0xFFD4B2);
        this.hemiLight.groundColor.setHex(0x5A3D31);
        this.hemiLight.intensity = 1.8;

        this.sunLight.color.setHex(0xFF7A33);
        this.sunLight.intensity = 2.4;
        this.sunLight.position.set(3.0, 2.5, -2.0);

        this.tableLampLight.intensity = 1.4;
        break;

      case 'night':
        this.hemiLight.color.setHex(0x3A506B);
        this.hemiLight.groundColor.setHex(0x1C2541);
        this.hemiLight.intensity = 1.0;

        this.sunLight.color.setHex(0x64DFDF);
        this.sunLight.intensity = 0.6; // soft blue moonlight
        this.sunLight.position.set(-1.5, 3.5, -1.5);

        this.tableLampLight.intensity = 2.0; // cozy golden room lamp
        break;

      case 'rainy':
        this.hemiLight.color.setHex(0x94A3B8);
        this.hemiLight.groundColor.setHex(0x475569);
        this.hemiLight.intensity = 1.5;

        this.sunLight.color.setHex(0xCBD5E1);
        this.sunLight.intensity = 1.1;

        this.tableLampLight.intensity = 1.6;
        break;
    }
  }

  public update(delta: number) {
    this.animTime += delta;

    // Gentle curtain breeze sway
    if (this.curtainsGroup) {
      this.curtainsGroup.children.forEach((c, idx) => {
        c.rotation.z = Math.sin(this.animTime * 1.5 + idx * 1.5) * 0.04;
      });
    }

    // Subtle floating dust particle drift
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - delta * 0.04;
        if (y < 0.2) y = 2.6;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  }
}
