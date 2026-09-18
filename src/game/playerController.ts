import * as THREE from 'three';
import { WeaponData } from '../types';
import { soundEngine } from '../audio/soundSystem';

export interface PlayerControllerOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  colliders: THREE.Box3[];
  initialPosition?: THREE.Vector3;
  initialYaw?: number;
  mouseSensitivity?: number;
  invertY?: boolean;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private colliders: THREE.Box3[];

  // Movement State
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded = true;
  public isSprinting = false;
  public isCrouching = false;
  public isAiming = false;
  public isReloading = false;

  // Jumping Physics
  public verticalVelocity = 0;
  public jumpStrength = 7.0;
  public gravity = 18.0;

  // Camera angles
  public pitch = 0; // vertical rotation
  public yaw = 0;   // horizontal rotation
  public mouseSensitivity = 0.0022;
  public invertY = false;

  // Viewmodel & Hands
  public weaponRig: THREE.Group;
  public weaponMesh: THREE.Group;
  public muzzleFlash: THREE.Mesh;
  public currentWeapon!: WeaponData;

  // Animation values
  private bobTime = 0;
  private recoilPitch = 0;
  private recoilYaw = 0;
  private recoilOffset = new THREE.Vector3();
  private footstepTimer = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  public isPointerLocked = false;

  // Target FOV
  public baseFov = 75;

  constructor(options: PlayerControllerOptions) {
    this.camera = options.camera;
    this.camera.rotation.order = 'YXZ';
    this.domElement = options.domElement;
    this.colliders = options.colliders;
    this.position = options.initialPosition ? options.initialPosition.clone() : new THREE.Vector3(0, 1.7, 0);
    if (options.initialYaw !== undefined) this.yaw = options.initialYaw;
    if (options.mouseSensitivity) this.mouseSensitivity = options.mouseSensitivity;
    if (options.invertY !== undefined) this.invertY = options.invertY;

    // Build 1st-Person Weapon Viewmodel Rig
    this.weaponRig = new THREE.Group();
    this.weaponMesh = new THREE.Group();
    this.weaponRig.add(this.weaponMesh);
    this.camera.add(this.weaponRig);

    // Muzzle flash on weapon
    const flashGeo = new THREE.PlaneGeometry(0.2, 0.2);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xfff388,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlash.position.set(0, 0.05, -0.6);
    this.weaponMesh.add(this.muzzleFlash);

    this.setupInputs();
  }

  public setWeapon(weapon: WeaponData) {
    this.currentWeapon = weapon;
    this.rebuildWeaponMesh(weapon);
  }

  // Procedural 1st Person Weapon & Hands Viewmodel
  private rebuildWeaponMesh(weapon: WeaponData) {
    // Clear previous children
    while (this.weaponMesh.children.length > 0) {
      const child = this.weaponMesh.children[0];
      this.weaponMesh.remove(child);
    }

    // Hands material (tactical combat gloves)
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      metalness: 0.1
    });

    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.9
    });

    // Weapon metal material
    const weaponMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.75
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Tactical blue accent strip
      roughness: 0.4,
      metalness: 0.5
    });

    // Right Arm/Forearm & Hand
    const rightArm = new THREE.Group();
    rightArm.position.set(0.18, -0.22, -0.25);
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.32), sleeveMat);
    rightForearm.rotation.x = Math.PI / 3;
    rightArm.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.11), gloveMat);
    rightHand.position.set(0, -0.02, -0.15);
    rightArm.add(rightHand);
    this.weaponMesh.add(rightArm);

    // Left Arm/Forearm supporting barrel
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.16, -0.24, -0.32);
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.3), sleeveMat);
    leftForearm.rotation.x = Math.PI / 3.2;
    leftForearm.rotation.y = -Math.PI / 6;
    leftArm.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.1), gloveMat);
    leftHand.position.set(0.08, 0.04, -0.12);
    leftArm.add(leftHand);
    this.weaponMesh.add(leftArm);

    // Build category specific weapon geometry
    const gunGroup = new THREE.Group();

    if (weapon.category === 'knife') {
      // Tactical Combat Knife Blade & Grip
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14), gloveMat);
      grip.position.set(0, 0, 0);
      gunGroup.add(grip);

      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.03), weaponMat);
      guard.position.set(0, 0.07, 0);
      gunGroup.add(guard);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.006), weaponMat);
      blade.position.set(0, 0.18, 0);
      gunGroup.add(blade);
      gunGroup.rotation.x = Math.PI / 4;
      gunGroup.position.set(0.12, -0.16, -0.42);
    } else if (weapon.category === 'pistol') {
      // Tactical Pistol
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.22), weaponMat);
      gunGroup.add(receiver);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.12, 0.05), gloveMat);
      handle.position.set(0, -0.07, 0.05);
      handle.rotation.x = 0.25;
      gunGroup.add(handle);

      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.045, 0.22), weaponMat);
      slide.position.set(0, 0.04, 0);
      gunGroup.add(slide);

      gunGroup.position.set(0.14, -0.14, -0.42);
    } else if (weapon.id === 'AK-47') {
      // Iconic AK-47 Kalashnikov with Wood Stock & Handguard
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0x854d0e, // Rich dark wood
        roughness: 0.65,
        metalness: 0.1
      });
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.085, 0.44), weaponMat);
      gunGroup.add(receiver);

      // Wooden Stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.095, 0.26), woodMat);
      stock.position.set(0, -0.02, 0.28);
      stock.rotation.x = -0.08;
      gunGroup.add(stock);

      // Wooden Handguard
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.18), woodMat);
      handguard.position.set(0, 0.01, -0.26);
      gunGroup.add(handguard);

      // Steel Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.38), weaponMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.015, -0.42);
      gunGroup.add(barrel);

      // Curved Magazine (Banana Clip)
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.22, 0.075), weaponMat);
      mag.position.set(0, -0.12, -0.06);
      mag.rotation.x = 0.32;
      gunGroup.add(mag);

      // Front sight post
      const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.02), weaponMat);
      frontSight.position.set(0, 0.05, -0.56);
      gunGroup.add(frontSight);

      gunGroup.position.set(0.16, -0.17, -0.44);
    } else if (weapon.category === 'sniper') {
      // Heavy Sniper Rifle (AWM)
      const awmMat = new THREE.MeshStandardMaterial({
        color: 0x3f4f3e, // Military Olive Green
        roughness: 0.65,
        metalness: 0.25
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.085, 0.72), awmMat);
      gunGroup.add(body);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62), weaponMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.56);
      gunGroup.add(barrel);

      // Massive Optical Scope
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.28), weaponMat);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.085, -0.06);
      gunGroup.add(scope);

      // Scope lens (blue anti-glare coating)
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), lensMat);
      lens.position.set(0, 0.085, -0.205);
      lens.rotation.y = Math.PI;
      gunGroup.add(lens);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.08), weaponMat);
      mag.position.set(0, -0.09, 0.04);
      gunGroup.add(mag);

      gunGroup.position.set(0.16, -0.16, -0.46);
    } else {
      // Assault Rifles & SMGs
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.48), weaponMat);
      gunGroup.add(receiver);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38), weaponMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.015, -0.38);
      gunGroup.add(barrel);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.2, 0.07), accentMat);
      mag.position.set(0, -0.12, -0.04);
      mag.rotation.x = 0.2;
      gunGroup.add(mag);

      const sight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.14), weaponMat);
      sight.position.set(0, 0.065, -0.06);
      gunGroup.add(sight);

      gunGroup.position.set(0.16, -0.17, -0.44);
    }

    this.weaponMesh.add(gunGroup);

    // Re-attach muzzle flash
    this.weaponMesh.add(this.muzzleFlash);
    this.muzzleFlash.position.set(0.16, -0.15, -0.85);
  }

  public jump() {
    if (this.isGrounded) {
      this.verticalVelocity = this.jumpStrength;
      this.isGrounded = false;
      soundEngine.playJump();
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' && this.isPointerLocked) {
        this.jump();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      const sens = this.isAiming ? this.mouseSensitivity * 0.55 : this.mouseSensitivity;
      this.yaw -= e.movementX * sens;

      // Mouse Pitch (Y-axis):
      // With Euler order 'YXZ', positive pitch tilts camera UP.
      // In browser pointer lock, moving mouse forward/up produces negative movementY.
      // Standard (invertY = false): pitch -= movementY * sens (pushing mouse up -> looks UP).
      // Inverted (invertY = true):  pitch += movementY * sens (pushing mouse up -> looks DOWN).
      const yMultiplier = this.invertY ? -1 : 1;
      this.pitch -= e.movementY * sens * yMultiplier;

      // Clamp vertical pitch (-88 to +88 degrees)
      const maxPitch = (Math.PI / 2) * 0.95;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        // Right click ADS
        this.isAiming = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isAiming = false;
      }
    });

    // Prevent context menu in gameplay
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  public lockPointer() {
    this.domElement.requestPointerLock?.();
  }

  public unlockPointer() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  public setInvertY(invert: boolean) {
    this.invertY = invert;
  }

  public setMouseSensitivity(sens: number) {
    this.mouseSensitivity = sens;
  }

  // Trigger weapon firing recoil animation & flash
  public applyFireRecoil(recoilValue: number) {
    const kick = recoilValue * 0.007;
    this.pitch += kick * 1.2;
    this.recoilPitch = kick * 2.2;
    this.recoilYaw = (Math.random() - 0.5) * kick * 0.8;
    this.recoilOffset.z = 0.06;

    // Flash muzzle
    (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 1.0;
    setTimeout(() => {
      if (this.muzzleFlash) {
        (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0.0;
      }
    }, 40);
  }

  // Main tick update
  public update(delta: number) {
    // 1. Camera orientation with strict YXZ Euler order
    this.camera.rotation.set(
      this.pitch + this.recoilPitch,
      this.yaw + this.recoilYaw,
      0,
      'YXZ'
    );

    // Smoothly recover recoil
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, delta * 12);
    this.recoilYaw = THREE.MathUtils.lerp(this.recoilYaw, 0, delta * 12);
    this.recoilOffset.z = THREE.MathUtils.lerp(this.recoilOffset.z, 0, delta * 14);

    // 2. Crouch & Sprint states
    this.isCrouching = !!this.keys['ControlLeft'] || !!this.keys['KeyC'];
    this.isSprinting = !this.isCrouching && !this.isAiming && (!!this.keys['ShiftLeft'] || !!this.keys['ShiftRight']);

    const targetEyeOffset = this.isCrouching ? 1.05 : 1.7;

    // Calculate ground elevation underneath player feet (y=0 or top of crates/barriers)
    let groundElevation = 0;
    for (const col of this.colliders) {
      if (
        this.position.x >= col.min.x - 0.35 &&
        this.position.x <= col.max.x + 0.35 &&
        this.position.z >= col.min.z - 0.35 &&
        this.position.z <= col.max.z + 0.35
      ) {
        // If player's feet are above or level with top of obstacle
        if (col.max.y <= this.position.y - targetEyeOffset + 0.5) {
          groundElevation = Math.max(groundElevation, col.max.y);
        }
      }
    }

    const groundY = groundElevation + targetEyeOffset;

    // Jumping & Gravity vertical physics
    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      // If stepped off a crate/barrier into air
      if (this.position.y > groundY + 0.25) {
        this.isGrounded = false;
        this.verticalVelocity = 0;
      } else {
        this.position.y = THREE.MathUtils.lerp(this.position.y, groundY, delta * 14);
      }
    }

    // 3. Movement direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveVector = new THREE.Vector3();
    if (this.keys['KeyW']) moveVector.add(forward);
    if (this.keys['KeyS']) moveVector.sub(forward);
    if (this.keys['KeyD']) moveVector.add(right);
    if (this.keys['KeyA']) moveVector.sub(right);

    if (moveVector.lengthSq() > 0.01) {
      moveVector.normalize();
    }

    // Speed calculation
    let speed = 4.8; // base walk
    if (this.isCrouching) speed = 2.4;
    else if (this.isAiming) speed = 3.0;
    else if (this.isSprinting) speed = 8.0;

    // Apply movement with obstacle collision
    const moveStep = moveVector.clone().multiplyScalar(speed * delta);
    const nextPos = this.position.clone().add(moveStep);

    // Collision check against map colliders
    if (!this.checkPlayerCollision(nextPos)) {
      this.position.copy(nextPos);
    } else {
      // Slide against walls along X or Z
      const slideX = this.position.clone().add(new THREE.Vector3(moveStep.x, 0, 0));
      const slideZ = this.position.clone().add(new THREE.Vector3(0, 0, moveStep.z));
      if (!this.checkPlayerCollision(slideX)) {
        this.position.copy(slideX);
      } else if (!this.checkPlayerCollision(slideZ)) {
        this.position.copy(slideZ);
      }
    }

    // Footstep audio cadence
    if (moveVector.lengthSq() > 0.01 && this.isGrounded) {
      const stepInterval = this.isSprinting ? 0.32 : this.isCrouching ? 0.65 : 0.45;
      this.footstepTimer += delta;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        soundEngine.playFootstep(this.isSprinting);
      }
    } else {
      this.footstepTimer = 0.2;
    }

    // Sync camera world position
    this.camera.position.copy(this.position);

    // 4. Weapon Viewmodel Animation: Sway & Bobbing
    const isMoving = moveVector.lengthSq() > 0.01;
    if (isMoving) {
      const bobFreq = this.isSprinting ? 12 : 7;
      this.bobTime += delta * bobFreq;
    } else {
      this.bobTime += delta * 1.5; // Idle breathing
    }

    const bobX = Math.sin(this.bobTime) * (isMoving ? 0.012 : 0.003);
    const bobY = Math.abs(Math.cos(this.bobTime)) * (isMoving ? 0.016 : 0.004);

    // Aim Down Sights (ADS) placement
    const targetWeaponPos = this.isAiming
      ? new THREE.Vector3(-0.03, -0.08, -0.32) // Centered for aim down sight
      : new THREE.Vector3(bobX, -bobY, -this.recoilOffset.z);

    this.weaponRig.position.lerp(targetWeaponPos, delta * (this.isAiming ? 16 : 10));

    // Smoothly adjust FOV on ADS
    const targetFov = this.isAiming
      ? (this.currentWeapon?.zoomFov || 52)
      : (this.isSprinting ? this.baseFov + 4 : this.baseFov);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 12);
    this.camera.updateProjectionMatrix();
  }

  private checkPlayerCollision(pos: THREE.Vector3): boolean {
    const playerFeet = pos.y - (this.isCrouching ? 1.05 : 1.7);
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(pos.x, playerFeet + 0.85, pos.z),
      new THREE.Vector3(0.65, 1.7, 0.65)
    );
    for (const col of this.colliders) {
      // If player feet are above collider top, player can step/jump onto it
      if (playerFeet >= col.max.y - 0.08) continue;
      if (col.intersectsBox(playerBox)) {
        return true;
      }
    }
    return false;
  }
}
