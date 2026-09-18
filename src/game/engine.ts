import * as THREE from 'three';
import {
  GameMode,
  Difficulty,
  GraphicsQuality,
  GameSettings,
  ZoneConfig,
  WeaponData,
  Team,
  MatchStats,
  KillEvent,
  CapturePoint
} from '../types';
import { WEAPON_REGISTRY, DEFAULT_PRIMARY_WEAPON, DEFAULT_SECONDARY_WEAPON, DEFAULT_KNIFE } from './weapons';
import { buildZoneEnvironment, EnvironmentResult } from './environment';
import { createHumanSoldierMesh } from './botCharacter';
import { AiSystem, BotEntity } from './aiSystem';
import { PlayerController } from './playerController';
import { soundEngine } from '../audio/soundSystem';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: {
    health: number;
    armor: number;
    ammo: number;
    reserveAmmo: number;
    currentWeapon: WeaponData;
    blueScore: number;
    redScore: number;
    matchTime: number;
    capturingZone: string | null;
    capturedNotice: string | null;
    crosshairSpread: number;
    playerPos: [number, number, number];
    playerRot: number;
    teammates: { id: string; x: number; z: number }[];
    enemies: { id: string; x: number; z: number; visible: boolean }[];
    capturePoints: CapturePoint[];
    objectiveText: string;
  }) => void;
  onHitConfirm: (isHeadshot: boolean) => void;
  onKillEvent: (kill: KillEvent) => void;
  onMatchEnd: (stats: MatchStats) => void;
  onOpenBuyMenu?: () => void;
  onRewardMoney?: (amount: number, reason: string) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private player!: PlayerController;
  private aiSystem!: AiSystem;
  private env!: EnvironmentResult;

  // Options
  private zone: ZoneConfig;
  private mode: GameMode;
  private difficulty: Difficulty;
  private graphicsQuality: GraphicsQuality;
  private callbacks: GameEngineCallbacks;

  // Match State
  public isRunning = false;
  public isPaused = false;
  private clock = new THREE.Clock();

  // Player Stats
  private playerHealth = 100;
  private playerArmor = 100;
  private playerIsAlive = true;
  private primaryWeapon: WeaponData;
  private secondaryWeapon: WeaponData;
  private knifeWeapon: WeaponData;
  private currentWeapon: WeaponData;
  private currentSlot: 1 | 2 | 3 = 1;
  private ammoMap: Record<string, { inMag: number; reserve: number }> = {};
  private isMouseDown = false;
  private isRPressed = false;
  private nextFireTime = 0;
  private reloadEndTime = 0;

  // Scoring & Stats
  private blueScore = 0;
  private redScore = 0;
  private matchTime = 0;
  private targetScore = 25;
  private shotsFired = 0;
  private shotsHit = 0;
  private kills = 0;
  private deaths = 0;
  private headshots = 0;

  // Zone Control State
  private capturingZoneNotice: string | null = null;
  private capturedNotice: string | null = null;
  private capturedNoticeTimer = 0;

  // Visual FX (Tracers, Shells, Lights)
  private tracers: { line: THREE.Line; age: number; maxAge: number }[] = [];
  private shells: { mesh: THREE.Mesh; vel: THREE.Vector3; rotVel: THREE.Vector3; age: number }[] = [];
  private animationFrameId: number | null = null;

  constructor(
    container: HTMLElement,
    zone: ZoneConfig,
    mode: GameMode,
    difficulty: Difficulty,
    graphicsQuality: GraphicsQuality,
    primaryWeaponId: string,
    callbacks: GameEngineCallbacks,
    mouseSensitivity = 0.0022,
    invertY = false
  ) {
    this.container = container;
    this.zone = zone;
    this.mode = mode;
    this.difficulty = difficulty;
    this.graphicsQuality = graphicsQuality;
    this.callbacks = callbacks;

    // Weapons Loadout
    this.primaryWeapon = WEAPON_REGISTRY[primaryWeaponId] || WEAPON_REGISTRY[DEFAULT_PRIMARY_WEAPON];
    this.secondaryWeapon = WEAPON_REGISTRY[DEFAULT_SECONDARY_WEAPON];
    this.knifeWeapon = WEAPON_REGISTRY[DEFAULT_KNIFE];
    this.currentWeapon = this.primaryWeapon;

    // Ammo state initialization
    [this.primaryWeapon, this.secondaryWeapon, this.knifeWeapon].forEach((w) => {
      this.ammoMap[w.id] = { inMag: w.magazineSize, reserve: w.reserveAmmo };
    });

    this.initScene(mouseSensitivity, invertY);
    this.initMatch();
  }

  private initScene(mouseSensitivity: number, invertY: boolean) {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.zone.skyColor);
    this.scene.fog = new THREE.FogExp2(this.zone.fogColor, this.zone.fogDensity);

    // 2. Camera
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 400);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.graphicsQuality !== 'low',
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.graphicsQuality === 'ultra' ? Math.min(window.devicePixelRatio, 2) : 1
    );
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Shadows
    if (this.graphicsQuality !== 'low') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type =
        this.graphicsQuality === 'ultra'
          ? THREE.PCFSoftShadowMap
          : THREE.PCFShadowMap;
    }
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight(
      this.zone.skyColor,
      this.zone.ambientColor,
      0.85
    );
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(this.zone.sunColor, this.zone.sunIntensity);
    dirLight.position.set(40, 60, -30);
    if (this.graphicsQuality !== 'low') {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = this.graphicsQuality === 'ultra' ? 2048 : 1024;
      dirLight.shadow.mapSize.height = this.graphicsQuality === 'ultra' ? 2048 : 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 160;
      const d = 50;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    this.scene.add(dirLight);

    // 5. Environment & Obstacles
    this.env = buildZoneEnvironment(this.zone);
    this.scene.add(this.env.scene);

    // 6. Player Controller
    this.player = new PlayerController({
      camera: this.camera,
      domElement: this.renderer.domElement,
      colliders: this.env.colliders,
      initialPosition: this.env.playerSpawn,
      initialYaw: this.env.playerSpawnYaw,
      mouseSensitivity,
      invertY
    });
    this.player.setWeapon(this.currentWeapon);
    this.scene.add(this.camera);

    // 7. AI System
    this.aiSystem = new AiSystem({
      difficulty: this.difficulty,
      colliders: this.env.colliders,
      waypoints: this.env.waypoints,
      coverPoints: this.env.coverPoints
    });

    this.bindControls();
    soundEngine.startAmbientWind();
  }

  private bindControls() {
    window.addEventListener('resize', this.onResize);

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.player.isPointerLocked) {
        this.isMouseDown = true;
        this.handleWeaponTrigger();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    window.addEventListener('keydown', (e) => {
      // Allow opening Buy Menu anytime with B key
      if (e.code === 'KeyB') {
        this.callbacks.onOpenBuyMenu?.();
      }

      if (!this.player.isPointerLocked) return;

      if (e.code === 'KeyR') {
        // User requested: "R ni bossa otsin" - Fire weapon when R is pressed!
        this.isRPressed = true;
        this.handleWeaponTrigger();
      } else if (e.code === 'KeyE' || e.code === 'KeyT') {
        // Reload weapon on E or T
        this.reload();
      } else if (e.code === 'Digit1') {
        this.switchSlot(1);
      } else if (e.code === 'Digit2') {
        this.switchSlot(2);
      } else if (e.code === 'Digit3') {
        this.switchSlot(3);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyR') {
        this.isRPressed = false;
      }
    });
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initMatch() {
    this.aiSystem.clear();

    const botCount = this.zone.defaultBotCount;
    const blueCount = Math.floor(botCount / 2);
    const redCount = botCount - blueCount;

    // Spawn Blue Teammates
    for (let i = 0; i < blueCount; i++) {
      const spawn = this.env.blueSpawns[i % this.env.blueSpawns.length].clone();
      const meshContainer = createHumanSoldierMesh(i * 2, 'blue');
      meshContainer.root.position.copy(spawn);
      this.scene.add(meshContainer.root);

      const bot: BotEntity = {
        id: `blue_${i}`,
        name: `Soyuznik [B-${i + 1}]`,
        team: 'blue',
        health: 100,
        maxHealth: 100,
        armor: 50,
        isAlive: true,
        meshContainer,
        position: spawn,
        velocity: new THREE.Vector3(),
        targetPosition: null,
        currentWaypointIndex: i * 2,
        state: 'patrol',
        stateTimer: 0,
        shootCooldown: 0,
        reloadTimer: 0,
        burstCount: 0,
        ammo: 30,
        maxAmmo: 30,
        reactionTimer: 0,
        targetEntityId: null,
        walkCycle: Math.random() * Math.PI
      };
      this.aiSystem.addBot(bot);
    }

    // Spawn Red Enemies
    for (let i = 0; i < redCount; i++) {
      const spawn = this.env.redSpawns[i % this.env.redSpawns.length].clone();
      const meshContainer = createHumanSoldierMesh(i * 2 + 1, 'red');
      meshContainer.root.position.copy(spawn);
      this.scene.add(meshContainer.root);

      const bot: BotEntity = {
        id: `red_${i}`,
        name: `Dushman [R-${i + 1}]`,
        team: 'red',
        health: 100,
        maxHealth: 100,
        armor: 50,
        isAlive: true,
        meshContainer,
        position: spawn,
        velocity: new THREE.Vector3(),
        targetPosition: null,
        currentWaypointIndex: (i * 3) % this.env.waypoints.length,
        state: 'patrol',
        stateTimer: 0,
        shootCooldown: 0,
        reloadTimer: 0,
        burstCount: 0,
        ammo: 30,
        maxAmmo: 30,
        reactionTimer: 0,
        targetEntityId: null,
        walkCycle: Math.random() * Math.PI
      };
      this.aiSystem.addBot(bot);
    }

    this.isRunning = true;
    this.clock.start();
    this.startLoop();
  }

  public switchSlot(slot: 1 | 2 | 3) {
    if (this.currentSlot === slot || this.isPaused || !this.playerIsAlive) return;
    this.currentSlot = slot;
    if (slot === 1) this.currentWeapon = this.primaryWeapon;
    else if (slot === 2) this.currentWeapon = this.secondaryWeapon;
    else this.currentWeapon = this.knifeWeapon;

    this.player.setWeapon(this.currentWeapon);
    soundEngine.playUiClick();
  }

  // Equip newly purchased weapon from Buy Menu
  public equipPurchasedWeapon(weaponId: string) {
    const weapon = WEAPON_REGISTRY[weaponId];
    if (!weapon || this.isPaused || !this.playerIsAlive) return;

    if (weapon.slot === 1) {
      this.primaryWeapon = weapon;
      this.currentSlot = 1;
      this.currentWeapon = weapon;
    } else if (weapon.slot === 2) {
      this.secondaryWeapon = weapon;
      this.currentSlot = 2;
      this.currentWeapon = weapon;
    } else {
      this.knifeWeapon = weapon;
      this.currentSlot = 3;
      this.currentWeapon = weapon;
    }

    // Initialize full ammunition for the newly bought weapon
    this.ammoMap[weapon.id] = {
      inMag: weapon.magazineSize,
      reserve: weapon.reserveAmmo
    };

    this.player.setWeapon(this.currentWeapon);
    soundEngine.playBuy();
  }

  public refillArmor(amount = 100) {
    this.playerArmor = Math.min(100, this.playerArmor + amount);
    soundEngine.playBuy();
  }

  public refillHealth(amount = 100) {
    this.playerHealth = Math.min(100, this.playerHealth + amount);
    soundEngine.playBuy();
  }

  public refillAllAmmo() {
    for (const id in this.ammoMap) {
      const w = WEAPON_REGISTRY[id];
      if (w) {
        this.ammoMap[id] = { inMag: w.magazineSize, reserve: w.reserveAmmo };
      }
    }
    soundEngine.playBuy();
  }

  public reload() {
    if (this.currentWeapon.category === 'knife' || this.isPaused || !this.playerIsAlive) return;
    const ammo = this.ammoMap[this.currentWeapon.id];
    if (ammo.inMag >= this.currentWeapon.magazineSize || ammo.reserve <= 0) return;

    const now = performance.now() / 1000;
    this.reloadEndTime = now + this.currentWeapon.reloadTime;
    soundEngine.playReload(this.currentWeapon.reloadTime);
  }

  private handleWeaponTrigger() {
    if (this.isPaused || !this.playerIsAlive) return;
    const now = performance.now() / 1000;

    // Check if reloading
    if (now < this.reloadEndTime) return;

    // Fire rate cooldown
    if (now < this.nextFireTime) return;

    const ammo = this.ammoMap[this.currentWeapon.id];
    if (this.currentWeapon.category !== 'knife' && ammo.inMag <= 0) {
      if (ammo.reserve > 0) {
        // Auto reload if magazine empty
        this.reload();
      } else {
        soundEngine.playEmptyClick();
        this.nextFireTime = now + 0.3;
      }
      return;
    }

    // Spend Ammo
    if (this.currentWeapon.category !== 'knife') {
      ammo.inMag--;
    }
    this.nextFireTime = now + 60 / this.currentWeapon.fireRate;
    this.shotsFired++;

    // Audio & Recoil
    if (this.currentWeapon.category === 'knife') {
      soundEngine.playKnifeSwing();
    } else {
      soundEngine.playGunshot(this.currentWeapon.category, true, 0);
    }
    this.player.applyFireRecoil(this.currentWeapon.recoil);

    // Eject Brass Shell Casing
    this.spawnShellCasing();

    // Raycast Shooting Physics & Hit Detection
    this.performShootingRaycast();
  }

  private spawnShellCasing() {
    if (this.currentWeapon.category === 'knife') return;
    const shellGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.035, 6);
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
    const shell = new THREE.Mesh(shellGeo, shellMat);

    // Position near weapon ejection port
    const spawnPos = this.player.position.clone().add(
      new THREE.Vector3(0.2, -0.15, -0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw)
    );
    shell.position.copy(spawnPos);
    this.scene.add(shell);

    const rightDir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    const vel = rightDir.multiplyScalar(2.5 + Math.random() * 1.5).add(new THREE.Vector3(0, 2.0 + Math.random(), 0));

    this.shells.push({
      mesh: shell,
      vel,
      rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      age: 0
    });
  }

  private performShootingRaycast() {
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0); // Crosshair center
    raycaster.setFromCamera(center, this.camera);

    // Calculate spread based on crouch / aim / sprint
    let spreadAngle = (100 - this.currentWeapon.accuracy) * 0.0003;
    if (this.player.isCrouching) spreadAngle *= 0.6;
    if (this.player.isAiming) spreadAngle *= 0.4;
    if (this.player.isSprinting) spreadAngle *= 2.2;

    const dir = raycaster.ray.direction.clone();
    dir.x += (Math.random() - 0.5) * spreadAngle;
    dir.y += (Math.random() - 0.5) * spreadAngle;
    dir.normalize();
    raycaster.ray.direction.copy(dir);

    // Collect all bot hitboxes for Raycast
    const hitBoxObjects: THREE.Object3D[] = [];
    const hitBoxToBotMap = new Map<THREE.Object3D, { bot: BotEntity; part: 'head' | 'chest' | 'legs' }>();

    for (const b of this.aiSystem.bots) {
      if (!b.isAlive) continue;
      hitBoxObjects.push(b.meshContainer.hitBoxes.head);
      hitBoxObjects.push(b.meshContainer.hitBoxes.chest);
      hitBoxObjects.push(b.meshContainer.hitBoxes.legs);
      hitBoxToBotMap.set(b.meshContainer.hitBoxes.head, { bot: b, part: 'head' });
      hitBoxToBotMap.set(b.meshContainer.hitBoxes.chest, { bot: b, part: 'chest' });
      hitBoxToBotMap.set(b.meshContainer.hitBoxes.legs, { bot: b, part: 'legs' });
    }

    const intersects = raycaster.intersectObjects(hitBoxObjects, true);

    let hitPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(this.currentWeapon.range));

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitPoint = hit.point;

      const botHitInfo = hitBoxToBotMap.get(hit.object);
      if (botHitInfo && botHitInfo.bot.isAlive) {
        const targetBot = botHitInfo.bot;
        const isHeadshot = botHitInfo.part === 'head';

        // Damage multiplier
        let mult = 1.0;
        if (isHeadshot) mult = 2.5;
        else if (botHitInfo.part === 'legs') mult = 0.7;

        let totalDmg = Math.round(this.currentWeapon.damage * mult);

        // AWM GUARANTEED ONE-SHOT KILL! ("awm bittada oldirsin")
        if (this.currentWeapon.id === 'AWM' || this.currentWeapon.oneShotKill) {
          totalDmg = 9999;
          targetBot.armor = 0;
          targetBot.health = 0;
        } else if (targetBot.armor > 0) {
          const absorbed = Math.min(targetBot.armor, Math.round(totalDmg * 0.5));
          targetBot.armor -= absorbed;
          totalDmg -= absorbed;
          targetBot.health -= totalDmg;
        } else {
          targetBot.health -= totalDmg;
        }

        this.shotsHit++;
        soundEngine.playHitConfirm(isHeadshot);
        this.callbacks.onHitConfirm(isHeadshot);

        // Check if Bot Died
        if (targetBot.health <= 0) {
          targetBot.health = 0;
          targetBot.isAlive = false;
          targetBot.deathTime = 0;

          if (targetBot.team === 'red') {
            this.kills++;
            this.blueScore++;
            if (isHeadshot) this.headshots++;

            // Cash reward for elimination ($1000 for headshot, $750 for AWM, $600 for standard)
            const rewardCash = isHeadshot ? 1000 : (this.currentWeapon.id === 'AWM' ? 750 : 600);
            this.callbacks.onRewardMoney?.(rewardCash, isHeadshot ? 'Headshot' : 'Kill');

            this.callbacks.onKillEvent({
              id: `${Date.now()}_${Math.random()}`,
              killer: 'Player [BLUE]',
              killerTeam: 'blue',
              victim: targetBot.name,
              victimTeam: 'red',
              weapon: this.currentWeapon.name,
              headshot: isHeadshot,
              timestamp: Date.now()
            });

            this.checkVictoryCondition();
          }
        }
      }
    }

    // Add Bullet Tracer Visual
    this.spawnBulletTracer(this.camera.position.clone().add(new THREE.Vector3(0.15, -0.15, -0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw)), hitPoint);
  }

  private spawnBulletTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const points = [start, end];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, age: 0, maxAge: 0.08 });
  }

  private handleBotFire = (bot: BotEntity, targetPos: THREE.Vector3) => {
    // Spawn enemy tracer
    const muzzlePos = bot.position.clone().setY(1.4);
    this.spawnBulletTracer(muzzlePos, targetPos);

    // If red bot fired at player, test hit
    if (bot.team === 'red' && this.playerIsAlive) {
      const dist = bot.position.distanceTo(this.player.position);
      if (dist < 45 && targetPos.distanceTo(this.player.position) < 1.4) {
        // Player was hit by bot
        let dmg = 18;
        if (this.difficulty === 'hard') dmg = 24;
        if (this.difficulty === 'extreme') dmg = 32;

        if (this.playerArmor > 0) {
          const absorbed = Math.min(this.playerArmor, Math.round(dmg * 0.6));
          this.playerArmor -= absorbed;
          dmg -= absorbed;
        }
        this.playerHealth = Math.max(0, this.playerHealth - dmg);
        soundEngine.playDamageTaken();

        // Screen flinch
        this.player.pitch += (Math.random() - 0.5) * 0.04;

        if (this.playerHealth <= 0) {
          this.playerIsAlive = false;
          this.deaths++;
          this.redScore++;

          this.callbacks.onKillEvent({
            id: `${Date.now()}_${Math.random()}`,
            killer: bot.name,
            killerTeam: 'red',
            victim: 'Player [BLUE]',
            victimTeam: 'blue',
            weapon: 'AR-01',
            headshot: false,
            timestamp: Date.now()
          });

          this.checkVictoryCondition();
        }
      }
    }
  };

  private checkVictoryCondition() {
    if (!this.isRunning) return;

    if (!this.playerIsAlive) {
      // Player died
      this.finishMatch(false);
      return;
    }

    if (this.mode === 'tdm' && (this.blueScore >= this.targetScore || this.redScore >= this.targetScore)) {
      this.finishMatch(this.blueScore >= this.redScore);
    } else if (this.mode === 'elimination') {
      const liveEnemies = this.aiSystem.bots.filter((b) => b.team === 'red' && b.isAlive).length;
      if (liveEnemies === 0) {
        this.finishMatch(true);
      }
    }
  }

  private finishMatch(victory: boolean) {
    this.isRunning = false;
    soundEngine.stopAmbient();
    this.player.unlockPointer();

    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const stats: MatchStats = {
      kills: this.kills,
      deaths: this.deaths,
      score: this.kills * 150 + this.headshots * 75 + (victory ? 500 : 0),
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      headshots: this.headshots,
      accuracy,
      timeSeconds: Math.round(this.matchTime),
      victory,
      zoneId: this.zone.id,
      mode: this.mode
    };

    this.callbacks.onMatchEnd(stats);
  }

  public pause() {
    this.isPaused = true;
    this.player.unlockPointer();
  }

  public resume() {
    this.isPaused = false;
    this.player.lockPointer();
  }

  public updateSettings(settings: Partial<GameSettings>) {
    if (settings.mouseSensitivity !== undefined) {
      this.player.setMouseSensitivity(settings.mouseSensitivity);
    }
    if (settings.invertY !== undefined) {
      this.player.setInvertY(settings.invertY);
    }
  }

  private startLoop() {
    const loop = () => {
      if (!this.isRunning) return;
      this.animationFrameId = requestAnimationFrame(loop);

      const delta = Math.min(this.clock.getDelta(), 0.1);

      if (!this.isPaused) {
        this.matchTime += delta;

        // Auto-firing for rifles/SMG if mouse held OR R key held
        if ((this.isMouseDown || this.isRPressed) && this.currentWeapon.automatic) {
          this.handleWeaponTrigger();
        }

        // 1. Update Player
        this.player.update(delta);

        // 2. Update AI Bots
        this.aiSystem.update(delta, this.player.position, this.playerIsAlive, this.handleBotFire);

        // 3. Update Zone Capture Points (for Zone Control mode)
        if (this.mode === 'zone_control') {
          this.updateZoneControl(delta);
        }

        // 4. Update Tracers & Shells
        this.updateVisualEffects(delta);

        // 5. Notify HUD
        this.sendHudUpdate();
      }

      // Render
      this.renderer.render(this.scene, this.camera);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateZoneControl(delta: number) {
    this.capturingZoneNotice = null;

    for (const cp of this.env.capturePoints) {
      const distToPlayer = new THREE.Vector2(this.player.position.x, this.player.position.z).distanceTo(
        new THREE.Vector2(cp.position[0], cp.position[2])
      );

      const playerInside = distToPlayer <= cp.radius && this.playerIsAlive;

      // Count teammates and enemies in zone
      let blueInZone = playerInside ? 1 : 0;
      let redInZone = 0;

      for (const bot of this.aiSystem.bots) {
        if (!bot.isAlive) continue;
        const d = new THREE.Vector2(bot.position.x, bot.position.z).distanceTo(
          new THREE.Vector2(cp.position[0], cp.position[2])
        );
        if (d <= cp.radius) {
          if (bot.team === 'blue') blueInZone++;
          else redInZone++;
        }
      }

      if (blueInZone > redInZone) {
        // BLUE capturing
        cp.progress = Math.min(100, cp.progress + delta * 30);
        if (playerInside) {
          this.capturingZoneNotice = `${cp.name} EGALLANMOQDA...`;
        }
        if (cp.progress >= 100 && cp.owner !== 'blue') {
          cp.owner = 'blue';
          this.blueScore += 5;
          soundEngine.playCapturePulse();
          this.capturedNotice = `${cp.name} EGALLANDI!`;
          this.capturedNoticeTimer = 3.0;
          this.callbacks.onRewardMoney?.(1200, 'Zone Captured');
        }
      } else if (redInZone > blueInZone) {
        // RED capturing
        cp.progress = Math.max(-100, cp.progress - delta * 30);
        if (cp.progress <= -100 && cp.owner !== 'red') {
          cp.owner = 'red';
          this.redScore += 5;
          this.capturedNotice = `DUSHMAN ${cp.name}NI EGALLADI!`;
          this.capturedNoticeTimer = 3.0;
        }
      }
    }

    if (this.capturedNoticeTimer > 0) {
      this.capturedNoticeTimer -= delta;
      if (this.capturedNoticeTimer <= 0) {
        this.capturedNotice = null;
      }
    }
  }

  private updateVisualEffects(delta: number) {
    // Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.age += delta;
      if (t.age >= t.maxAge) {
        this.scene.remove(t.line);
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      }
    }

    // Shells
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.age += delta;
      s.vel.y -= 9.8 * delta; // Gravity
      s.mesh.position.addScaledVector(s.vel, delta);
      s.mesh.rotation.x += s.rotVel.x * delta;
      s.mesh.rotation.y += s.rotVel.y * delta;

      if (s.mesh.position.y <= 0.05) {
        s.mesh.position.y = 0.05;
        s.vel.set(0, 0, 0);
      }

      if (s.age > 2.5) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.shells.splice(i, 1);
      }
    }
  }

  private sendHudUpdate() {
    const ammo = this.ammoMap[this.currentWeapon.id] || { inMag: 0, reserve: 0 };

    const teammates = this.aiSystem.bots
      .filter((b) => b.team === 'blue' && b.isAlive)
      .map((b) => ({ id: b.id, x: b.position.x, z: b.position.z }));

    const enemies = this.aiSystem.bots
      .filter((b) => b.team === 'red' && b.isAlive)
      .map((b) => ({
        id: b.id,
        x: b.position.x,
        z: b.position.z,
        visible: b.position.distanceTo(this.player.position) < 35
      }));

    this.callbacks.onStatsUpdate({
      health: this.playerHealth,
      armor: this.playerArmor,
      ammo: ammo.inMag,
      reserveAmmo: ammo.reserve,
      currentWeapon: this.currentWeapon,
      blueScore: this.blueScore,
      redScore: this.redScore,
      matchTime: Math.round(this.matchTime),
      capturingZone: this.capturingZoneNotice,
      capturedNotice: this.capturedNotice,
      crosshairSpread: this.player.isAiming ? 1.0 : this.player.isSprinting ? 2.5 : 1.5,
      playerPos: [this.player.position.x, this.player.position.y, this.player.position.z],
      playerRot: this.player.yaw,
      teammates,
      enemies,
      capturePoints: this.env.capturePoints,
      objectiveText: this.zone.objectiveUz
    });
  }

  public destroy() {
    this.isRunning = false;
    soundEngine.stopAmbient();
    this.player.unlockPointer();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
