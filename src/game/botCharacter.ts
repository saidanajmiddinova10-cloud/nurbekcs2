import * as THREE from 'three';
import { Team } from '../types';

export interface BotVisualConfig {
  camoColor: number;
  vestColor: number;
  helmetColor: number;
  skinColor: number;
  hasBackpack: boolean;
  hasVisor: boolean;
  hasGoggles: boolean;
  radioAntenna: boolean;
  name: string;
}

export const BOT_VARIATIONS: BotVisualConfig[] = [
  { camoColor: 0x1f2937, vestColor: 0x111827, helmetColor: 0x111827, skinColor: 0xd4a373, hasBackpack: true, hasVisor: true, hasGoggles: false, radioAntenna: true, name: 'SpecOps Phantom' },
  { camoColor: 0xc2a675, vestColor: 0x92784f, helmetColor: 0xa88f61, skinColor: 0xe0ac69, hasBackpack: true, hasVisor: false, hasGoggles: true, radioAntenna: true, name: 'Desert Raider' },
  { camoColor: 0x4b5563, vestColor: 0x374151, helmetColor: 0x1f2937, skinColor: 0xc68642, hasBackpack: false, hasVisor: true, hasGoggles: false, radioAntenna: false, name: 'Urban Vanguard' },
  { camoColor: 0x3f4f38, vestColor: 0x2e3b29, helmetColor: 0x364630, skinColor: 0xf1c27d, hasBackpack: true, hasVisor: false, hasGoggles: true, radioAntenna: true, name: 'Woodland Hunter' },
  { camoColor: 0x94a3b8, vestColor: 0x64748b, helmetColor: 0x475569, skinColor: 0xffdbac, hasBackpack: true, hasVisor: true, hasGoggles: false, radioAntenna: true, name: 'Arctic Ghost' },
  { camoColor: 0x1e293b, vestColor: 0x0f172a, helmetColor: 0x0f172a, skinColor: 0x8d5524, hasBackpack: true, hasVisor: true, hasGoggles: true, radioAntenna: true, name: 'Midnight Stalker' },
  { camoColor: 0x78716c, vestColor: 0x57534e, helmetColor: 0x44403c, skinColor: 0xe0ac69, hasBackpack: false, hasVisor: false, hasGoggles: true, radioAntenna: false, name: 'Mercenary Iron' },
  { camoColor: 0x365314, vestColor: 0x1a2e05, helmetColor: 0x142003, skinColor: 0xd4a373, hasBackpack: true, hasVisor: false, hasGoggles: false, radioAntenna: true, name: 'Frontier Commando' },
  { camoColor: 0x334155, vestColor: 0x1e293b, helmetColor: 0x0f172a, skinColor: 0xc68642, hasBackpack: true, hasVisor: true, hasGoggles: true, radioAntenna: true, name: 'Elite Enforcer' },
  { camoColor: 0x52525b, vestColor: 0x27272a, helmetColor: 0x18181b, skinColor: 0xf1c27d, hasBackpack: true, hasVisor: false, hasGoggles: true, radioAntenna: true, name: 'Shadow Sentry' },
  { camoColor: 0x44403c, vestColor: 0x292524, helmetColor: 0x1c1917, skinColor: 0x8d5524, hasBackpack: false, hasVisor: true, hasGoggles: false, radioAntenna: true, name: 'Heavy Breacher' },
  { camoColor: 0x65a30d, vestColor: 0x3f6212, helmetColor: 0x365314, skinColor: 0xffdbac, hasBackpack: true, hasVisor: false, hasGoggles: true, radioAntenna: false, name: 'Tactical Marksman' },
];

export interface HumanBotMeshContainer {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weapon: THREE.Group;
  muzzleFlash: THREE.Mesh;
  hitBoxes: {
    head: THREE.Mesh;
    chest: THREE.Mesh;
    legs: THREE.Mesh;
  };
}

/**
 * Creates an authentically proportioned human soldier in modern military tactical gear
 */
