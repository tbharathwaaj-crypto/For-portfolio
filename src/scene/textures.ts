import * as THREE from 'three';

/**
 * Procedural texture utilities to ensure zero 404 external asset dependencies
 */

// Generate warm wooden floor plank texture
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base warm oak tone
  ctx.fillStyle = '#C89D7C';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankHeight = 128;
  const numPlanks = 1024 / plankHeight;

  for (let i = 0; i < numPlanks; i++) {
    const y = i * plankHeight;
    // Slight color variation per plank
    const variance = (Math.sin(i * 3.7) * 12 + 10);
    ctx.fillStyle = `rgb(${200 + variance}, ${157 + variance * 0.8}, ${124 + variance * 0.6})`;
    ctx.fillRect(0, y, 1024, plankHeight);

    // Wood grain lines
    ctx.strokeStyle = `rgba(130, 80, 50, 0.12)`;
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 14; g++) {
      ctx.beginPath();
      const gy = y + 10 + g * 8 + Math.sin(g) * 3;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(340, gy + (g % 2 === 0 ? 8 : -8), 680, gy + (g % 3 === 0 ? -6 : 6), 1024, gy);
      ctx.stroke();
    }

    // Plank seam / groove
    ctx.strokeStyle = '#754A30';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    // Vertical plank breaks staggered
    const offset = (i % 2) * 400 + (i % 3) * 120;
    for (let x = offset; x < 1024; x += 512) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + plankHeight);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Generate woven boho rug pattern texture
export function createRugTexture(style: 'terracotta' | 'sage' | 'boho' = 'terracotta'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColors = {
    terracotta: { bg: '#F8EFE6', border: '#C98262', accent: '#EF6905', dark: '#8C4E34' },
    sage: { bg: '#F0F5ED', border: '#829B76', accent: '#A3B899', dark: '#526647' },
    boho: { bg: '#FFFDF9', border: '#D8C7B5', accent: '#D4A373', dark: '#6B5848' },
  };

  const pal = baseColors[style];

  // Base background
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, 512, 512);

  // Outer border
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 472, 472);

  // Inner border
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 432, 432);

  // Geometric center diamond & chevron patterns
  ctx.fillStyle = pal.border;
  ctx.beginPath();
  ctx.moveTo(256, 100);
  ctx.lineTo(380, 256);
  ctx.lineTo(256, 412);
  ctx.lineTo(132, 256);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = pal.bg;
  ctx.beginPath();
  ctx.moveTo(256, 140);
  ctx.lineTo(340, 256);
  ctx.lineTo(256, 372);
  ctx.lineTo(172, 256);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(256, 256, 32, 0, Math.PI * 2);
  ctx.fill();

  // Woven fringe edges
  ctx.strokeStyle = pal.dark;
  ctx.lineWidth = 2;
  for (let x = 20; x <= 492; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 492);
    ctx.lineTo(x, 502);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate picturesque outdoor scenery for the window (hills, trees, clouds)
