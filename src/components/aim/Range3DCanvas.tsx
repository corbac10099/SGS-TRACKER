"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import type {
  AimScenarioId,
  CrosshairSettings,
  ValorantSensSettings,
  AimScoreRecord,
  AdaptiveConfig,
} from "./types";
import { getScenarioById } from "./scenarios";
import { buildMapEnvironment, CollisionBox, MAPS } from "./maps";
import { aimSounds } from "./sounds";

interface Props {
  scenarioId: AimScenarioId;
  crosshair: CrosshairSettings;
  sensitivity: ValorantSensSettings;
  adaptiveConfig?: AdaptiveConfig;
  themeAccent?: string;
  isCalibrationMode?: boolean;
  onAdaptiveUpdate?: (newConfig: AdaptiveConfig) => void;
  onFinish: (record: Omit<AimScoreRecord, "id" | "userId" | "userName" | "verified">) => void;
  onBack: () => void;
}

interface Target3D {
  mesh: THREE.Group;
  headMesh?: THREE.Mesh;
  bodyMesh?: THREE.Mesh;
  orbMesh?: THREE.Mesh;
  position: THREE.Vector3;
  spawnTime: number;
  type: "mannequin" | "orb";
  vx?: number;
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  radius: number;
}

export default function Range3DCanvas({
  scenarioId,
  crosshair,
  sensitivity,
  adaptiveConfig,
  themeAccent = "#ff4655",
  isCalibrationMode = false,
  onAdaptiveUpdate,
  onFinish,
  onBack,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scenario = getScenarioById(scenarioId);

  // Game phases
  const [phase, setPhase] = useState<"countdown" | "playing" | "finished">("countdown");
  const [isLocked, setIsLocked] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);
  const [liveScore, setLiveScore] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [liveTimer, setLiveTimer] = useState(scenario.defaultDurationSec || 60);
  const [combo, setCombo] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [finalStats, setFinalStats] = useState<any>(null);
  const [dynamicMultiplier, setDynamicMultiplier] = useState(1.0);

  // Reaction mode state
  const reactionTrialsRef = useRef(0);
  const reactionTimesRef = useRef<number[]>([]);
  const reactionWaitingRef = useRef(false);
  const reactionShowTimeRef = useRef(0);
  const reactionTimerRef = useRef<number>(0);

  // Internal Game Refs
  const isPlayingRef = useRef(false);
  const timerRef = useRef(scenario.defaultDurationSec || 60);
  const scoreRef = useRef(0);
  const shotsRef = useRef(0);
  const hitsRef = useRef(0);
  const headshotsRef = useRef(0);
  const hitTimesRef = useRef<number[]>([]);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);

  // Adaptive DDA
  const streakRef = useRef(0);
  const adaptiveScaleRef = useRef(adaptiveConfig?.targetScale ?? 1.0);
  const adaptiveSpeedRef = useRef(adaptiveConfig?.targetSpeed ?? 1.0);

  // Player Physics & Collisions
  const keysDownRef = useRef<Record<string, boolean>>({});
  const playerVelocityRef = useRef(new THREE.Vector3());
  const playerPositionRef = useRef(new THREE.Vector3(0, 1.6, scenario.isRunnerMode ? 5 : 0));
  const isGroundedRef = useRef(true);
  const collisionBoxesRef = useRef<CollisionBox[]>([]);
  const lastSafeZRef = useRef(0);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetsRef = useRef<Target3D[]>([]);
  const particlesRef = useRef<{ mesh: THREE.Points; life: number; maxLife: number }[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, "YXZ"));

  const releasePointerLock = useCallback(() => {
    if (typeof document !== "undefined" && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    setIsLocked(false);
  }, []);

  const finishSession = useCallback(() => {
    isPlayingRef.current = false;
    releasePointerLock();
    aimSounds.playFinish();

    const acc = shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 1000) / 10 : 0;
    const hsRate = hitsRef.current > 0 ? Math.round((headshotsRef.current / hitsRef.current) * 1000) / 10 : 0;
    const avgTime =
      hitTimesRef.current.length > 0
        ? Math.round(hitTimesRef.current.reduce((a, b) => a + b, 0) / hitTimesRef.current.length)
        : 0;

    const stats = {
      scenarioId,
      score: scoreRef.current,
      targetsHit: hitsRef.current,
      totalShots: shotsRef.current,
      accuracy: acc,
      headshotRate: hsRate,
      avgTimeToHitMs:
        scenarioId === "reaction_3d" && reactionTimesRef.current.length > 0
          ? Math.round(
              reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
            )
          : avgTime,
      maxCombo: maxComboRef.current,
      difficulty: adaptiveScaleRef.current,
      distanceTraveled: Math.round(Math.abs(playerPositionRef.current.z)),
      timestamp: Date.now(),
    };

    setFinalStats(stats);
    setPhase("finished");
    onFinish(stats);
  }, [scenarioId, onFinish, releasePointerLock]);

  // Particle explosion
  const spawnExplosion = useCallback((pos: THREE.Vector3, colorHex: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const count = 18;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 7 + 2,
          (Math.random() - 0.5) * 7
        )
      );
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.18,
      transparent: true,
      opacity: 0.95,
    });

    const p = new THREE.Points(geo, mat);
    (p as any).velocities = velocities;
    scene.add(p);
    particlesRef.current.push({ mesh: p, life: 0, maxLife: 0.38 });
  }, []);

  // Spawn Target 3D
  const spawnTarget = useCallback(
    (now: number) => {
      const scene = sceneRef.current;
      if (!scene) return;

      const scale = adaptiveScaleRef.current;
      const speedMod = adaptiveSpeedRef.current;
      const group = new THREE.Group();

      let distance = 16;
      let angle = 0;
      let elevation = 1.6;

      const isOrbScenario =
        scenarioId === "gridshot_3d" ||
        scenarioId === "floating_orbs" ||
        scenarioId === "reaction_3d";

      const playerPos = playerPositionRef.current;

      if (scenario.isRunnerMode) {
        // Runner: cibles apparaissent 15m à 40m DEVANT le joueur (vers -Z)
        const aheadDist = 18 + Math.random() * 25;
        const targetZ = playerPos.z - aheadDist;
        const targetX = (Math.random() - 0.5) * 8.5;
        const targetY = 1.6 + Math.random() * 2.5;

        const radius = scenario.targetRadius * scale;
        const headRadius = radius;

        // Mannequin runner bot
        const bodyGeo = new THREE.CylinderGeometry(0.35 * scale, 0.35 * scale, 1.4 * scale, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.7,
          roughness: 0.3,
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.7 * scale;
        group.add(bodyMesh);

        const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
          color: 0xff4655,
          emissive: 0xff4655,
          emissiveIntensity: 0.5,
          metalness: 0.8,
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = (1.4 + headRadius) * scale;
        group.add(headMesh);

        group.position.set(targetX, targetY, targetZ);
        scene.add(group);

        targetsRef.current.push({
          mesh: group,
          headMesh,
          bodyMesh,
          position: new THREE.Vector3(targetX, targetY, targetZ),
          spawnTime: now,
          type: "mannequin",
          radius: headRadius,
          vx: (Math.random() - 0.5) * 2.5 * speedMod,
          minX: targetX - 3,
          maxX: targetX + 3,
        });
        return;
      }

      if (scenarioId === "headshot_range") {
        distance = 30 + Math.random() * 20;
        angle = (Math.random() - 0.5) * 0.4;
      } else if (scenarioId === "spider_3d") {
        distance = 12 + Math.random() * 8;
        angle = (Math.random() - 0.5) * Math.PI * 1.6;
        elevation = 0.8 + Math.random() * 2.2;
      } else if (scenarioId === "microflick_3d") {
        distance = 18 + Math.random() * 15;
        angle = (Math.random() - 0.5) * 0.7;
      } else if (scenarioId === "floating_orbs") {
        distance = 12 + Math.random() * 14;
        angle = (Math.random() - 0.5) * 1.2;
        elevation = 1.2 + Math.random() * 3.5;
      } else if (scenarioId === "gridshot_3d") {
        distance = 12 + Math.random() * 4;
        angle = (Math.random() - 0.5) * 0.8;
        elevation = 1.0 + Math.random() * 2.0;
      }

      const x = playerPos.x + Math.sin(angle) * distance;
      const z = playerPos.z - Math.cos(angle) * distance;
      const y = elevation;

      let targetObj: Target3D;

      if (isOrbScenario) {
        const radius = scenario.targetRadius * scale;
        const orbGeo = new THREE.SphereGeometry(radius, 20, 20);
        const orbMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(scenario.targetColor),
          emissive: new THREE.Color(scenario.targetColor),
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.2,
        });
        const orbMesh = new THREE.Mesh(orbGeo, orbMat);
        group.add(orbMesh);

        const ringGeo = new THREE.TorusGeometry(radius * 1.25, 0.02, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(scenario.targetColor),
          transparent: true,
          opacity: 0.7,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);

        group.position.set(x, y, z);
        scene.add(group);

        targetObj = {
          mesh: group,
          orbMesh,
          position: new THREE.Vector3(x, y, z),
          spawnTime: now,
          type: "orb",
          radius,
        };

        if (scenarioId === "floating_orbs") {
          targetObj.vx = (Math.random() - 0.5) * 3.0 * speedMod;
          targetObj.vy = (Math.random() - 0.5) * 2.0 * speedMod;
          targetObj.minX = x - 6;
          targetObj.maxX = x + 6;
          targetObj.minY = 0.8;
          targetObj.maxY = 4.5;
        }
      } else {
        const headRadius = scenario.targetRadius * scale;
        const bodyGeo = new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 1.35 * scale, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.6,
          roughness: 0.3,
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.68 * scale;
        group.add(bodyMesh);

        const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
          color: 0xff4655,
          emissive: 0xff4655,
          emissiveIntensity: 0.5,
          metalness: 0.8,
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = (1.35 + headRadius) * scale;
        group.add(headMesh);

        group.position.set(x, 0, z);
        scene.add(group);

        targetObj = {
          mesh: group,
          headMesh,
          bodyMesh,
          position: new THREE.Vector3(x, 0, z),
          spawnTime: now,
          type: "mannequin",
          radius: headRadius,
        };

        if (scenarioId === "tracking_strafe") {
          targetObj.vx = (Math.random() > 0.5 ? 1 : -1) * 3.8 * speedMod;
          targetObj.minX = x - 5.5;
          targetObj.maxX = x + 5.5;
        }
      }

      targetsRef.current.push(targetObj);
    },
    [scenarioId, scenario]
  );

  // Shoot raycast
  const shootRaycast = useCallback(() => {
    if (!isPlayingRef.current || !cameraRef.current || !sceneRef.current) return;

    aimSounds.playShoot();
    shotsRef.current += 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
    const scene = sceneRef.current;
    let hitFound = false;
    const now = performance.now();

    if (scenarioId === "reaction_3d") {
      if (reactionWaitingRef.current && targetsRef.current.length === 0) {
        aimSounds.playMiss();
        return;
      }
      for (let i = targetsRef.current.length - 1; i >= 0; i--) {
        const target = targetsRef.current[i];
        const intersects = raycasterRef.current.intersectObject(target.orbMesh || target.mesh, true);
        if (intersects.length > 0) {
          const reactionTime = now - reactionShowTimeRef.current;
          reactionTimesRef.current.push(reactionTime);
          hitsRef.current += 1;
          aimSounds.playHeadshot();
          spawnExplosion(target.position, 0x22cc88);
          scene.remove(target.mesh);
          targetsRef.current.splice(i, 1);
          reactionTrialsRef.current += 1;

          if (reactionTrialsRef.current >= 10) {
            finishSession();
            return;
          }

          reactionWaitingRef.current = true;
          const delay = 1000 + Math.random() * 2500;
          window.clearTimeout(reactionTimerRef.current);
          reactionTimerRef.current = window.setTimeout(() => {
            spawnTarget(performance.now());
            reactionShowTimeRef.current = performance.now();
            reactionWaitingRef.current = false;
          }, delay);
          return;
        }
      }
      aimSounds.playMiss();
      return;
    }

    for (let i = targetsRef.current.length - 1; i >= 0; i--) {
      const target = targetsRef.current[i];
      let isHead = false;
      let intersected = false;

      if (target.type === "orb" && target.orbMesh) {
        const intersects = raycasterRef.current.intersectObject(target.orbMesh, false);
        if (intersects.length > 0) {
          intersected = true;
          isHead = true;
        }
      } else if (target.type === "mannequin") {
        const headHit = target.headMesh
          ? raycasterRef.current.intersectObject(target.headMesh, false)
          : [];
        const bodyHit = target.bodyMesh
          ? raycasterRef.current.intersectObject(target.bodyMesh, false)
          : [];

        if (headHit.length > 0) {
          intersected = true;
          isHead = true;
        } else if (bodyHit.length > 0) {
          intersected = true;
          isHead = false;
        }
      }

      if (intersected) {
        hitFound = true;
        hitsRef.current += 1;
        if (isHead) headshotsRef.current += 1;

        const timeToHit = now - target.spawnTime;
        hitTimesRef.current.push(timeToHit);

        comboRef.current += 1;
        if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;

        // DDA real-time update
        streakRef.current += 1;
        if (streakRef.current >= 4 && timeToHit < 320) {
          adaptiveScaleRef.current = Math.max(0.65, adaptiveScaleRef.current * 0.94);
          adaptiveSpeedRef.current = Math.min(2.0, adaptiveSpeedRef.current * 1.06);
          setDynamicMultiplier(Math.round((2.0 - adaptiveScaleRef.current) * 100) / 100);
          if (onAdaptiveUpdate) {
            onAdaptiveUpdate({
              targetScale: adaptiveScaleRef.current,
              spawnRateMs: 800,
              targetSpeed: adaptiveSpeedRef.current,
              targetDistance: [10, 40],
              angleSpread: 1.0,
            });
          }
        }

        const speedBonus = Math.max(25, Math.round(220 - timeToHit / 7));
        const headBonus = isHead ? 260 : 90;
        const comboBonus = Math.min(comboRef.current, 15) * 10;
        const runnerDistBonus = scenario.isRunnerMode
          ? Math.round(Math.abs(playerPositionRef.current.z) * 2)
          : 0;

        const points = Math.round(
          (headBonus + speedBonus + comboBonus + runnerDistBonus) *
            scenario.scoreMultiplier *
            dynamicMultiplier
        );

        scoreRef.current += points;

        if (isHead) {
          aimSounds.playHeadshot();
          spawnExplosion(
            target.position,
            target.type === "orb" ? parseInt(scenario.targetColor.replace("#", ""), 16) : 0xff4655
          );
        } else {
          aimSounds.playHit();
          spawnExplosion(target.position, 0x38bdf8);
        }

        scene.remove(target.mesh);
        targetsRef.current.splice(i, 1);
        spawnTarget(performance.now());
        break;
      }
    }

    if (!hitFound) {
      comboRef.current = 0;
      streakRef.current = 0;
      adaptiveScaleRef.current = Math.min(1.3, adaptiveScaleRef.current * 1.03);
      adaptiveSpeedRef.current = Math.max(0.8, adaptiveSpeedRef.current * 0.97);
      setDynamicMultiplier(Math.round((2.0 - adaptiveScaleRef.current) * 100) / 100);
      aimSounds.playMiss();
    }

    setCombo(comboRef.current);
    setLiveScore(scoreRef.current);
    const acc = shotsRef.current > 0 ? Math.round((hitsRef.current / shotsRef.current) * 100) : 100;
    setLiveAccuracy(acc);
  }, [scenarioId, scenario, spawnTarget, spawnExplosion, dynamicMultiplier, finishSession, onAdaptiveUpdate]);

  // Three.js Scene Setup & Physics Animation Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const mapDef = MAPS[scenario.mapId] || MAPS.range;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mapDef.fogColor);
    scene.fog = new THREE.FogExp2(mapDef.fogColor, mapDef.fogDensity);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(71, width / height, 0.1, 1000);
    const initialZ = scenario.isRunnerMode ? 5 : 0;
    camera.position.set(0, 1.6, initialZ);
    cameraRef.current = camera;
    playerPositionRef.current.set(0, 1.6, initialZ);
    lastSafeZRef.current = initialZ;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(mapDef.ambientColor, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(15, 35, 20);
    scene.add(dirLight);

    const themeLight = new THREE.PointLight(
      parseInt(themeAccent.replace("#", ""), 16),
      2.0,
      45
    );
    themeLight.position.set(-6, 6, -10);
    scene.add(themeLight);

    // Build map and extract collision boxes
    const mapEnv = buildMapEnvironment(scene, scenario.mapId, themeAccent);
    collisionBoxesRef.current = mapEnv.collisionBoxes;

    if (scenarioId !== "reaction_3d") {
      for (let i = 0; i < scenario.targetCount; i++) {
        spawnTarget(performance.now());
      }
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Player Movement & Solid Collisions
      if (scenario.allowMovement && isPlayingRef.current) {
        const moveSpeed = scenario.isRunnerMode ? 8.5 : 6.0;
        const keys = keysDownRef.current;
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(
          new THREE.Euler(0, eulerRef.current.y, 0, "YXZ")
        );
        const right = new THREE.Vector3(1, 0, 0).applyEuler(
          new THREE.Euler(0, eulerRef.current.y, 0, "YXZ")
        );

        const moveDir = new THREE.Vector3();
        if (keys["KeyW"] || keys["KeyZ"]) moveDir.add(forward);
        if (keys["KeyS"]) moveDir.sub(forward);
        if (keys["KeyD"]) moveDir.add(right);
        if (keys["KeyA"] || keys["KeyQ"]) moveDir.sub(right);

        // Runner mode: constant forward push if pressing W or autorun
        if (scenario.isRunnerMode && !keys["KeyS"]) {
          moveDir.add(forward.clone().multiplyScalar(0.7));
        }

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          playerVelocityRef.current.x = moveDir.x * moveSpeed;
          playerVelocityRef.current.z = moveDir.z * moveSpeed;
        } else {
          playerVelocityRef.current.x *= 0.82;
          playerVelocityRef.current.z *= 0.82;
        }

        // Jump impulse
        if (keys["Space"] && isGroundedRef.current) {
          playerVelocityRef.current.y = 5.2;
          isGroundedRef.current = false;
        }

        // Gravity
        if (!isGroundedRef.current) {
          playerVelocityRef.current.y -= 14 * dt;
        }

        // Tentative next positions
        const nextX = playerPositionRef.current.x + playerVelocityRef.current.x * dt;
        const nextY = playerPositionRef.current.y + playerVelocityRef.current.y * dt;
        const nextZ = playerPositionRef.current.z + playerVelocityRef.current.z * dt;

        // Collision detection against collisionBoxes
        let groundedOnBox = false;
        let highestFloorY = -999;
        const playerRadius = 0.5;
        const eyeHeight = 1.6;

        collisionBoxesRef.current.forEach((box) => {
          // Check ramp
          if (box.isRamp && box.rampAngle !== undefined) {
            if (
              nextX >= box.min.x &&
              nextX <= box.max.x &&
              nextZ <= box.max.z &&
              nextZ >= box.min.z
            ) {
              const rampProgress = (box.max.z - nextZ) / (box.max.z - box.min.z);
              const rampY =
                box.rampStartY! + (box.rampEndY! - box.rampStartY!) * Math.max(0, Math.min(1, rampProgress));
              if (rampY > highestFloorY && nextY - eyeHeight <= rampY + 0.3) {
                highestFloorY = rampY;
              }
            }
          } else {
            // Check solid platform floor
            if (
              nextX >= box.min.x - playerRadius &&
              nextX <= box.max.x + playerRadius &&
              nextZ >= box.min.z - playerRadius &&
              nextZ <= box.max.z + playerRadius
            ) {
              const topY = box.max.y;
              // Player is above or landing on platform
              if (nextY - eyeHeight >= topY - 0.5 && topY > highestFloorY) {
                highestFloorY = topY;
              }
            }
          }
        });

        // Resolve ground landing
        if (highestFloorY > -990 && nextY - eyeHeight <= highestFloorY + 0.05) {
          playerPositionRef.current.y = highestFloorY + eyeHeight;
          playerVelocityRef.current.y = 0;
          isGroundedRef.current = true;
          groundedOnBox = true;
          lastSafeZRef.current = nextZ;
        } else {
          isGroundedRef.current = false;
          playerPositionRef.current.y = nextY;
        }

        // Void fall detection (respawn on last safe Z)
        if (playerPositionRef.current.y < -8) {
          playerPositionRef.current.set(0, 4.0, lastSafeZRef.current + 6);
          playerVelocityRef.current.set(0, 0, 0);
          isGroundedRef.current = false;
        }

        // Horizontal boundary check
        const xLimit = scenario.isRunnerMode ? 6.5 : 28;
        playerPositionRef.current.x = Math.max(-xLimit, Math.min(xLimit, nextX));
        playerPositionRef.current.z = nextZ;

        camera.position.copy(playerPositionRef.current);
        setDistanceTraveled(Math.round(Math.abs(playerPositionRef.current.z)));
      }

      // Update targets
      for (const t of targetsRef.current) {
        if (t.vx !== undefined && t.minX !== undefined && t.maxX !== undefined) {
          t.position.x += t.vx * dt;
          if (t.position.x <= t.minX || t.position.x >= t.maxX) t.vx *= -1;
        }
        if (t.vy !== undefined && t.minY !== undefined && t.maxY !== undefined) {
          t.position.y += t.vy * dt;
          if (t.position.y <= t.minY || t.position.y >= t.maxY) t.vy *= -1;
        }
        t.mesh.position.copy(t.position);
      }

      // Particles
      for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
        const pObj = particlesRef.current[pIdx];
        pObj.life += dt;
        if (pObj.life >= pObj.maxLife) {
          scene.remove(pObj.mesh);
          (pObj.mesh.geometry as THREE.BufferGeometry).dispose();
          (pObj.mesh.material as THREE.Material).dispose();
          particlesRef.current.splice(pIdx, 1);
        } else {
          const posAttr = pObj.mesh.geometry.attributes.position as THREE.BufferAttribute;
          const vels = (pObj.mesh as any).velocities as THREE.Vector3[];
          for (let i = 0; i < vels.length; i++) {
            posAttr.setXYZ(
              i,
              posAttr.getX(i) + vels[i].x * dt,
              posAttr.getY(i) + vels[i].y * dt,
              posAttr.getZ(i) + vels[i].z * dt
            );
          }
          posAttr.needsUpdate = true;
          (pObj.mesh.material as THREE.PointsMaterial).opacity = 1 - pObj.life / pObj.maxLife;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      mapEnv.cleanup();
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [scenario, scenarioId, themeAccent, spawnTarget]);

  // Countdown timer
  useEffect(() => {
    setPhase("countdown");
    setCountdownNum(3);
    scoreRef.current = 0;
    shotsRef.current = 0;
    hitsRef.current = 0;
    headshotsRef.current = 0;
    hitTimesRef.current = [];
    comboRef.current = 0;
    timerRef.current = scenario.defaultDurationSec || 60;
    reactionTrialsRef.current = 0;
    reactionTimesRef.current = [];
    reactionWaitingRef.current = false;
    setLiveScore(0);
    setLiveAccuracy(100);
    setLiveTimer(scenario.defaultDurationSec || 60);

    aimSounds.playCountdownTick();
    let count = 3;
    const countInterval = setInterval(() => {
      count -= 1;
      setCountdownNum(count);
      if (count > 0) {
        aimSounds.playCountdownTick();
      } else if (count === 0) {
        aimSounds.playCountdownGo();
      } else {
        clearInterval(countInterval);
        setPhase("playing");
        isPlayingRef.current = true;

        if (scenarioId === "reaction_3d") {
          reactionWaitingRef.current = true;
          const delay = 1000 + Math.random() * 2500;
          window.clearTimeout(reactionTimerRef.current);
          reactionTimerRef.current = window.setTimeout(() => {
            spawnTarget(performance.now());
            reactionShowTimeRef.current = performance.now();
            reactionWaitingRef.current = false;
          }, delay);
        }
      }
    }, 800);

    return () => clearInterval(countInterval);
  }, [scenarioId, scenario, spawnTarget]);

  // Session duration timer
  useEffect(() => {
    if (phase !== "playing" || scenarioId === "reaction_3d") return;

    const sessionInterval = setInterval(() => {
      timerRef.current -= 1;
      setLiveTimer(timerRef.current);

      if (timerRef.current <= 0) {
        clearInterval(sessionInterval);
        finishSession();
      }
    }, 1000);

    return () => clearInterval(sessionInterval);
  }, [phase, scenarioId, finishSession]);

  // Input Listeners
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;
  const shootRaycastRef = useRef(shootRaycast);
  shootRaycastRef.current = shootRaycast;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const requestLock = useCallback(() => {
    const el = rendererRef.current?.domElement || mountRef.current;
    if (!el || phaseRef.current === "finished") return;
    try {
      if (document.pointerLockElement !== el) {
        const p = el.requestPointerLock?.();
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch(() => {});
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const lockEl = document.pointerLockElement;
      const isCurrentLocked = Boolean(
        lockEl && (lockEl === container || (rendererRef.current && lockEl === rendererRef.current.domElement))
      );
      if (!isCurrentLocked || !isPlayingRef.current) return;

      const sens = sensitivityRef.current;
      const sensMultiplier = (sens.sens * 0.07 * Math.PI) / 180;
      const dpiFactor = sens.dpi / 800;
      const scale = sensMultiplier * dpiFactor;

      eulerRef.current.y -= e.movementX * scale;
      eulerRef.current.x -= e.movementY * scale;

      const maxPitch = (85 * Math.PI) / 180;
      eulerRef.current.x = Math.max(-maxPitch, Math.min(maxPitch, eulerRef.current.x));

      if (cameraRef.current) {
        cameraRef.current.quaternion.setFromEuler(eulerRef.current);
      }
    };

    const handleLockChange = () => {
      const lockEl = document.pointerLockElement;
      const locked = Boolean(
        lockEl && (lockEl === container || (rendererRef.current && lockEl === rendererRef.current.domElement))
      );
      setIsLocked(locked);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        requestLock();
        if (isPlayingRef.current) {
          shootRaycastRef.current();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = true;
      if (e.key === "Escape") {
        releasePointerLock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("pointerlockchange", handleLockChange);
    document.addEventListener("mozpointerlockchange", handleLockChange);
    document.addEventListener("webkitpointerlockchange", handleLockChange);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("pointerlockchange", handleLockChange);
      document.removeEventListener("mozpointerlockchange", handleLockChange);
      document.removeEventListener("webkitpointerlockchange", handleLockChange);
      if (typeof document !== "undefined" && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };
  }, [requestLock, releasePointerLock]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0a0e13] overflow-hidden select-none">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        onClick={requestLock}
        className="relative w-full h-full cursor-none"
        style={{ cursor: phase === "finished" || !isLocked ? "default" : "none" }}
      >
        {/* Render 2D Crosshair over 3D Center */}
        {phase !== "finished" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              className="transform -translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2"
            >
              {crosshair.showCenterDot && (
                <circle
                  cx="30"
                  cy="30"
                  r={crosshair.centerDotSize}
                  fill={crosshair.color}
                  opacity={crosshair.innerLinesOpacity}
                />
              )}
              <line
                x1="30"
                y1={30 - crosshair.innerLinesOffset}
                x2="30"
                y2={30 - crosshair.innerLinesOffset - crosshair.innerLinesLength}
                stroke={crosshair.color}
                strokeWidth={crosshair.innerLinesThickness}
                opacity={crosshair.innerLinesOpacity}
              />
              <line
                x1="30"
                y1={30 + crosshair.innerLinesOffset}
                x2="30"
                y2={30 + crosshair.innerLinesOffset + crosshair.innerLinesLength}
                stroke={crosshair.color}
                strokeWidth={crosshair.innerLinesThickness}
                opacity={crosshair.innerLinesOpacity}
              />
              <line
                x1={30 - crosshair.innerLinesOffset}
                y1="30"
                x2={30 - crosshair.innerLinesOffset - crosshair.innerLinesLength}
                y2="30"
                stroke={crosshair.color}
                strokeWidth={crosshair.innerLinesThickness}
                opacity={crosshair.innerLinesOpacity}
              />
              <line
                x1={30 + crosshair.innerLinesOffset}
                y1="30"
                x2={30 + crosshair.innerLinesOffset + crosshair.innerLinesLength}
                y2="30"
                stroke={crosshair.color}
                strokeWidth={crosshair.innerLinesThickness}
                opacity={crosshair.innerLinesOpacity}
              />
            </svg>
          </div>
        )}

        {/* HUD Top Bar */}
        {phase === "playing" && (
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
            {/* Left: Mode info, Runner distance and controls */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4655] animate-ping" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {scenario.name}
                </span>
                <span className="text-[10px] text-[#8b97a3] font-bold">
                  ({MAPS[scenario.mapId]?.name || "3D"})
                </span>
              </div>

              {scenario.isRunnerMode && (
                <div className="px-3.5 py-1.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-2">
                  <span>DISTANCE :</span>
                  <span className="font-mono text-white text-sm">{distanceTraveled}m</span>
                </div>
              )}

              {scenario.allowMovement && !scenario.isRunnerMode && (
                <div className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-wider">
                  WASD / ZQSD Déplacement & Sauts Actifs
                </div>
              )}
            </div>

            {/* Center: Timer or Trials */}
            <div className="px-6 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
              {scenarioId !== "reaction_3d" ? (
                <>
                  <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Temps Restant</div>
                  <div className={`text-2xl font-black ${liveTimer <= 5 ? "text-red-500 animate-pulse" : "text-white"}`}>
                    {liveTimer}s
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Essai Réaction</div>
                  <div className="text-xl font-black text-white">
                    {reactionTrialsRef.current + 1} / 10
                  </div>
                </>
              )}
            </div>

            {/* Right: Accuracy & Live Score */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-right">
                <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Précision</div>
                <div className={`text-lg font-black ${liveAccuracy >= 80 ? "text-emerald-400" : liveAccuracy >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {liveAccuracy}%
                </div>
              </div>

              <div className="px-5 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-[#ff4655]/40 text-right">
                <div className="text-[10px] font-bold text-[#8b97a3] uppercase flex items-center justify-end gap-1">
                  <span>Score</span>
                  {dynamicMultiplier !== 1.0 && (
                    <span className="text-[9px] px-1.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      x{dynamicMultiplier}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-[#ff4655] tracking-tight">
                  {liveScore.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combo Badge */}
        {phase === "playing" && combo >= 3 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-widest backdrop-blur-md z-20 pointer-events-none animate-bounce">
            COMBO x{combo} 🔥
          </div>
        )}

        {/* Countdown Overlay */}
        {phase === "countdown" && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none">
            <div className="text-8xl font-black text-[#ff4655] animate-pulse">
              {countdownNum > 0 ? countdownNum : "GO!"}
            </div>
            <div className="text-sm font-bold text-[#8b97a3] mt-4 uppercase tracking-widest">
              {isCalibrationMode ? "Épreuve de Calibration 3D" : scenario.tagline}
            </div>
          </div>
        )}

        {/* Pointer Lock Help prompt */}
        {phase === "playing" && !isLocked && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-black/80 border border-[#ff4655]/50 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md z-30 pointer-events-none animate-pulse">
            Cliquez dans l&apos;écran pour verrouiller le curseur (Pointer Lock)
          </div>
        )}

        {/* Finished Screen Overlay */}
        {phase === "finished" && finalStats && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-in fade-in">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 text-center border border-[#ff4655]/40 shadow-2xl">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#ff4655]/20 text-[#ff4655] text-[10px] font-black uppercase tracking-widest border border-[#ff4655]/30">
                  Session Terminée
                </span>
                <h2 className="text-3xl font-black text-white mt-2">{scenario.name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Score Final</div>
                  <div className="text-3xl font-black text-[#ff4655] mt-1">
                    {finalStats.score.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Précision</div>
                  <div className={`text-3xl font-black mt-1 ${finalStats.accuracy >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                    {finalStats.accuracy}%
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-bold text-[#8b97a3] uppercase">Cibles Éliminées</div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {finalStats.targetsHit} / {finalStats.totalShots}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-bold text-[#8b97a3] uppercase">
                    {scenario.isRunnerMode ? "Distance Parcourue" : "Vitesse Moyenne"}
                  </div>
                  <div className="text-xl font-black text-sky-400 mt-0.5">
                    {scenario.isRunnerMode
                      ? `${finalStats.distanceTraveled || 0}m`
                      : `${finalStats.avgTimeToHitMs}ms`}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase("countdown");
                    setFinalStats(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#ff4655] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-accent-sm cursor-pointer"
                >
                  Rejouer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          releasePointerLock();
          onBack();
        }}
        className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
      >
        ← Quitter
      </button>
    </div>
  );
}
