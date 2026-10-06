// ══════════════════════════════════════════════════════
// SGS AIM Native — Cartes 3D Haute Fidélité & Système Infini
// ══════════════════════════════════════════════════════

import * as THREE from "three";
import type { AimMapId } from "./types";

export interface CollisionBox {
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
  isRamp?: boolean;
  rampAngle?: number;
  rampStartY?: number;
  rampEndY?: number;
  rampZStart?: number;
  rampZEnd?: number;
  isJumpPad?: boolean;
  jumpBoostY?: number;
  jumpBoostZ?: number;
}

export interface MapEnvironmentResult {
  cleanup: () => void;
  collisionBoxes: CollisionBox[];
  generateMoreChunks?: (currentZ: number) => void;
}

export interface AimMapDef {
  id: AimMapId;
  name: string;
  tagline: string;
  description: string;
  ambientColor: number;
  fogDensity: number;
  floorColor: number;
  wallColor: number;
}

export const MAPS: Record<AimMapId, AimMapDef> = {
  infinite_highway: {
    id: "infinite_highway",
    name: "Cyber Highway (Parkour Infini)",
    tagline: "Autoroute cybernétique procédurale sans fin",
    description: "Parcours d'assaut infini avec rampes lumineuses, sauts au-dessus du vide, portes laser et cibles d'entraînement.",
    ambientColor: 0xe2e8f0,
    fogDensity: 0.008,
    floorColor: 0x0c0f1d,
    wallColor: 0x161b30,
  },
  range: {
    id: "range",
    name: "The Range (Stand Officiel)",
    tagline: "Stand d'entraînement Valorant officiel",
    description: "Architecture en pierre et bois avec couloirs de tir, marques au sol à 10m, 20m, 30m, 50m et mur d'impact.",
    ambientColor: 0xffffff,
    fogDensity: 0.012,
    floorColor: 0x111827,
    wallColor: 0x1f2937,
  },
  arena: {
    id: "arena",
    name: "Cyber Neon Arena",
    tagline: "Arène circulaire e-sport 360°",
    description: "Arène ouverte avec 8 monolithes holographiques, sol réactif et gradins néon.",
    ambientColor: 0xdbeafe,
    fogDensity: 0.014,
    floorColor: 0x0a101d,
    wallColor: 0x151f32,
  },
  corridor: {
    id: "corridor",
    name: "Corridor Tactique (Site Peek)",
    tagline: "Couloir d'assaut tactique avec angles 90°",
    description: "Couloir étroit avec caisses de couverture en radianite, obstacles et recoins conçus pour le contre-strafe.",
    ambientColor: 0xfef08a,
    fogDensity: 0.018,
    floorColor: 0x171923,
    wallColor: 0x1f2433,
  },
  sky_dome: {
    id: "sky_dome",
    name: "Ciel Infini (Sky Dome)",
    tagline: "Plateforme flottante sous voûte céleste",
    description: "Plateforme hexagonale flottante dans l'espace avec dôme d'étoiles scintillant et orbes en suspension.",
    ambientColor: 0xf5d0fe,
    fogDensity: 0.01,
    floorColor: 0x0f0b24,
    wallColor: 0x221742,
  },
  city: {
    id: "city",
    name: "Zone Urbaine (Ascent Yard)",
    tagline: "Cour industrielle avec containers maritimes",
    description: "Zone de combat industrielle avec containers métalliques, structures en béton et zones de couverture.",
    ambientColor: 0xccfbf1,
    fogDensity: 0.014,
    floorColor: 0x0d1f26,
    wallColor: 0x162c36,
  },
};

/**
 * Créateur de cibles robotiques haute fidélité (style bot d'entraînement KAY/O Valorant)
 */
