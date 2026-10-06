// ══════════════════════════════════════════════════════
// SGS AIM Native — Environnements 3D & Moteur de Collisions
// ══════════════════════════════════════════════════════

import * as THREE from "three";
import type { AimMapId } from "./types";

export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  isRamp?: boolean;
  rampAngle?: number;
  rampStartY?: number;
  rampEndY?: number;
}

export interface MapEnvironmentResult {
  cleanup: () => void;
  collisionBoxes: CollisionBox[];
}

export interface AimMapDef {
  id: AimMapId;
  name: string;
  tagline: string;
  description: string;
  ambientColor: number;
  fogColor: number;
  fogDensity: number;
  floorColor: number;
  wallColor: number;
  accentColor: number;
}

export const MAPS: Record<AimMapId, AimMapDef> = {
  infinite_highway: {
    id: "infinite_highway",
    name: "Cyber Highway (Parkour Runner)",
    tagline: "Piste d'assaut linéaire avec rampes et fossés",
    description: "Parcours d'assaut infini avec dénivelés, rampes d'accélération, sauts dans le vide et cibles d'entraînement.",
    ambientColor: 0xe0e7ff,
    fogColor: 0x070914,
    fogDensity: 0.01,
    floorColor: 0x0c0f1d,
    wallColor: 0x161b30,
    accentColor: 0xff4655,
  },
  range: {
    id: "range",
    name: "The Range (Stand de Tir)",
    tagline: "Stand d'entraînement Valorant officiel",
    description: "Environnement épuré avec repères de distance au sol de 10m à 50m et grand mur pare-balles.",
    ambientColor: 0xffffff,
    fogColor: 0x0a0e13,
    fogDensity: 0.015,
    floorColor: 0x0f172a,
    wallColor: 0x111827,
    accentColor: 0xff4655,
  },
  arena: {
    id: "arena",
    name: "Cyber Neon Arena",
    tagline: "Arène circulaire e-sport à colonnes lumineuses",
    description: "Arène ouverte à 360° avec piliers verticaux holographiques et grille dynamique au sol.",
    ambientColor: 0xdbeafe,
    fogColor: 0x070b14,
    fogDensity: 0.018,
    floorColor: 0x0a101d,
    wallColor: 0x151f32,
    accentColor: 0x38bdf8,
  },
  corridor: {
    id: "corridor",
    name: "Corridor Tactique (Site Peek)",
    tagline: "Couloir d'assaut avec angles serrés",
    description: "Map étroite avec angles à 90°, caisses de couverture et recoins tactiques.",
    ambientColor: 0xfef08a,
    fogColor: 0x0c0d12,
    fogDensity: 0.02,
    floorColor: 0x171923,
    wallColor: 0x1f2433,
    accentColor: 0xffaa00,
  },
  sky_dome: {
    id: "sky_dome",
    name: "Ciel Infini (Sky Dome)",
    tagline: "Plateforme flottante sous voûte céleste",
    description: "Plateforme ouverte sans mur de fond. Les orbes et cibles flottent librement dans l'espace.",
    ambientColor: 0xf5d0fe,
    fogColor: 0x060814,
    fogDensity: 0.012,
    floorColor: 0x0f0b24,
    wallColor: 0x221742,
    accentColor: 0xc084fc,
  },
  city: {
    id: "city",
    name: "Zone Urbaine (Ascent Yard)",
    tagline: "Cour de combat urbaine avec containers",
    description: "Zone industrielle tactique avec containers métalliques et piliers en béton.",
    ambientColor: 0xccfbf1,
    fogColor: 0x081116,
    fogDensity: 0.016,
    floorColor: 0x0d1f26,
    wallColor: 0x162c36,
    accentColor: 0x2dd4bf,
  },
};

