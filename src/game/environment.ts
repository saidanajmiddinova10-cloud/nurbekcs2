import * as THREE from 'three';
import { ZoneConfig, CapturePoint } from '../types';

export interface EnvironmentResult {
  scene: THREE.Group;
  colliders: THREE.Box3[];
  coverPoints: THREE.Vector3[];
  waypoints: THREE.Vector3[];
  capturePoints: CapturePoint[];
  playerSpawn: THREE.Vector3;
  playerSpawnYaw: number;
  blueSpawns: THREE.Vector3[];
  redSpawns: THREE.Vector3[];
}

export function buildZoneEnvironment(zone: ZoneConfig): EnvironmentResult {
  const group = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const coverPoints: THREE.Vector3[] = [];
  const waypoints: THREE.Vector3[] = [];

  // 1. Ground Plane
  const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: zone.groundColor,
    roughness: 0.9,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  // Boundary Walls (Invisible or concrete perimeter)
  const perimeterMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8
  });

  const wallThickness = 2;
  const wallHeight = 8;
  const mapSize = 75;

  const perimeters = [
    { x: 0, z: -mapSize, w: mapSize * 2, d: wallThickness },
    { x: 0, z: mapSize, w: mapSize * 2, d: wallThickness },
    { x: -mapSize, z: 0, w: wallThickness, d: mapSize * 2 },
    { x: mapSize, z: 0, w: wallThickness, d: mapSize * 2 }
  ];

  perimeters.forEach((p) => {
    const geo = new THREE.BoxGeometry(p.w, wallHeight, p.d);
    const wall = new THREE.Mesh(geo, perimeterMat);
    wall.position.set(p.x, wallHeight / 2, p.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    const box = new THREE.Box3().setFromObject(wall);
    colliders.push(box);
  });

  // Helper to add a solid building/structure
  const addBuilding = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    hasRoof = true
  ) => {
    const bGeo = new THREE.BoxGeometry(w, h, d);
    const bMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.75,
      metalness: 0.15
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(x, h / 2, z);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    group.add(bMesh);

    colliders.push(new THREE.Box3().setFromObject(bMesh));

    // Cover points around building corners
    coverPoints.push(new THREE.Vector3(x + w / 2 + 1.2, 0, z));
    coverPoints.push(new THREE.Vector3(x - w / 2 - 1.2, 0, z));
    coverPoints.push(new THREE.Vector3(x, 0, z + d / 2 + 1.2));
    coverPoints.push(new THREE.Vector3(x, 0, z - d / 2 - 1.2));
  };

  // Helper to add shipping containers
  const addContainer = (x: number, z: number, yRot = 0, color = 0xd97706) => {
    const cGeo = new THREE.BoxGeometry(3.0, 2.8, 7.5);
    const cMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.35
    });
    const container = new THREE.Mesh(cGeo, cMat);
    container.position.set(x, 1.4, z);
    container.rotation.y = yRot;
    container.castShadow = true;
    container.receiveShadow = true;
    group.add(container);

    colliders.push(new THREE.Box3().setFromObject(container));
    coverPoints.push(new THREE.Vector3(x + 2.2, 0, z));
    coverPoints.push(new THREE.Vector3(x - 2.2, 0, z));
  };

  // Helper to add concrete barriers / sandbags
  const addBarrier = (x: number, z: number, yRot = 0) => {
    const bGeo = new THREE.BoxGeometry(2.4, 1.1, 0.6);
    const bMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.95
    });
    const barrier = new THREE.Mesh(bGeo, bMat);
    barrier.position.set(x, 0.55, z);
    barrier.rotation.y = yRot;
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    group.add(barrier);

    colliders.push(new THREE.Box3().setFromObject(barrier));
    coverPoints.push(new THREE.Vector3(x + 0.8 * Math.cos(yRot), 0, z + 0.8 * Math.sin(yRot)));
  };

  // Helper to add military crates
  const addCrateStack = (x: number, z: number) => {
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.8
    });
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.4), crateMat);
    crate1.position.set(x, 0.65, z);
    crate1.castShadow = true;
    group.add(crate1);

    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), crateMat);
    crate2.position.set(x + 0.2, 1.8, z + 0.1);
    crate2.castShadow = true;
    group.add(crate2);

    colliders.push(new THREE.Box3().setFromObject(crate1));
  };

  // Build Zone Specific Architecture
  switch (zone.environmentType) {
    case 'desert':
      // Military Hangars & Watchtowers
      addBuilding(-25, -20, 16, 7, 24, 0xb45309);
      addBuilding(25, -20, 16, 7, 24, 0xb45309);
      addBuilding(0, 30, 26, 6, 14, 0x78350f);

      // Central Bunker
      addBuilding(0, 0, 12, 4.5, 12, 0xd97706);

      // Watchtower in corner
      addBuilding(-35, 35, 4, 12, 4, 0x451a03);
      addBuilding(35, 35, 4, 12, 4, 0x451a03);

      // Sandbags & Crates
      addBarrier(-8, 5, 0);
      addBarrier(8, 5, 0);
      addBarrier(-8, -5, 0);
      addBarrier(8, -5, 0);
      addCrateStack(-14, 8);
      addCrateStack(14, -8);
      addCrateStack(0, -18);
      break;

    case 'urban':
      // Skyscrapers and Apartment blocks
      addBuilding(-28, -25, 20, 22, 16, 0x475569);
      addBuilding(28, -25, 20, 26, 16, 0x334155);
      addBuilding(-28, 25, 18, 18, 18, 0x1e293b);
      addBuilding(28, 25, 22, 20, 18, 0x475569);

      // Central Plaza Obelisk / Fountain
      addBuilding(0, 0, 6, 9, 6, 0x0f172a);

      // Concrete barricades
      addBarrier(-10, 8, Math.PI / 4);
      addBarrier(10, -8, -Math.PI / 4);
      addBarrier(-12, -12, 0);
      addBarrier(12, 12, Math.PI / 2);

      // Abandoned bus / truck
      addContainer(-6, -18, Math.PI / 6, 0x1e3a8a);
      addContainer(8, 16, -Math.PI / 5, 0x991b1b);
      break;

    case 'industrial':
      // Large refinery tanks
      const tankGeo = new THREE.CylinderGeometry(5.5, 5.5, 9, 16);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
      const tank1 = new THREE.Mesh(tankGeo, tankMat);
      tank1.position.set(-20, 4.5, -15);
      tank1.castShadow = true;
      group.add(tank1);
      colliders.push(new THREE.Box3().setFromObject(tank1));

      const tank2 = new THREE.Mesh(tankGeo, tankMat);
      tank2.position.set(-20, 4.5, 15);
      tank2.castShadow = true;
      group.add(tank2);
      colliders.push(new THREE.Box3().setFromObject(tank2));

      // Warehouses
      addBuilding(26, 0, 16, 8, 38, 0x57534e);
      addBuilding(0, 28, 28, 7, 14, 0x44403c);

      // Pipe racks & Containers
      addContainer(0, -6, 0, 0x047857);
      addContainer(0, 6, 0, 0xb45309);
      addCrateStack(-6, 0);
      addCrateStack(6, 0);
      break;

    case 'mountain':
      // Stone bunkers
      addBuilding(-24, -20, 18, 10, 18, 0x64748b);
      addBuilding(24, -20, 18, 10, 18, 0x64748b);
      addBuilding(0, 24, 22, 12, 16, 0x475569);

      // Rock formations
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const rx = Math.cos(angle) * 36;
        const rz = Math.sin(angle) * 36;
        addBuilding(rx, rz, 10, 14, 10, 0x334155);
      }

      addBarrier(-8, 0, Math.PI / 2);
      addBarrier(8, 0, Math.PI / 2);
      addCrateStack(0, 10);
      break;

    case 'port':
      // Dock side containers stack (multi-colored)
      const containerColors = [0x2563eb, 0xdc2626, 0x16a34a, 0xeab308, 0x9333ea];
      for (let i = 0; i < 6; i++) {
        addContainer(-20 + i * 4, -20, 0, containerColors[i % containerColors.length]);
        addContainer(-20 + i * 4, -14, 0, containerColors[(i + 2) % containerColors.length]);
      }
      for (let j = 0; j < 5; j++) {
        addContainer(16, -18 + j * 8, Math.PI / 2, containerColors[(j + 1) % containerColors.length]);
      }

      // Warehouse terminal
      addBuilding(0, 28, 34, 8, 16, 0x334155);

      // Dock barrier along water
      addBarrier(-15, 0, 0);
      addBarrier(0, 0, 0);
      addBarrier(15, 0, 0);
      break;

    case 'night':
    default:
      // Night industrial complex with dramatic towers
      addBuilding(-26, -20, 16, 12, 18, 0x0f172a);
      addBuilding(26, -20, 16, 12, 18, 0x0f172a);
      addBuilding(0, 26, 26, 10, 16, 0x1e293b);

      // Central transformer station
      addBuilding(0, 0, 10, 5, 10, 0x090d16);

      // Spotlights placed on buildings
      const spot1 = new THREE.SpotLight(0x38bdf8, 3.5, 45, Math.PI / 5, 0.4);
      spot1.position.set(-20, 11, -12);
      spot1.target.position.set(0, 0, 0);
      group.add(spot1);
      group.add(spot1.target);

      const spot2 = new THREE.SpotLight(0xf59e0b, 3.0, 45, Math.PI / 5, 0.4);
      spot2.position.set(20, 11, -12);
      spot2.target.position.set(0, 0, 0);
      group.add(spot2);
      group.add(spot2.target);

      addContainer(-10, 8, Math.PI / 3, 0x1e293b);
      addContainer(10, -8, -Math.PI / 3, 0x0f172a);
      addBarrier(-5, -5, 0);
      addBarrier(5, 5, 0);
      break;
  }

  // Pre-calculated tactical waypoints for bots to patrol across map
  const waypointCoords = [
    [-30, -30], [0, -32], [30, -30],
    [-25, -15], [0, -15], [25, -15],
    [-30, 0],   [-12, 0], [0, 0], [12, 0], [30, 0],
    [-25, 15],  [0, 15],  [25, 15],
    [-30, 30],  [0, 32],  [30, 30]
  ];

  waypointCoords.forEach(([wx, wz]) => {
    waypoints.push(new THREE.Vector3(wx, 0, wz));
  });

  // Capture Points A, B, C for Zone Control mode
  const capturePoints: CapturePoint[] = [
    { id: 'A', name: 'Zone Alpha', position: [-22, 0, -22], radius: 6, owner: 'neutral', progress: 0 },
    { id: 'B', name: 'Zone Bravo', position: [0, 0, 0], radius: 6.5, owner: 'neutral', progress: 0 },
    { id: 'C', name: 'Zone Charlie', position: [22, 0, 22], radius: 6, owner: 'neutral', progress: 0 }
  ];

  // Visual markers for capture zones
  capturePoints.forEach((cp) => {
    const ringGeo = new THREE.RingGeometry(cp.radius - 0.25, cp.radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(cp.position[0], 0.05, cp.position[2]);
    group.add(ring);

    // Glowing flag pole in center
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(cp.position[0], 2.25, cp.position[2]);
    group.add(pole);
  });

  // Spawns
  const playerSpawn = new THREE.Vector3(0, 1.7, -42);
  const blueSpawns = [
    new THREE.Vector3(-6, 0, -42),
    new THREE.Vector3(6, 0, -42),
    new THREE.Vector3(-12, 0, -38),
    new THREE.Vector3(12, 0, -38),
    new THREE.Vector3(0, 0, -45)
  ];
  const redSpawns = [
    new THREE.Vector3(0, 0, 42),
    new THREE.Vector3(-8, 0, 42),
    new THREE.Vector3(8, 0, 42),
    new THREE.Vector3(-16, 0, 38),
    new THREE.Vector3(16, 0, 38),
    new THREE.Vector3(0, 0, 46)
  ];

  return {
    scene: group,
    colliders,
    coverPoints,
    waypoints,
    capturePoints,
    playerSpawn,
    playerSpawnYaw: Math.PI, // Face toward battlefield center (Z > -42)
    blueSpawns,
    redSpawns
  };
}