export function createWindowLandscapeTexture(theme: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const isNight = theme === 'night';
  const isSunset = theme === 'sunset';
  const isRainy = theme === 'rainy';
  const isMorning = theme === 'morning';

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
  if (isNight) {
    skyGrad.addColorStop(0, '#0B132B');
    skyGrad.addColorStop(0.6, '#1C2541');
    skyGrad.addColorStop(1, '#3A506B');
  } else if (isSunset) {
    skyGrad.addColorStop(0, '#3D2645');
    skyGrad.addColorStop(0.35, '#8338EC');
    skyGrad.addColorStop(0.65, '#FB5607');
    skyGrad.addColorStop(1, '#FFBE0B');
  } else if (isRainy) {
    skyGrad.addColorStop(0, '#4A5568');
    skyGrad.addColorStop(0.5, '#718096');
    skyGrad.addColorStop(1, '#A0AEC0');
  } else if (isMorning) {
    skyGrad.addColorStop(0, '#90CAF9');
    skyGrad.addColorStop(0.4, '#FFE082');
    skyGrad.addColorStop(1, '#FFCC80');
  } else {
    // Afternoon
    skyGrad.addColorStop(0, '#64B5F6');
    skyGrad.addColorStop(0.6, '#90CAF9');
    skyGrad.addColorStop(1, '#E3F2FD');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Celestial body: Sun or Moon
  if (isNight) {
    // Glowing crescent moon
    ctx.fillStyle = '#FFF8E7';
    ctx.beginPath();
    ctx.arc(800, 110, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0B132B';
    ctx.beginPath();
    ctx.arc(785, 100, 32, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars
    ctx.fillStyle = '#FFFFFF';
    for (let s = 0; s < 45; s++) {
      const sx = (s * 47) % 1024;
      const sy = (s * 31) % 240;
      const r = (s % 3 === 0) ? 2 : 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (isSunset) {
    // Large warm golden sun setting
    const sunGrad = ctx.createRadialGradient(512, 310, 10, 512, 310, 80);
    sunGrad.addColorStop(0, '#FFFFFF');
    sunGrad.addColorStop(0.4, '#FFD166');
    sunGrad.addColorStop(1, 'rgba(255, 112, 67, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(512, 310, 80, 0, Math.PI * 2);
    ctx.fill();
  } else if (!isRainy) {
    // Morning or afternoon soft glowing sun
    const sunX = isMorning ? 280 : 750;
    const sunY = isMorning ? 150 : 100;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 90);
    sunGrad.addColorStop(0, '#FFFFFF');
    sunGrad.addColorStop(0.3, '#FFF3B0');
    sunGrad.addColorStop(1, 'rgba(255, 235, 150, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft stylized clouds
  const cloudColor = isNight
    ? 'rgba(70, 90, 120, 0.35)'
    : isSunset
    ? 'rgba(255, 180, 140, 0.5)'
    : isRainy
    ? 'rgba(100, 115, 130, 0.7)'
    : 'rgba(255, 255, 255, 0.85)';

  ctx.fillStyle = cloudColor;
  function drawCloud(cx: number, cy: number, scale: number) {
    ctx.beginPath();
    ctx.arc(cx, cy, 26 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 25 * scale, cy - 10 * scale, 32 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 60 * scale, cy, 28 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 30 * scale, cy + 10 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCloud(180, 140, 1.2);
  drawCloud(420, 90, 1.5);
  drawCloud(720, 160, 1.1);
  drawCloud(890, 110, 0.9);

  // Distant soft blue mountain range
  ctx.fillStyle = isNight ? '#1E2D42' : isSunset ? '#6A385C' : isRainy ? '#52606D' : '#88A9C3';
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(160, 260);
  ctx.lineTo(340, 310);
  ctx.lineTo(520, 240);
  ctx.lineTo(720, 290);
  ctx.lineTo(890, 230);
  ctx.lineTo(1024, 280);
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();

  // Mid-ground soft green rolling hills
  ctx.fillStyle = isNight ? '#15242E' : isSunset ? '#57423F' : isRainy ? '#445347' : '#7FA069';
  ctx.beginPath();
  ctx.moveTo(0, 390);
  ctx.bezierCurveTo(240, 320, 400, 410, 620, 350);
  ctx.bezierCurveTo(800, 300, 940, 380, 1024, 360);
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();

  // Foreground vibrant lush rolling meadow
  ctx.fillStyle = isNight ? '#0E1A20' : isSunset ? '#402E2A' : isRainy ? '#384638' : '#6A934E';
  ctx.beginPath();
  ctx.moveTo(0, 440);
  ctx.bezierCurveTo(300, 390, 500, 470, 780, 420);
  ctx.bezierCurveTo(900, 400, 980, 430, 1024, 430);
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.closePath();
  ctx.fill();

  // Little stylized trees on horizon
  ctx.fillStyle = isNight ? '#081014' : isSunset ? '#2E1E1C' : isRainy ? '#29352A' : '#476931';
  for (let t = 0; t < 18; t++) {
    const tx = 60 + t * 54 + (t % 3) * 12;
    const ty = 405 + Math.sin(t * 1.8) * 20;
    ctx.beginPath();
    ctx.arc(tx, ty, 10 + (t % 4), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(tx - 1.5, ty + 6, 3, 10);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate cozy framed art canvas (minimalist botanical leaf art)
export function createPaintingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Warm cream linen canvas
  ctx.fillStyle = '#FBF8F2';
  ctx.fillRect(0, 0, 256, 320);

  // Modern abstract warm sun circle
  ctx.fillStyle = '#EF9A53';
  ctx.beginPath();
  ctx.arc(128, 110, 55, 0, Math.PI * 2);
  ctx.fill();

  // Terracotta organic arch
  ctx.strokeStyle = '#C98262';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 230, 60, Math.PI, 0);
  ctx.stroke();

  // Sage green stylized botanical leaf stem
  ctx.strokeStyle = '#627D56';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(128, 260);
  ctx.quadraticCurveTo(135, 160, 128, 70);
  ctx.stroke();

  // Leaves
  ctx.fillStyle = '#829B76';
  for (let l = 0; l < 5; l++) {
    const ly = 100 + l * 32;
    const side = (l % 2 === 0) ? 1 : -1;
    ctx.beginPath();
    ctx.ellipse(128 + side * 22, ly, 20, 9, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