export function createRoboticBotGroup(scale: number = 1.0, accentHex: string = "#ff4655"): {
  group: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const accent = parseInt(accentHex.replace("#", ""), 16);

  // 1. Base / Piédestal métallique
  const baseGeo = new THREE.CylinderGeometry(0.4 * scale, 0.45 * scale, 0.25 * scale, 16);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.125 * scale;
  group.add(base);

  // Anneau lumineux au sol sous le bot
  const baseRingGeo = new THREE.TorusGeometry(0.5 * scale, 0.03 * scale, 8, 24);
  const baseRingMat = new THREE.MeshBasicMaterial({ color: accent });
  const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.02 * scale;
  group.add(baseRing);

  // 2. Colonne vertébrale / Tronc inférieur
  const spineGeo = new THREE.CylinderGeometry(0.18 * scale, 0.2 * scale, 0.5 * scale, 12);
  const spineMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.y = 0.45 * scale;
  group.add(spine);

  // 3. Plastron de Torse (Hitbox Corps)
  const chestGeo = new THREE.BoxGeometry(0.7 * scale, 0.8 * scale, 0.45 * scale);
  const chestMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.25,
  });
  const bodyMesh = new THREE.Mesh(chestGeo, chestMat);
  bodyMesh.position.y = 1.05 * scale;
  group.add(bodyMesh);

  // Cœur énergétique réacteur au centre du torse
  const coreGeo = new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.46 * scale, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: accent });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.x = Math.PI / 2;
  core.position.y = 1.1 * scale;
  group.add(core);

  // Épaulières blindées
  [-0.42 * scale, 0.42 * scale].forEach((shoulderX) => {
    const padGeo = new THREE.BoxGeometry(0.18 * scale, 0.28 * scale, 0.38 * scale);
    const pad = new THREE.Mesh(padGeo, baseMat);
    pad.position.set(shoulderX, 1.35 * scale, 0);
    group.add(pad);
  });

  // Cou métallique
  const neckGeo = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.18 * scale, 12);
  const neck = new THREE.Mesh(neckGeo, spineMat);
  neck.position.y = 1.5 * scale;
  group.add(neck);

  // 4. Tête du Bot (Hitbox Headshot précise)
  const headRadius = 0.22 * scale;
  const headGeo = new THREE.SphereGeometry(headRadius, 18, 18);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.15,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.y = (1.55 + headRadius) * scale;
  group.add(headMesh);

  // Visière lumineuse rougeoyante (Visor frontal)
  const visorGeo = new THREE.BoxGeometry(0.24 * scale, 0.08 * scale, 0.12 * scale);
  const visorMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 1.2,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, (1.55 + headRadius) * scale, 0.16 * scale);
  group.add(visor);

  return { group, headMesh, bodyMesh };
}

/**
 * Créateur d'Orbes d'énergie lumineuse haute fidélité
 */
export function createHolographicOrbGroup(radius: number, colorHex: string): {
  group: THREE.Group;
  orbMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const col = new THREE.Color(colorHex);

  // 1. Cœur d'énergie interne
  const coreGeo = new THREE.SphereGeometry(radius * 0.7, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // 2. Sphère plasma extérieure translucide
  const orbGeo = new THREE.SphereGeometry(radius, 24, 24);
  const orbMat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.88,
    metalness: 0.3,
    roughness: 0.1,
  });
  const orbMesh = new THREE.Mesh(orbGeo, orbMat);
  group.add(orbMesh);

  // 3. Anneau gyro orbital
  const ringGeo = new THREE.TorusGeometry(radius * 1.35, 0.025, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: col });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  return { group, orbMesh };
}

/**
 * Construit l'environnement 3D avec collisions solides infranchissables
 */
