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
import {
  buildMapEnvironment,
  createRoboticBotGroup,
  createHolographicOrbGroup,
  CollisionBox,
  MAPS,
} from "./maps";
import { aimSounds } from "./sounds";

interface Props {
  scenarioId: AimScenarioId;
  crosshair: CrosshairSettings;
  sensitivity: ValorantSensSettings;
  adaptiveConfig?: AdaptiveConfig;
  themeAccent?: string;
  themeBg?: string;
  isCalibrationMode?: boolean;
  isPaused?: boolean;
  onTogglePause?: (paused: boolean) => void;
  roundPhaseLabel?: string;
  interRoundTimerSec?: number | null;
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
  themeBg = "#0a0e13",
  isCalibrationMode = false,
  isPaused = false,
  onTogglePause,
  roundPhaseLabel,
  interRoundTimerSec,
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

  // Performance / Game State Refs
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

  // Player Physics & Controlled Movement
  const keysDownRef = useRef<Record<string, boolean>>({});
  const playerVelocityRef = useRef(new THREE.Vector3());
  const playerPositionRef = useRef(new THREE.Vector3(0, 1.6, scenario.isRunnerMode ? 5 : 0));
  const isGroundedRef = useRef(true);
  const collisionBoxesRef = useRef<CollisionBox[]>([]);
  const lastSafePosRef = useRef(new THREE.Vector3(0, 2.0, 5));

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetsRef = useRef<Target3D[]>([]);
  const particlesRef = useRef<{ mesh: THREE.Points; life: number; maxLife: number }[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const generateMoreChunksRef = useRef<((playerZ: number) => void) | null>(null);

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

    const baseHitXp = hitsRef.current * 4;
    const scoreFactorXp = Math.round(scoreRef.current / 450);
    const comboBonusXp = maxComboRef.current >= 15 ? 50 : maxComboRef.current >= 8 ? 25 : 10;
    const hsBonusXp = Math.round((hsRate / 100) * hitsRef.current * 3);
    const xpEarned = Math.min(350, Math.max(40, baseHitXp + scoreFactorXp + comboBonusXp + hsBonusXp));

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
      xpEarned,
    };