export function buildMapEnvironment(
  scene: THREE.Scene,
  mapId: AimMapId,
  themeAccentHex: string = "#ff4655"
): MapEnvironmentResult {
  const mapDef = MAPS[mapId] || MAPS.range;
  const accent = parseInt(themeAccentHex.replace("#", ""), 16);
  const createdObjects: THREE.Object3D[] = [];
  const collisionBoxes: CollisionBox[] = [];

  // Helper pour ajouter une boîte avec collision
  const addSolidBox = (
    w: number,
    h: number,
    d: number,
    pos: THREE.Vector3,
    color: number = mapDef.wallColor,
    isRamp: boolean = false
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    createdObjects.push(mesh);

    collisionBoxes.push({
      min: new THREE.Vector3(pos.x - w / 2, pos.y - h / 2, pos.z - d / 2),
      max: new THREE.Vector3(pos.x + w / 2, pos.y + h / 2, pos.z + d / 2),
      isRamp,
    });
    return mesh;
  };

  // ════════════════════════════════════════════════════
  // 1. CARTE RUNNER : "infinite_highway"
  // ════════════════════════════════════════════════════
  if (mapId === "infinite_highway") {
    // Tronçons de piste avec sauts et rampes jusqu'à -400m
    const segmentWidth = 14;
    const segments = [
      // Section départ plate (0 à -50m)
      { zStart: 10, zEnd: -50, y: 0, hasRamp: false },
      // Rampe montant vers plateforme surélevée (-50 à -80m)
      { zStart: -50, zEnd: -80, y: 3, hasRamp: true, rampStart: 0, rampEnd: 3 },
      // Plateforme haute (-80 à -120m)
      { zStart: -80, zEnd: -120, y: 3, hasRamp: false },
      // Fossé (vide de -120 à -130m à sauter !)
      // Reprise plateforme (-130 à -180m)
      { zStart: -130, zEnd: -180, y: 2, hasRamp: false },
      // Rampe haute (-180 à -220m)
      { zStart: -180, zEnd: -220, y: 5.5, hasRamp: true, rampStart: 2, rampEnd: 5.5 },
      // Plateforme sommet (-220 à -280m)
      { zStart: -220, zEnd: -280, y: 5.5, hasRamp: false },
      // Fossé à franchir (-280 à -292m)
      // Dernière autoroute d'assaut (-292 à -400m)
      { zStart: -292, zEnd: -400, y: 1, hasRamp: false },
    ];

    segments.forEach((seg) => {
      const length = Math.abs(seg.zStart - seg.zEnd);
      const centerZ = (seg.zStart + seg.zEnd) / 2;

      if (seg.hasRamp) {
        // Rampe inclinée
        const rampGeo = new THREE.BoxGeometry(segmentWidth, 0.4, length);
        const rampMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.5,
          roughness: 0.4,
        });
        const rampMesh = new THREE.Mesh(rampGeo, rampMat);
        const centerY = (seg.rampStart! + seg.rampEnd!) / 2;
        rampMesh.position.set(0, centerY, centerZ);
        const inclineAngle = Math.atan2(seg.rampEnd! - seg.rampStart!, length);
        rampMesh.rotation.x = inclineAngle;
        scene.add(rampMesh);
        createdObjects.push(rampMesh);

        collisionBoxes.push({
          min: new THREE.Vector3(-segmentWidth / 2, seg.rampStart!, Math.min(seg.zStart, seg.zEnd)),
          max: new THREE.Vector3(segmentWidth / 2, seg.rampEnd!, Math.max(seg.zStart, seg.zEnd)),
          isRamp: true,
          rampAngle: inclineAngle,
          rampStartY: seg.rampStart!,
          rampEndY: seg.rampEnd!,
        });
      } else {
        // Plateforme solide
        const platGeo = new THREE.BoxGeometry(segmentWidth, 1.0, length);
        const platMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.3,
          roughness: 0.7,
        });
        const plat = new THREE.Mesh(platGeo, platMat);
        plat.position.set(0, seg.y - 0.5, centerZ);
        scene.add(plat);
        createdObjects.push(plat);

        collisionBoxes.push({
          min: new THREE.Vector3(-segmentWidth / 2, seg.y - 1.0, Math.min(seg.zStart, seg.zEnd)),
          max: new THREE.Vector3(segmentWidth / 2, seg.y, Math.max(seg.zStart, seg.zEnd)),
        });

        // Néons sur les bords
        [-segmentWidth / 2, segmentWidth / 2].forEach((xBorder) => {
          const borderGeo = new THREE.BoxGeometry(0.2, 0.1, length);
          const borderMat = new THREE.MeshBasicMaterial({ color: accent });
          const borderMesh = new THREE.Mesh(borderGeo, borderMat);
          borderMesh.position.set(xBorder, seg.y + 0.05, centerZ);
          scene.add(borderMesh);
          createdObjects.push(borderMesh);
        });
      }
    });

    // Caisses et obstacles à esquiver le long de la piste
    const obstaclesData = [
      { x: -3.5, y: 1.0, z: -25, w: 2.2, h: 2.0, d: 2.2 },
      { x: 3.5, y: 1.0, z: -40, w: 2.2, h: 2.0, d: 2.2 },
      { x: -2.0, y: 4.0, z: -95, w: 2.5, h: 2.0, d: 2.5 },
      { x: 2.5, y: 4.0, z: -110, w: 2.5, h: 2.0, d: 2.5 },
      { x: 0, y: 3.0, z: -150, w: 3.0, h: 2.0, d: 2.0 },
      { x: -3.0, y: 6.5, z: -245, w: 2.2, h: 2.0, d: 2.2 },
    ];

    obstaclesData.forEach((ob) => {
      addSolidBox(ob.w, ob.h, ob.d, new THREE.Vector3(ob.x, ob.y, ob.z), 0x334155);
    });

    // Poteaux laser et arches
    [-60, -140, -210, -310].forEach((archZ) => {
      const archL = addSolidBox(0.8, 8, 0.8, new THREE.Vector3(-segmentWidth / 2, 4, archZ), 0x1e293b);
      const archR = addSolidBox(0.8, 8, 0.8, new THREE.Vector3(segmentWidth / 2, 4, archZ), 0x1e293b);
      const beamGeo = new THREE.BoxGeometry(segmentWidth, 0.3, 0.3);
      const beamMat = new THREE.MeshBasicMaterial({ color: accent });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 7.8, archZ);
      scene.add(beam);
      createdObjects.push(beam);
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
  // 2. AUTRES CARTES (Range, Arena, Corridor, City, Sky)
  // ════════════════════════════════════════════════════

  // Sol standard
  const floorGeo = new THREE.PlaneGeometry(120, 120);
  const floorMat = new THREE.MeshStandardMaterial({
    color: mapDef.floorColor,
    roughness: 0.85,
    metalness: 0.2,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);
  createdObjects.push(floorMesh);

  // Collision sol horizontal
  collisionBoxes.push({
    min: new THREE.Vector3(-60, -1, -60),
    max: new THREE.Vector3(60, 0, 60),
  });

  // Grille décorative
  const gridHelper = new THREE.GridHelper(120, 60, accent, 0x1e293b);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);
  createdObjects.push(gridHelper);

  if (mapId === "range") {
    // Grand mur pare-balles au fond (-45m)
    addSolidBox(80, 20, 2, new THREE.Vector3(0, 10, -45));
    // Murs latéraux
    addSolidBox(2, 16, 70, new THREE.Vector3(-30, 8, -15));
    addSolidBox(2, 16, 70, new THREE.Vector3(30, 8, -15));

    // Lignes de distance
    [10, 20, 30, 50].forEach((dist) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-22, 0.05, -dist),
        new THREE.Vector3(22, 0.05, -dist),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: accent, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      createdObjects.push(line);
    });
  } else if (mapId === "arena") {
    // Piliers de l'arène avec collisions
    const columnCount = 8;
    const radius = 28;
    for (let i = 0; i < columnCount; i++) {
      const angle = (i / columnCount) * Math.PI * 2;
      const cx = Math.sin(angle) * radius;
      const cz = Math.cos(angle) * radius;

      const colMesh = addSolidBox(1.6, 14, 1.6, new THREE.Vector3(cx, 7, cz));
      // Anneau néon
      const ringGeo = new THREE.TorusGeometry(1.2, 0.06, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: accent });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, 7, cz);
      scene.add(ring);
      createdObjects.push(ring);
    }
  } else if (mapId === "corridor") {
    // Murs de couloir avec collision
    addSolidBox(2, 10, 60, new THREE.Vector3(-8, 5, -20));
    addSolidBox(2, 10, 60, new THREE.Vector3(8, 5, -20));

    // Caisses de couverture
    addSolidBox(2.4, 2.4, 2.4, new THREE.Vector3(-4, 1.2, -12), 0x334155);
    addSolidBox(2.4, 2.4, 2.4, new THREE.Vector3(4, 1.2, -24), 0x334155);
    addSolidBox(2.8, 2.8, 2.8, new THREE.Vector3(-3, 1.4, -36), 0x334155);
    addSolidBox(2.2, 2.2, 2.2, new THREE.Vector3(5, 1.1, -44), 0x334155);
  } else if (mapId === "city") {
    // Containers maritimes solides
    addSolidBox(6, 4, 12, new THREE.Vector3(-14, 2, -20), 0x1e3a5f);
    addSolidBox(6, 4, 12, new THREE.Vector3(16, 2, -25), 0x475569);
    addSolidBox(6, 4, 12, new THREE.Vector3(-8, 2, -40), 0x334155);
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