export function buildMapEnvironment(
  scene: THREE.Scene,
  mapId: AimMapId,
  themeAccentHex: string = "#ff4655",
  themeBgHex: string = "#0a0e13"
): MapEnvironmentResult {
  const mapDef = MAPS[mapId] || MAPS.range;
  const accent = parseInt(themeAccentHex.replace("#", ""), 16);
  const bg = parseInt(themeBgHex.replace("#", ""), 16);

  const createdObjects: THREE.Object3D[] = [];
  const collisionBoxes: CollisionBox[] = [];

  // Helper pour ajouter une boîte solide infranchissable
  const addSolidBlock = (
    id: string,
    w: number,
    h: number,
    d: number,
    pos: THREE.Vector3,
    color: number = mapDef.wallColor,
    neonColor?: number
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    createdObjects.push(mesh);

    // Néon décoratif optionnel sur les arêtes supérieures
    if (neonColor !== undefined) {
      const stripGeo = new THREE.BoxGeometry(w + 0.02, 0.08, d + 0.02);
      const stripMat = new THREE.MeshBasicMaterial({ color: neonColor });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(pos.x, pos.y + h / 2, pos.z);
      scene.add(strip);
      createdObjects.push(strip);
    }

    collisionBoxes.push({
      id,
      min: new THREE.Vector3(pos.x - w / 2, pos.y - h / 2, pos.z - d / 2),
      max: new THREE.Vector3(pos.x + w / 2, pos.y + h / 2, pos.z + d / 2),
    });

    return mesh;
  };

  // ════════════════════════════════════════════════════
  // 1. CARTE RUNNER : "infinite_highway" (Parkour Véritablement Infini)
  // ════════════════════════════════════════════════════
  if (mapId === "infinite_highway") {
    const highwayWidth = 14;
    let furthestChunkZ = 10;

    // Générateur procédural de segments de piste
    const spawnHighwayChunk = (zStart: number, zEnd: number, height: number, type: "flat" | "ramp" | "gap" | "crates") => {
      const length = Math.abs(zStart - zEnd);
      const centerZ = (zStart + zEnd) / 2;

      if (type === "gap") {
        // Gouffre dans le vide à sauter avec Space !
        // Afficher des balises d'avertissement laser
        addSolidBlock(`gap-L-${centerZ}`, 0.6, 3, 0.6, new THREE.Vector3(-highwayWidth / 2, height + 1.5, zStart), 0x111827, 0xf59e0b);
        addSolidBlock(`gap-R-${centerZ}`, 0.6, 3, 0.6, new THREE.Vector3(highwayWidth / 2, height + 1.5, zStart), 0x111827, 0xf59e0b);

        // Tremplin de Propulsion Néon (Jump Pad) situé 2m avant le bord du vide
        const padWidth = 8;
        const padLength = 3.5;
        const padZ = zStart + 2.0;

        // Socle Jump Pad
        const padBaseGeo = new THREE.BoxGeometry(padWidth, 0.12, padLength);
        const padBaseMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.3,
          metalness: 0.8,
        });
        const padBase = new THREE.Mesh(padBaseGeo, padBaseMat);
        padBase.position.set(0, height + 0.06, padZ);
        scene.add(padBase);
        createdObjects.push(padBase);

        // Surface lumineuse Cyan
        const padGlowGeo = new THREE.BoxGeometry(padWidth - 0.4, 0.06, padLength - 0.4);
        const padGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const padGlow = new THREE.Mesh(padGlowGeo, padGlowMat);
        padGlow.position.set(0, height + 0.14, padZ);
        scene.add(padGlow);
        createdObjects.push(padGlow);

        // Chevrons néon indicateurs de propulsion vers l'avant (-Z)
        for (let a = -1.0; a <= 1.0; a += 1.0) {
          const arrowGeo = new THREE.ConeGeometry(0.5, 0.9, 3);
          const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const arrow = new THREE.Mesh(arrowGeo, arrowMat);
          arrow.rotation.x = -Math.PI / 2;
          arrow.position.set(0, height + 0.18, padZ + a);
          scene.add(arrow);
          createdObjects.push(arrow);
        }

        // Enregistrement de la zone de déclenchement du Jump Pad
        collisionBoxes.push({
          id: `jump-pad-${centerZ}`,
          min: new THREE.Vector3(-padWidth / 2, height - 0.2, padZ - padLength / 2),
          max: new THREE.Vector3(padWidth / 2, height + 1.5, padZ + padLength / 2),
          isJumpPad: true,
          jumpBoostY: 8.5,
          jumpBoostZ: 14.0,
        });

        return;
      }

      if (type === "ramp") {
        // Rampe solide ascendante
        const rampRise = 3.5;
        const rampStartY = height;
        const rampEndY = height + rampRise;
        const centerY = (rampStartY + rampEndY) / 2;

        const rampGeo = new THREE.BoxGeometry(highwayWidth, 0.5, length);
        const rampMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.4,
          metalness: 0.6,
        });
        const rampMesh = new THREE.Mesh(rampGeo, rampMat);
        const inclineAngle = Math.atan2(rampRise, length);
        rampMesh.rotation.x = inclineAngle;
        rampMesh.position.set(0, centerY, centerZ);
        scene.add(rampMesh);
        createdObjects.push(rampMesh);

        // Flèches néon d'accélération sur la rampe
        for (let i = -length / 2 + 5; i < length / 2; i += 8) {
          const arrowGeo = new THREE.BoxGeometry(2.5, 0.05, 0.5);
          const arrowMat = new THREE.MeshBasicMaterial({ color: accent });
          const arrow = new THREE.Mesh(arrowGeo, arrowMat);
          arrow.rotation.x = inclineAngle;
          const arrowY = centerY + Math.sin(inclineAngle) * i;
          arrow.position.set(0, arrowY + 0.35, centerZ + i);
          scene.add(arrow);
          createdObjects.push(arrow);
        }

        collisionBoxes.push({
          id: `ramp-${centerZ}`,
          min: new THREE.Vector3(-highwayWidth / 2, rampStartY, Math.min(zStart, zEnd)),
          max: new THREE.Vector3(highwayWidth / 2, rampEndY, Math.max(zStart, zEnd)),
          isRamp: true,
          rampAngle: inclineAngle,
          rampStartY,
          rampEndY,
          rampZStart: zStart,
          rampZEnd: zEnd,
        });
        return;
      }

      // Plateforme solide
      addSolidBlock(`plat-${centerZ}`, highwayWidth, 1.2, length, new THREE.Vector3(0, height - 0.6, centerZ), 0x0f172a, accent);

      // Barrières de sécurité latérales infranchissables
      addSolidBlock(`rail-L-${centerZ}`, 0.4, 2.0, length, new THREE.Vector3(-highwayWidth / 2, height + 1.0, centerZ), 0x1e293b, accent);
      addSolidBlock(`rail-R-${centerZ}`, 0.4, 2.0, length, new THREE.Vector3(highwayWidth / 2, height + 1.0, centerZ), 0x1e293b, accent);

      // Si le segment contient des caisses d'obstacles
      if (type === "crates") {
        const crateX1 = (Math.random() > 0.5 ? 1 : -1) * 3.5;
        const crateZ1 = centerZ - length * 0.25;
        addSolidBlock(`crate-1-${centerZ}`, 2.6, 2.4, 2.6, new THREE.Vector3(crateX1, height + 1.2, crateZ1), 0x334155, accent);

        const crateX2 = -crateX1 * 0.8;
        const crateZ2 = centerZ + length * 0.25;
        addSolidBlock(`crate-2-${centerZ}`, 2.6, 2.4, 2.6, new THREE.Vector3(crateX2, height + 1.2, crateZ2), 0x334155, 0x38bdf8);
      }
    };

    // Génération initiale de 600 mètres de piste vers -Z
    let currentZ = 15;
    let currentY = 0;

    const buildNextBatch = () => {
      for (let i = 0; i < 8; i++) {
        // 1. Section plate
        spawnHighwayChunk(currentZ, currentZ - 40, currentY, "flat");
        currentZ -= 40;

        // 2. Section avec obstacles
        spawnHighwayChunk(currentZ, currentZ - 40, currentY, "crates");
        currentZ -= 40;

        // 3. Rampe inclinée
        spawnHighwayChunk(currentZ, currentZ - 30, currentY, "ramp");
        currentY += 3.5;
        currentZ -= 30;

        // 4. Sommet plat
        spawnHighwayChunk(currentZ, currentZ - 35, currentY, "flat");
        currentZ -= 35;

        // 5. Gouffre (vide franchissable de 5.5m avec Tremplin Jump Pad)
        spawnHighwayChunk(currentZ, currentZ - 5.5, currentY, "gap");
        currentZ -= 5.5;

        // 6. Plateforme après saut
        spawnHighwayChunk(currentZ, currentZ - 40, currentY, "crates");
        currentZ -= 40;

        // Si trop haut, rampe descendante
        if (currentY >= 7) {
          currentY = 0;
        }
      }
      furthestChunkZ = currentZ;
    };

    buildNextBatch();

    // Arche laser de départ
    const startGateGeo = new THREE.BoxGeometry(highwayWidth, 0.4, 0.4);
    const startGateMat = new THREE.MeshBasicMaterial({ color: accent });
    const startGate = new THREE.Mesh(startGateGeo, startGateMat);
    startGate.position.set(0, 6.5, 5);
    scene.add(startGate);
    createdObjects.push(startGate);

    return {
      cleanup: () => {
        createdObjects.forEach((obj) => {
          scene.remove(obj);
          if ((obj as any).geometry) (obj as any).geometry.dispose();
          if ((obj as any).material) (obj as any).material.dispose();
        });
      },
      collisionBoxes,
      generateMoreChunks: (playerZ: number) => {
        // Dès que le joueur s'approche à moins de 150m de la fin, générer un nouveau batch infini !
        if (playerZ - furthestChunkZ < 150) {
          buildNextBatch();
        }
      },
    };
  }

  // ════════════════════════════════════════════════════
  // 2. THE RANGE (Stand de tir Valorant fidèle)
  // ════════════════════════════════════════════════════
  if (mapId === "range") {
    // Sol principal
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: mapDef.floorColor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    createdObjects.push(floorMesh);

    // Collision sol
    collisionBoxes.push({
      id: "range-floor",
      min: new THREE.Vector3(-40, -1, -60),
      max: new THREE.Vector3(40, 0, 20),
    });

    // Grille au sol aux couleurs du thème
    const grid = new THREE.GridHelper(80, 40, accent, 0x1e293b);
    grid.position.y = 0.02;
    scene.add(grid);
    createdObjects.push(grid);

    // Grand mur d'impact au fond (-52m)
    addSolidBlock("range-backwall", 70, 22, 3, new THREE.Vector3(0, 11, -52), 0x1f2937, accent);

    // Murs latéraux infranchissables
    addSolidBlock("range-wall-left", 3, 18, 70, new THREE.Vector3(-25, 9, -20), 0x111827);
    addSolidBlock("range-wall-right", 3, 18, 70, new THREE.Vector3(25, 9, -20), 0x111827);

    // Mur arrière joueur
    addSolidBlock("range-wall-back", 50, 18, 3, new THREE.Vector3(0, 9, 12), 0x111827);

    // Plaques de distance au sol (10m, 20m, 30m, 50m)
    [10, 20, 30, 50].forEach((dist) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-18, 0.04, -dist),
        new THREE.Vector3(18, 0.04, -dist),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: accent, linewidth: 3 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      createdObjects.push(line);

      // Panneau indicateur de distance
      const signGeo = new THREE.BoxGeometry(2.5, 0.8, 0.1);
      const signMat = new THREE.MeshBasicMaterial({ color: accent });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(-19, 0.4, -dist);
      scene.add(sign);
      createdObjects.push(sign);
    });

    return {
      cleanup: () => {
        createdObjects.forEach((obj) => {
          scene.remove(obj);
          if ((obj as any).geometry) (obj as any).geometry.dispose();
          if ((obj as any).material) (obj as any).material.dispose();
        });
      },
      collisionBoxes,
    };
  }

  // ════════════════════════════════════════════════════
  // 3. AUTRES CARTES (Arena, Corridor, City, Sky Dome)
  // ════════════════════════════════════════════════════
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({
    color: mapDef.floorColor,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
  createdObjects.push(floorMesh);

  collisionBoxes.push({
    id: "default-floor",
    min: new THREE.Vector3(-50, -1, -50),
    max: new THREE.Vector3(50, 0, 50),
  });

  const grid = new THREE.GridHelper(100, 50, accent, 0x1e293b);
  grid.position.y = 0.02;
  scene.add(grid);
  createdObjects.push(grid);

  if (mapId === "arena") {
    // 8 Piliers lumineux avec solide collision
    const columnCount = 8;
    const radius = 26;
    for (let i = 0; i < columnCount; i++) {
      const angle = (i / columnCount) * Math.PI * 2;
      const cx = Math.sin(angle) * radius;
      const cz = Math.cos(angle) * radius;
      addSolidBlock(`col-${i}`, 1.8, 16, 1.8, new THREE.Vector3(cx, 8, cz), 0x151f32, accent);
    }
  } else if (mapId === "corridor") {
    addSolidBlock("corridor-L", 2, 12, 60, new THREE.Vector3(-9, 6, -20), 0x1f2433, accent);
    addSolidBlock("corridor-R", 2, 12, 60, new THREE.Vector3(9, 6, -20), 0x1f2433, accent);

    addSolidBlock("crate-1", 2.6, 2.4, 2.6, new THREE.Vector3(-4.5, 1.2, -14), 0x334155, accent);
    addSolidBlock("crate-2", 2.6, 2.4, 2.6, new THREE.Vector3(4.5, 1.2, -26), 0x334155, accent);
    addSolidBlock("crate-3", 3.0, 3.0, 3.0, new THREE.Vector3(-3.5, 1.5, -38), 0x334155, accent);
  } else if (mapId === "city") {
    addSolidBlock("container-1", 6, 4.5, 12, new THREE.Vector3(-14, 2.25, -20), 0x1e3a5f, accent);
    addSolidBlock("container-2", 6, 4.5, 12, new THREE.Vector3(15, 2.25, -28), 0x475569, accent);
    addSolidBlock("container-3", 6, 4.5, 12, new THREE.Vector3(-8, 2.25, -42), 0x334155, accent);
  }

  return {
    cleanup: () => {
      createdObjects.forEach((obj) => {
        scene.remove(obj);
        if ((obj as any).geometry) (obj as any).geometry.dispose();
        if ((obj as any).material) (obj as any).material.dispose();
      });
    },
    collisionBoxes,
  };
}