    setFinalStats(stats);
    setPhase("finished");
    onFinish(stats);
  }, [scenarioId, onFinish, releasePointerLock]);

  // Particle explosion effect
  const spawnExplosion = useCallback((pos: THREE.Vector3, colorHex: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const count = 22;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8 + 2.5,
          (Math.random() - 0.5) * 8
        )
      );
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.22,
      transparent: true,
      opacity: 0.95,
    });

    const p = new THREE.Points(geo, mat);
    (p as any).velocities = velocities;
    scene.add(p);
    particlesRef.current.push({ mesh: p, life: 0, maxLife: 0.45 });
  }, []);

  // Spawn Target 3D
  const spawnTarget = useCallback(
    (now: number) => {
      const scene = sceneRef.current;
      if (!scene) return;

      const scale = adaptiveScaleRef.current;
      const speedMod = adaptiveSpeedRef.current;
      const playerPos = playerPositionRef.current;

      const isOrbScenario =
        scenarioId === "gridshot_3d" ||
        scenarioId === "floating_orbs" ||
        scenarioId === "reaction_3d";

      if (scenario.isRunnerMode) {
        // Runner: bot d'assaut apparaît 20m à 45m DEVANT le joueur (direction -Z)
        const aheadDist = 20 + Math.random() * 25;
        const targetZ = playerPos.z - aheadDist;
        const targetX = (Math.random() - 0.5) * 8;
        const targetY = 1.6 + Math.random() * 2.0;

        const bot = createRoboticBotGroup(scale, themeAccent);
        bot.group.position.set(targetX, targetY, targetZ);
        scene.add(bot.group);

        targetsRef.current.push({
          mesh: bot.group,
          headMesh: bot.headMesh,
          bodyMesh: bot.bodyMesh,
          position: new THREE.Vector3(targetX, targetY, targetZ),
          spawnTime: now,
          type: "mannequin",
          radius: 0.22 * scale,
          vx: (Math.random() - 0.5) * 3.0 * speedMod,
          minX: targetX - 3,
          maxX: targetX + 3,
        });
        return;
      }

      let distance = 16;
      let angle = 0;
      let elevation = 1.6;

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
        const orb = createHolographicOrbGroup(radius, scenario.targetColor);
        orb.group.position.set(x, y, z);
        scene.add(orb.group);

        targetObj = {
          mesh: orb.group,
          orbMesh: orb.orbMesh,
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
        const bot = createRoboticBotGroup(scale, themeAccent);
        bot.group.position.set(x, 0, z);
        scene.add(bot.group);

        targetObj = {
          mesh: bot.group,
          headMesh: bot.headMesh,
          bodyMesh: bot.bodyMesh,
          position: new THREE.Vector3(x, 0, z),
          spawnTime: now,
          type: "mannequin",
          radius: 0.22 * scale,
        };

        if (scenarioId === "tracking_strafe") {
          targetObj.vx = (Math.random() > 0.5 ? 1 : -1) * 3.8 * speedMod;
          targetObj.minX = x - 5.5;
          targetObj.maxX = x + 5.5;
        }
      }

      targetsRef.current.push(targetObj);
    },
    [scenarioId, scenario, themeAccent]
  );

  // Shoot raycast
  const shootRaycast = useCallback(() => {
    if (!isPlayingRef.current || isPaused || !cameraRef.current || !sceneRef.current) return;

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
        const intersects = raycasterRef.current.intersectObject(target.orbMesh, true);
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

        // DDA Real-Time Adjustment
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
          ? Math.round(Math.abs(playerPositionRef.current.z) * 1.5)
          : 0;

        const points = Math.round(
          (headBonus + speedBonus + comboBonus + runnerDistBonus) *
            scenario.scoreMultiplier *
            dynamicMultiplier
        );

        scoreRef.current += points;

        if (isHead) {
          aimSounds.playHeadshot();
          spawnExplosion(target.position, parseInt(themeAccent.replace("#", ""), 16));
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
  }, [scenarioId, scenario, themeAccent, spawnTarget, spawnExplosion, dynamicMultiplier, finishSession, onAdaptiveUpdate]);

  // Three.js Scene Setup & Physics Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const mapDef = MAPS[scenario.mapId] || MAPS.range;
    const scene = new THREE.Scene();
    const bgCol = new THREE.Color(themeBg || "#0a0e13");
    scene.background = bgCol;
    scene.fog = new THREE.FogExp2(bgCol, mapDef.fogDensity);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(71, width / height, 0.1, 1000);
    const initialZ = scenario.isRunnerMode ? 5 : 0;
    camera.position.set(0, 1.6, initialZ);
    cameraRef.current = camera;
    playerPositionRef.current.set(0, 1.6, initialZ);
    lastSafePosRef.current.set(0, 2.0, initialZ);

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
      2.4,
      50
    );
    themeLight.position.set(0, 8, -5);
    scene.add(themeLight);

    // Build map and extract collision boxes
    const mapEnv = buildMapEnvironment(scene, scenario.mapId, themeAccent, themeBg);
    collisionBoxesRef.current = mapEnv.collisionBoxes;
    generateMoreChunksRef.current = mapEnv.generateMoreChunks || null;

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

      // Player Movement & Solid Collision Engine
      if (scenario.allowMovement && isPlayingRef.current && !isPaused) {
        const keys = keysDownRef.current;
        const isSprinting = Boolean(keys["ShiftLeft"] || keys["ShiftRight"]);
        const baseSpeed = scenario.isRunnerMode ? 9.5 : 6.0;
        const moveSpeed = isSprinting ? baseSpeed * 1.35 : baseSpeed;

        const forward = new THREE.Vector3(0, 0, -1).applyEuler(
          new THREE.Euler(0, eulerRef.current.y, 0, "YXZ")
        );
        const right = new THREE.Vector3(1, 0, 0).applyEuler(
          new THREE.Euler(0, eulerRef.current.y, 0, "YXZ")
        );

        // Player ONLY moves when pressing directional keys (no auto-run!)
        const moveDir = new THREE.Vector3();
        if (keys["KeyW"] || keys["KeyZ"]) moveDir.add(forward);
        if (keys["KeyS"]) moveDir.sub(forward);
        if (keys["KeyD"]) moveDir.add(right);
        if (keys["KeyA"] || keys["KeyQ"]) moveDir.sub(right);

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          playerVelocityRef.current.x = moveDir.x * moveSpeed;
          playerVelocityRef.current.z = moveDir.z * moveSpeed;
        } else {
          playerVelocityRef.current.x *= 0.8;
          playerVelocityRef.current.z *= 0.8;
        }

        // Jump impulse
        if (keys["Space"] && isGroundedRef.current) {
          playerVelocityRef.current.y = 6.8;
          isGroundedRef.current = false;
          aimSounds.playJump();
        }

        // Gravity
        if (!isGroundedRef.current) {
          playerVelocityRef.current.y -= 14.5 * dt;
        }

        const prevPos = playerPositionRef.current.clone();
        const testX = prevPos.x + playerVelocityRef.current.x * dt;
        const testY = prevPos.y + playerVelocityRef.current.y * dt;
        const testZ = prevPos.z + playerVelocityRef.current.z * dt;

        const playerRadius = 0.45;
        const eyeHeight = 1.6;
        let groundY = -999;
        let resolvedX = testX;
        let resolvedZ = testZ;

        // Collision pass against all collision boxes
        for (const box of collisionBoxesRef.current) {
          // 0. Déclencheur Tremplin Jump Pad
          if (box.isJumpPad) {
            const minX = box.min.x - playerRadius;
            const maxX = box.max.x + playerRadius;
            const minZ = box.min.z - playerRadius;
            const maxZ = box.max.z + playerRadius;
            const pFeet = testY - eyeHeight;
            if (
              resolvedX >= minX &&
              resolvedX <= maxX &&
              testZ >= minZ &&
              testZ <= maxZ &&
              pFeet <= box.max.y + 0.5 &&
              pFeet >= box.min.y - 0.5
            ) {
              playerVelocityRef.current.y = box.jumpBoostY || 8.5;
              playerVelocityRef.current.z = -(Math.abs(box.jumpBoostZ || 14.0));
              isGroundedRef.current = false;
              aimSounds.playJump();
            }
            continue;
          }

          if (box.isRamp && box.rampZStart !== undefined && box.rampZEnd !== undefined) {
            // Ramp interpolation
            const minZ = Math.min(box.rampZStart, box.rampZEnd);
            const maxZ = Math.max(box.rampZStart, box.rampZEnd);
            if (
              resolvedX >= box.min.x - playerRadius &&
              resolvedX <= box.max.x + playerRadius &&
              testZ >= minZ &&
              testZ <= maxZ
            ) {
              const rampProgress = (box.rampZStart - testZ) / (box.rampZStart - box.rampZEnd);
              const rampH =
                box.rampStartY! + (box.rampEndY! - box.rampStartY!) * Math.max(0, Math.min(1, rampProgress));
              if (rampH > groundY && testY - eyeHeight <= rampH + 0.5) {
                groundY = rampH;
              }
            }
          } else {
            // Solid barrier / crate / wall AABB Collision Prevention
            const minX = box.min.x - playerRadius;
            const maxX = box.max.x + playerRadius;
            const minZ = box.min.z - playerRadius;
            const maxZ = box.max.z + playerRadius;
            const topY = box.max.y;
            const bottomY = box.min.y;

            // Check if player would be inside or crossing this obstacle at body height
            const playerFeet = testY - eyeHeight;
            if (playerFeet < topY - 0.15 && testY > bottomY) {
              // Horizontal collision: prevent passing through!
              if (resolvedX >= minX && resolvedX <= maxX && resolvedZ >= minZ && resolvedZ <= maxZ) {
                // Was previously outside along X? Block X movement
                if (prevPos.x <= minX || prevPos.x >= maxX) {
                  resolvedX = prevPos.x;
                  playerVelocityRef.current.x = 0;
                }
                // Was previously outside along Z? Block Z movement
                if (prevPos.z <= minZ || prevPos.z >= maxZ) {
                  resolvedZ = prevPos.z;
                  playerVelocityRef.current.z = 0;
                }
              }
            } else if (
              resolvedX >= minX &&
              resolvedX <= maxX &&
              resolvedZ >= minZ &&
              resolvedZ <= maxZ &&
              playerFeet >= topY - 0.4
            ) {
              // Player lands on top of crate/platform
              if (topY > groundY) {
                groundY = topY;
              }
            }
          }
        }

        // Ground landing resolution
        if (groundY > -900 && testY - eyeHeight <= groundY + 0.05) {
          if (!isGroundedRef.current) aimSounds.playLand();
          playerPositionRef.current.y = groundY + eyeHeight;
          playerVelocityRef.current.y = 0;
          isGroundedRef.current = true;
          lastSafePosRef.current.set(resolvedX, groundY + eyeHeight, resolvedZ);
        } else {
          isGroundedRef.current = false;
          playerPositionRef.current.y = testY;
        }

        // Void fall detection: respawn smoothly on safe platform
        if (playerPositionRef.current.y < -12) {
          playerPositionRef.current.copy(lastSafePosRef.current);
          playerVelocityRef.current.set(0, 0, 0);
          isGroundedRef.current = false;
        } else {
          playerPositionRef.current.x = resolvedX;
          playerPositionRef.current.z = resolvedZ;
        }

        camera.position.copy(playerPositionRef.current);
        setDistanceTraveled(Math.round(Math.abs(playerPositionRef.current.z)));

        // Infinite Highway chunk streamer: trigger more procedural chunks ahead
        if (generateMoreChunksRef.current) {
          generateMoreChunksRef.current(playerPositionRef.current.z);
        }
      }

      // Update moving targets
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

      // Particles decay & update
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
  }, [scenario, scenarioId, themeAccent, themeBg, spawnTarget]);

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

  // Synchronisation de l'état Pause (Manche Valorant ou déclencheur utilisateur)
  useEffect(() => {
    if (isPaused) {
      isPlayingRef.current = false;
      releasePointerLock();
    } else if (phase === "playing") {
      isPlayingRef.current = true;
    }
  }, [isPaused, phase, releasePointerLock]);

  // Session timer
  useEffect(() => {
    if (phase !== "playing" || scenarioId === "reaction_3d" || isPaused) return;

    const sessionInterval = setInterval(() => {
      timerRef.current -= 1;
      setLiveTimer(timerRef.current);

      if (timerRef.current <= 0) {
        clearInterval(sessionInterval);
        finishSession();
      }
    }, 1000);

    return () => clearInterval(sessionInterval);
  }, [phase, scenarioId, finishSession, isPaused]);

  // Stable refs for input listeners
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

  // Keyboard & Mouse Listeners with preventDefault to disable page scrolling & tracker shortcuts
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
      // Prevent browser / tracker shortcuts from scrolling or navigating
      if (
        e.code === "Space" ||
        e.code === "KeyW" ||
        e.code === "KeyS" ||
        e.code === "KeyA" ||
        e.code === "KeyD" ||
        e.code === "KeyZ" ||
        e.code === "KeyQ" ||
        e.code === "Tab"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      keysDownRef.current[e.code] = true;
      if (e.key === "Escape") {
        releasePointerLock();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.code === "Space" ||
        e.code === "KeyW" ||
        e.code === "KeyS" ||
        e.code === "KeyA" ||
        e.code === "KeyD"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      keysDownRef.current[e.code] = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    document.addEventListener("pointerlockchange", handleLockChange);
    document.addEventListener("mozpointerlockchange", handleLockChange);
    document.addEventListener("webkitpointerlockchange", handleLockChange);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
      window.removeEventListener("keyup", handleKeyUp, { capture: true } as any);
      document.removeEventListener("pointerlockchange", handleLockChange);
      document.removeEventListener("mozpointerlockchange", handleLockChange);
      document.removeEventListener("webkitpointerlockchange", handleLockChange);
      if (typeof document !== "undefined" && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    };
  }, [requestLock, releasePointerLock]);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: themeBg || "#0a0e13" }}
    >
      {/* 3D Viewport with tactical border frame */}
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
            {/* Left: Scenario info & Runner distance */}
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border flex items-center gap-2 shadow-lg"
                style={{ borderColor: `${themeAccent}50` }}
              >
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: themeAccent }} />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {scenario.name}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">
                  ({MAPS[scenario.mapId]?.name || "3D"})
                </span>
              </div>

              {scenario.isRunnerMode && (
                <div
                  className="px-4 py-2 rounded-2xl bg-black/70 border text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-2 shadow-lg"
                  style={{ borderColor: `${themeAccent}70` }}
                >
                  <span className="text-gray-300">DISTANCE :</span>
                  <span className="font-mono text-white text-base" style={{ color: themeAccent }}>
                    {distanceTraveled}m
                  </span>
                </div>
              )}

              {scenario.allowMovement && (
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-gray-200 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                  WASD / ZQSD • Espace (Saut) • Shift (Sprint)
                </div>
              )}
            </div>

            {/* Center: Timer or Trials */}
            <div className="px-6 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-center min-w-[130px] shadow-lg">
              {scenarioId !== "reaction_3d" ? (
                <>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Temps Restant</div>
                  <div className={`text-2xl font-black ${liveTimer <= 5 ? "text-red-500 animate-pulse" : "text-white"}`}>
                    {liveTimer}s
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Essai Réaction</div>
                  <div className="text-xl font-black text-white">
                    {reactionTrialsRef.current + 1} / 10
                  </div>
                </>
              )}
            </div>

            {/* Right: Accuracy & Live Score + Inter-Round status */}
            <div className="flex items-center gap-3">
              {interRoundTimerSec !== undefined && interRoundTimerSec !== null && (
                <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Achat : {interRoundTimerSec}s</span>
                </div>
              )}

              <div className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-right shadow-lg">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Précision</div>
                <div className={`text-lg font-black ${liveAccuracy >= 80 ? "text-emerald-400" : liveAccuracy >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {liveAccuracy}%
                </div>
              </div>

              <div
                className="px-5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border text-right shadow-lg"
                style={{ borderColor: `${themeAccent}80` }}
              >
                <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-end gap-1">
                  <span>Score</span>
                  {dynamicMultiplier !== 1.0 && (
                    <span className="text-[9px] px-1.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-black">
                      x{dynamicMultiplier}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black tracking-tight" style={{ color: themeAccent }}>
                  {liveScore.toLocaleString()}
                </div>
              </div>

              {onTogglePause && (
                <button
                  type="button"
                  onClick={() => onTogglePause(!isPaused)}
                  className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-black/70 hover:bg-black/90 border border-white/20 text-white text-xs font-black uppercase transition-all shadow-lg cursor-pointer"
                >
                  {isPaused ? "Reprendre ▶" : "Pause ⏸️"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Combo Badge */}
        {phase === "playing" && combo >= 3 && (
          <div
            className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest backdrop-blur-md z-20 pointer-events-none animate-bounce shadow-xl"
            style={{
              backgroundColor: `${themeAccent}25`,
              borderColor: themeAccent,
              color: themeAccent,
            }}
          >
            COMBO x{combo} 🔥
          </div>
        )}

        {/* Pause Overlay (Déclenché automatiquement lors du lancement d'une manche) */}
        {isPaused && phase === "playing" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-in fade-in">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 border border-white/10 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center text-2xl font-black shadow-lg">
                ⏸️
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  {roundPhaseLabel || "Manche Valorant en cours"}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">Stand de Tir en Pause</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                  Votre entraînement est sauvegardé à la seconde exacte. Le stand sera de nouveau actif dès la fin de la manche.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-around text-center">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">Chrono restant</div>
                  <div className="text-lg font-black text-white font-mono">{liveTimer}s</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">Score actuel</div>
                  <div className="text-lg font-black text-[#ff4655] font-mono">{liveScore}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)] font-bold">Combo</div>
                  <div className="text-lg font-black text-amber-400 font-mono">x{combo}</div>
                </div>
              </div>

              {onTogglePause && (
                <button
                  type="button"
                  onClick={() => onTogglePause(false)}
                  className="w-full py-3 rounded-xl bg-[var(--color-val-red)] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Reprendre Immédiatement ▶
                </button>
              )}
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {phase === "countdown" && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none">
            <div className="text-9xl font-black animate-pulse" style={{ color: themeAccent }}>
              {countdownNum > 0 ? countdownNum : "GO!"}
            </div>
            <div className="text-sm font-bold text-gray-300 mt-4 uppercase tracking-widest">
              {isCalibrationMode ? "Épreuve de Calibration 3D" : scenario.tagline}
            </div>
          </div>
        )}

        {/* Pointer Lock Help prompt */}
        {phase === "playing" && !isLocked && !isPaused && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-black/85 border text-white text-xs font-black uppercase tracking-wider backdrop-blur-md z-30 pointer-events-none animate-pulse shadow-xl"
            style={{ borderColor: themeAccent }}
          >
            Cliquez dans l&apos;écran pour verrouiller le viseur (Pointer Lock)
          </div>
        )}

        {/* Finished Screen Overlay */}
        {phase === "finished" && finalStats && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-40 p-4 animate-in fade-in">
            <div
              className="glass-panel rounded-3xl p-6 sm:p-9 max-w-lg w-full space-y-6 text-center border shadow-2xl backdrop-blur-2xl"
              style={{ borderColor: `${themeAccent}60` }}
            >
              <div>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                  style={{
                    backgroundColor: `${themeAccent}20`,
                    borderColor: `${themeAccent}40`,
                    color: themeAccent,
                  }}
                >
                  Session Terminée
                </span>
                <h2 className="text-3xl font-black text-white mt-2">{scenario.name}</h2>
              </div>

              {/* Badge Expérience Gagnée */}
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-between text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <span className="text-xs font-black uppercase tracking-wider">Expérience Gagnée</span>
                </div>
                <div className="text-xl font-black font-mono">
                  +{finalStats.xpEarned || 120} XP
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Score Final</div>
                  <div className="text-3xl font-black mt-1" style={{ color: themeAccent }}>
                    {finalStats.score.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Précision</div>
                  <div className={`text-3xl font-black mt-1 ${finalStats.accuracy >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                    {finalStats.accuracy}%
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Cibles Éliminées</div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {finalStats.targetsHit} / {finalStats.totalShots}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
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
                  className="flex-1 py-3 px-4 rounded-xl hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: themeAccent }}
                >
                  Rejouer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Button top-left */}
      <button
        type="button"
        onClick={() => {
          releasePointerLock();
          onBack();
        }}
        className="absolute top-4 left-4 z-30 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-black/90 border border-white/15 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer backdrop-blur-md shadow-lg"
      >
        ← Quitter
      </button>
    </div>
  );
}