export function createHumanSoldierMesh(
  variationIndex: number,
  team: Team
): HumanBotMeshContainer {
  const config = BOT_VARIATIONS[variationIndex % BOT_VARIATIONS.length];
  const root = new THREE.Group();

  // Materials with physical roughness & realism
  const camoMat = new THREE.MeshStandardMaterial({
    color: config.camoColor,
    roughness: 0.85,
    metalness: 0.05
  });

  const vestMat = new THREE.MeshStandardMaterial({
    color: config.vestColor,
    roughness: 0.8,
    metalness: 0.1
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: config.helmetColor,
    roughness: 0.65,
    metalness: 0.25
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: config.skinColor,
    roughness: 0.6,
    metalness: 0.0
  });

  const darkGearMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
    metalness: 0.3
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x0f0f11,
    roughness: 0.9,
    metalness: 0.1
  });

  // Team identification armband
  const teamArmbandMat = new THREE.MeshStandardMaterial({
    color: team === 'blue' ? 0x2563eb : 0xdc2626,
    roughness: 0.5,
    metalness: 0.2,
    emissive: team === 'blue' ? 0x1d4ed8 : 0xb91c1c,
    emissiveIntensity: 0.25
  });

  // ========== 1. TORSO & PELVIS ==========
  const torso = new THREE.Group();
  torso.position.y = 1.05; // Human hip/torso center

  // Pelvis/Hips
  const pelvisGeo = new THREE.BoxGeometry(0.38, 0.2, 0.24);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, camoMat);
  pelvisMesh.position.y = -0.15;
  pelvisMesh.castShadow = true;
  torso.add(pelvisMesh);

  // Main Chest/Abdomen
  const chestGeo = new THREE.BoxGeometry(0.42, 0.44, 0.26);
  const chestMesh = new THREE.Mesh(chestGeo, camoMat);
  chestMesh.position.y = 0.16;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Tactical Plate Carrier Vest (Bulky front & rear plates)
  const vestGeo = new THREE.BoxGeometry(0.46, 0.38, 0.32);
  const vestMesh = new THREE.Mesh(vestGeo, vestMat);
  vestMesh.position.y = 0.18;
  vestMesh.castShadow = true;
  torso.add(vestMesh);

  // Modular MOLLE Ammo Pouches on front of vest
  for (let p = -1; p <= 1; p++) {
    const pouchGeo = new THREE.BoxGeometry(0.09, 0.14, 0.08);
    const pouchMesh = new THREE.Mesh(pouchGeo, darkGearMat);
    pouchMesh.position.set(p * 0.12, 0.12, 0.18);
    pouchMesh.castShadow = true;
    torso.add(pouchMesh);
  }

  // Tactical Radio Unit on shoulder
  const radioGeo = new THREE.BoxGeometry(0.08, 0.14, 0.06);
  const radioMesh = new THREE.Mesh(radioGeo, darkGearMat);
  radioMesh.position.set(-0.16, 0.32, 0.12);
  torso.add(radioMesh);

  if (config.radioAntenna) {
    const antGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.26);
    const antMesh = new THREE.Mesh(antGeo, darkGearMat);
    antMesh.position.set(-0.16, 0.48, 0.12);
    torso.add(antMesh);
  }

  // Tactical Backpack
  if (config.hasBackpack) {
    const bpGeo = new THREE.BoxGeometry(0.32, 0.36, 0.18);
    const bpMesh = new THREE.Mesh(bpGeo, vestMat);
    bpMesh.position.set(0, 0.16, -0.22);
    bpMesh.castShadow = true;
    torso.add(bpMesh);

    // Bedroll / hydration top
    const rollGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    rollGeo.rotateZ(Math.PI / 2);
    const rollMesh = new THREE.Mesh(rollGeo, darkGearMat);
    rollMesh.position.set(0, 0.34, -0.2);
    torso.add(rollMesh);
  }

  // ========== 2. HEAD & HELMET ==========
  const head = new THREE.Group();
  head.position.y = 0.44; // On top of chest

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.1, 8);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.y = 0.02;
  head.add(neckMesh);

  // Human Head Base
  const headGeo = new THREE.SphereGeometry(0.14, 12, 12);
  headGeo.scale(1.0, 1.15, 1.05);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.y = 0.16;
  headMesh.castShadow = true;
  head.add(headMesh);

  // Tactical Balaclava / Face Mask (lower half)
  const maskGeo = new THREE.CylinderGeometry(0.13, 0.12, 0.13, 12);
  const maskMesh = new THREE.Mesh(maskGeo, darkGearMat);
  maskMesh.position.set(0, 0.12, 0.04);
  head.add(maskMesh);

  // Tactical Ballistic Helmet
  const helmetGeo = new THREE.SphereGeometry(0.165, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
  const helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
  helmetMesh.position.set(0, 0.20, 0);
  helmetMesh.castShadow = true;
  head.add(helmetMesh);

  // Helmet side rails
  const railGeo = new THREE.BoxGeometry(0.03, 0.04, 0.16);
  const leftRail = new THREE.Mesh(railGeo, darkGearMat);
  leftRail.position.set(-0.16, 0.20, 0);
  head.add(leftRail);

  const rightRail = new THREE.Mesh(railGeo, darkGearMat);
  rightRail.position.set(0.16, 0.20, 0);
  head.add(rightRail);

  // Visor or Tactical Goggles
  if (config.hasVisor) {
    const visorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.07, 12, 1, false, Math.PI * 0.15, Math.PI * 0.7);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0e1726,
      roughness: 0.2,
      metalness: 0.9
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.18, 0.03);
    head.add(visorMesh);
  } else if (config.hasGoggles) {
    const goggleFrame = new THREE.BoxGeometry(0.24, 0.06, 0.08);
    const goggleMesh = new THREE.Mesh(goggleFrame, darkGearMat);
    goggleMesh.position.set(0, 0.21, 0.12);
    head.add(goggleMesh);

    const lensGeo = new THREE.BoxGeometry(0.2, 0.04, 0.02);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.position.set(0, 0.21, 0.16);
    head.add(lensMesh);
  }

  torso.add(head);

  // ========== 3. ARMS & WEAPON GRIP ==========
  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.32, 0.0);

  const leftShoulderGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const leftShoulder = new THREE.Mesh(leftShoulderGeo, camoMat);
  leftArm.add(leftShoulder);

  // Team Armband on upper arm
  const armbandGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.08, 12);
  const armbandMesh = new THREE.Mesh(armbandGeo, teamArmbandMat);
  armbandMesh.position.y = -0.07;
  leftArm.add(armbandMesh);

  const leftUpperGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.24, 8);
  const leftUpper = new THREE.Mesh(leftUpperGeo, camoMat);
  leftUpper.position.y = -0.16;
  leftUpper.castShadow = true;
  leftArm.add(leftUpper);

  // Lower arm & Glove
  const leftLowerGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.24, 8);
  const leftLower = new THREE.Mesh(leftLowerGeo, darkGearMat);
  leftLower.position.set(0.06, -0.32, 0.16);
  leftLower.rotation.x = Math.PI / 4;
  leftLower.rotation.y = -Math.PI / 8;
  leftLower.castShadow = true;
  leftArm.add(leftLower);

  torso.add(leftArm);

  // Right Arm (Aiming forward holding rifle)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.32, 0.0);

  const rightShoulderGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const rightShoulder = new THREE.Mesh(rightShoulderGeo, camoMat);
  rightArm.add(rightShoulder);

  const rightUpperGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.24, 8);
  const rightUpper = new THREE.Mesh(rightUpperGeo, camoMat);
  rightUpper.position.y = -0.16;
  rightUpper.castShadow = true;
  rightArm.add(rightUpper);

  const rightLowerGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.24, 8);
  const rightLower = new THREE.Mesh(rightLowerGeo, darkGearMat);
  rightLower.position.set(-0.06, -0.32, 0.16);
  rightLower.rotation.x = Math.PI / 4;
  rightLower.rotation.y = Math.PI / 8;
  rightLower.castShadow = true;
  rightArm.add(rightLower);

  torso.add(rightArm);

  // Rifle held in hands
  const weapon = new THREE.Group();
  weapon.position.set(0.12, 0.05, 0.38);

  const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.55), darkGearMat);
  rifleBody.castShadow = true;
  weapon.add(rifleBody);

  const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), darkGearMat);
  rifleBarrel.rotation.x = Math.PI / 2;
  rifleBarrel.position.set(0, 0.02, 0.4);
  weapon.add(rifleBarrel);

  const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.08), darkGearMat);
  rifleMag.position.set(0, -0.12, 0.05);
  rifleMag.rotation.x = 0.25;
  weapon.add(rifleMag);

  const rifleScope = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), darkGearMat);
  rifleScope.position.set(0, 0.07, 0.0);
  weapon.add(rifleScope);

  // Muzzle flash plane (hidden by default)
  const flashGeo = new THREE.PlaneGeometry(0.24, 0.24);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffea79,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlash.position.set(0, 0.02, 0.6);
  weapon.add(muzzleFlash);

  torso.add(weapon);

  // ========== 4. LEGS & BOOTS ==========
  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, -0.22, 0);

  const leftThighGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.42, 8);
  const leftThigh = new THREE.Mesh(leftThighGeo, camoMat);
  leftThigh.position.y = -0.21;
  leftThigh.castShadow = true;
  leftLeg.add(leftThigh);

  // Knee Pad
  const kneeGeo = new THREE.BoxGeometry(0.12, 0.1, 0.06);
  const leftKnee = new THREE.Mesh(kneeGeo, darkGearMat);
  leftKnee.position.set(0, -0.42, 0.07);
  leftLeg.add(leftKnee);

  // Shin/Calf
  const leftShinGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8);
  const leftShin = new THREE.Mesh(leftShinGeo, camoMat);
  leftShin.position.y = -0.62;
  leftShin.castShadow = true;
  leftLeg.add(leftShin);

  // Combat Boot
  const bootGeo = new THREE.BoxGeometry(0.11, 0.14, 0.22);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(0, -0.80, 0.04);
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);

  torso.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, -0.22, 0);

  const rightThighGeo = new THREE.CylinderGeometry(0.085, 0.07, 0.42, 8);
  const rightThigh = new THREE.Mesh(rightThighGeo, camoMat);
  rightThigh.position.y = -0.21;
  rightThigh.castShadow = true;
  rightLeg.add(rightThigh);

  // Side Holster on Right Thigh
  const holsterGeo = new THREE.BoxGeometry(0.08, 0.16, 0.1);
  const holsterMesh = new THREE.Mesh(holsterGeo, darkGearMat);
  holsterMesh.position.set(0.11, -0.22, 0.0);
  rightLeg.add(holsterMesh);

  const rightKnee = new THREE.Mesh(kneeGeo, darkGearMat);
  rightKnee.position.set(0, -0.42, 0.07);
  rightLeg.add(rightKnee);

  const rightShinGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8);
  const rightShin = new THREE.Mesh(rightShinGeo, camoMat);
  rightShin.position.y = -0.62;
  rightShin.castShadow = true;
  rightLeg.add(rightShin);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0, -0.80, 0.04);
  rightBoot.castShadow = true;
  rightLeg.add(rightBoot);

  torso.add(rightLeg);

  root.add(torso);

  // Invisible Hitboxes for Raycasting (Head, Chest, Legs)
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  const headHitBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), hitMat);
  headHitBox.position.set(0, 1.65, 0);
  root.add(headHitBox);

  const chestHitBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.45), hitMat);
  chestHitBox.position.set(0, 1.15, 0);
  root.add(chestHitBox);

  const legsHitBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.45), hitMat);
  legsHitBox.position.set(0, 0.45, 0);
  root.add(legsHitBox);

  return {
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    muzzleFlash,
    hitBoxes: {
      head: headHitBox,
      chest: chestHitBox,
      legs: legsHitBox
    }
  };
}
