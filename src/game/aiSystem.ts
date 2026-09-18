import * as THREE from 'three';
import { Difficulty, Team } from '../types';
import { HumanBotMeshContainer } from './botCharacter';
import { soundEngine } from '../audio/soundSystem';

export type BotState = 'patrol' | 'chase' | 'attack' | 'cover' | 'reload';

export interface BotEntity {
  id: string;
  name: string;
  team: Team;
  health: number;
  maxHealth: number;
  armor: number;
  isAlive: boolean;
  meshContainer: HumanBotMeshContainer;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  currentWaypointIndex: number;
  state: BotState;
  stateTimer: number;
  shootCooldown: number;
  reloadTimer: number;
  burstCount: number;
  ammo: number;
  maxAmmo: number;
  reactionTimer: number;
  targetEntityId: string | null;
  walkCycle: number;
  deathTime?: number;
}

export interface AiControllerOptions {
  difficulty: Difficulty;
  colliders: THREE.Box3[];
  waypoints: THREE.Vector3[];
  coverPoints: THREE.Vector3[];
}

export class AiSystem {
  public bots: BotEntity[] = [];
  private options: AiControllerOptions;

  constructor(options: AiControllerOptions) {
    this.options = options;
  }

  public addBot(bot: BotEntity) {
    this.bots.push(bot);
  }

  public clear() {
    this.bots = [];
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerIsAlive: boolean,
    onBotFire: (bot: BotEntity, targetPos: THREE.Vector3) => void
  ) {
    const diff = this.options.difficulty;
    const reactionDelay = diff === 'easy' ? 0.75 : diff === 'normal' ? 0.45 : diff === 'hard' ? 0.25 : 0.15;
    const accuracy = diff === 'easy' ? 0.45 : diff === 'normal' ? 0.65 : diff === 'hard' ? 0.82 : 0.92;
    const fireInterval = diff === 'easy' ? 0.28 : diff === 'normal' ? 0.2 : diff === 'hard' ? 0.15 : 0.12;

    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];

      // Handle dead bots
      if (!bot.isAlive) {
        if (bot.deathTime !== undefined) {
          bot.deathTime += delta;
          // Death collapse animation
          if (bot.deathTime < 1.0) {
            bot.meshContainer.root.rotation.x = Math.min(Math.PI / 2, bot.meshContainer.root.rotation.x + delta * 3);
            bot.meshContainer.root.position.y = Math.max(0.1, bot.meshContainer.root.position.y - delta * 1.5);
          }
        }
        continue;
      }

      bot.stateTimer += delta;
      bot.shootCooldown -= delta;
      if (bot.reloadTimer > 0) {
        bot.reloadTimer -= delta;
        if (bot.reloadTimer <= 0) {
          bot.ammo = bot.maxAmmo;
        }
      }

      // 1. Determine enemy target
      let targetPos: THREE.Vector3 | null = null;
      let distToTarget = Infinity;

      if (bot.team === 'red') {
        // Red bots target player if alive, or blue bots
        if (playerIsAlive) {
          distToTarget = bot.position.distanceTo(playerPos);
          if (distToTarget < 50) {
            targetPos = playerPos;
          }
        }
        // Also check if any blue bot is closer
        for (const ally of this.bots) {
          if (ally.team === 'blue' && ally.isAlive) {
            const d = bot.position.distanceTo(ally.position);
            if (d < distToTarget) {
              distToTarget = d;
              targetPos = ally.position;
            }
          }
        }
      } else {
        // Blue teammate bots target red bots or follow player
        for (const enemy of this.bots) {
          if (enemy.team === 'red' && enemy.isAlive) {
            const d = bot.position.distanceTo(enemy.position);
            if (d < distToTarget) {
              distToTarget = d;
              targetPos = enemy.position;
            }
          }
        }
      }

      // Check if target has line of sight
      let hasLOS = false;
      if (targetPos && distToTarget < 45) {
        hasLOS = this.checkLineOfSight(bot.position, targetPos);
      }

      // 2. State Machine Transitions
      if (bot.health < 35 && this.options.coverPoints.length > 0 && bot.state !== 'cover') {
        // Retreat to cover
        bot.state = 'cover';
        bot.targetPosition = this.findNearestCover(bot.position);
      } else if (hasLOS && targetPos) {
        if (bot.ammo <= 0 && bot.reloadTimer <= 0) {
          bot.state = 'reload';
          bot.reloadTimer = 2.2;
        } else if (bot.reloadTimer <= 0) {
          bot.state = 'attack';
        }
      } else if (targetPos && distToTarget < 30) {
        bot.state = 'chase';
        bot.targetPosition = targetPos.clone();
      } else {
        // Patrol or follow
        if (bot.team === 'blue' && playerIsAlive) {
          const dToPlayer = bot.position.distanceTo(playerPos);
          if (dToPlayer > 14) {
            bot.state = 'chase';
            bot.targetPosition = playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6));
          } else {
            bot.state = 'patrol';
          }
        } else {
          bot.state = 'patrol';
        }
      }

      // 3. State Actions
      let moveDir = new THREE.Vector3(0, 0, 0);
      let speed = 4.2;

      switch (bot.state) {
        case 'patrol':
          if (!bot.targetPosition || bot.position.distanceTo(bot.targetPosition) < 2.5) {
            bot.currentWaypointIndex = (bot.currentWaypointIndex + 1) % this.options.waypoints.length;
            bot.targetPosition = this.options.waypoints[bot.currentWaypointIndex].clone();
          }
          if (bot.targetPosition) {
            moveDir.subVectors(bot.targetPosition, bot.position).setY(0).normalize();
            speed = 3.0; // walking patrol
          }
          break;

        case 'chase':
          if (bot.targetPosition) {
            moveDir.subVectors(bot.targetPosition, bot.position).setY(0).normalize();
            speed = 5.2; // running
          }
          break;

        case 'cover':
          if (bot.targetPosition) {
            moveDir.subVectors(bot.targetPosition, bot.position).setY(0).normalize();
            speed = 5.6; // sprinting to cover
            if (bot.position.distanceTo(bot.targetPosition) < 1.5) {
              moveDir.set(0, 0, 0);
            }
          }
          break;

        case 'attack':
          if (targetPos) {
            // Face target directly
            const aimAngle = Math.atan2(targetPos.x - bot.position.x, targetPos.z - bot.position.z);
            bot.meshContainer.root.rotation.y = aimAngle;

            // Combat strafing
            if (Math.random() < 0.03) {
              moveDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            }
            speed = 2.4;

            // Fire burst
            if (bot.shootCooldown <= 0 && bot.ammo > 0) {
              bot.shootCooldown = fireInterval;
              bot.ammo--;

              // Accuracy deviation
              const spread = (1 - accuracy) * 1.5;
              const spreadTarget = targetPos.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
              ));

              onBotFire(bot, spreadTarget);

              // Flash muzzle
              const flashMat = bot.meshContainer.muzzleFlash.material as THREE.MeshBasicMaterial;
              flashMat.opacity = 1;
              setTimeout(() => {
                if (bot.meshContainer.muzzleFlash) {
                  (bot.meshContainer.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0;
                }
              }, 50);

              // Audio with spatial pan relative to player
              const relX = (bot.position.x - playerPos.x) / 30;
              soundEngine.playGunshot('rifle', false, relX);
            }
          }
          break;

        case 'reload':
          // Move away while reloading
          if (targetPos) {
            moveDir.subVectors(bot.position, targetPos).setY(0).normalize();
            speed = 3.8;
          }
          break;
      }

      // 4. Collision Avoidance & Motion Application
      if (moveDir.lengthSq() > 0.01) {
        // Look in movement direction if not actively aiming at enemy
        if (bot.state !== 'attack') {
          const moveAngle = Math.atan2(moveDir.x, moveDir.z);
          bot.meshContainer.root.rotation.y = THREE.MathUtils.lerp(
            bot.meshContainer.root.rotation.y,
            moveAngle,
            0.15
          );
        }

        const nextPos = bot.position.clone().addScaledVector(moveDir, speed * delta);
        if (!this.checkCollision(nextPos)) {
          bot.position.copy(nextPos);
        } else {
          // Slide along obstacle
          const slideX = bot.position.clone().add(new THREE.Vector3(moveDir.x * speed * delta, 0, 0));
          const slideZ = bot.position.clone().add(new THREE.Vector3(0, 0, moveDir.z * speed * delta));
          if (!this.checkCollision(slideX)) {
            bot.position.copy(slideX);
          } else if (!this.checkCollision(slideZ)) {
            bot.position.copy(slideZ);
          }
        }

        // 5. Procedural Human Walking / Running Animation
        bot.walkCycle += delta * speed * 2.8;
        const legSwing = Math.sin(bot.walkCycle) * 0.55;
        const armSwing = Math.cos(bot.walkCycle) * 0.35;

        bot.meshContainer.leftLeg.rotation.x = legSwing;
        bot.meshContainer.rightLeg.rotation.x = -legSwing;
        bot.meshContainer.torso.position.y = 1.05 + Math.abs(Math.sin(bot.walkCycle * 2)) * 0.04;

        if (bot.state !== 'attack') {
          bot.meshContainer.leftArm.rotation.x = -armSwing;
        }
      } else {
        // Idle breathing
        bot.walkCycle += delta * 1.5;
        bot.meshContainer.leftLeg.rotation.x = 0;
        bot.meshContainer.rightLeg.rotation.x = 0;
        bot.meshContainer.torso.position.y = 1.05 + Math.sin(bot.walkCycle) * 0.015;
      }

      // Sync 3D root mesh position
      bot.meshContainer.root.position.copy(bot.position);
    }
  }

  // Check if position collides with any environment collider
  private checkCollision(pos: THREE.Vector3): boolean {
    const botBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(pos.x, 1.0, pos.z),
      new THREE.Vector3(0.8, 1.8, 0.8)
    );
    for (const col of this.options.colliders) {
      if (col.intersectsBox(botBox)) {
        return true;
      }
    }
    return false;
  }

  // Line of sight raycast against colliders
  private checkLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const origin = from.clone().setY(1.6);
    const target = to.clone().setY(1.6);
    const ray = new THREE.Ray(origin, target.clone().sub(origin).normalize());
    const maxDist = origin.distanceTo(target);

    for (const box of this.options.colliders) {
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && origin.distanceTo(hit) < maxDist) {
        return false;
      }
    }
    return true;
  }

  // Find nearest cover point
  private findNearestCover(from: THREE.Vector3): THREE.Vector3 {
    let nearest = from;
    let minDist = Infinity;
    for (const cp of this.options.coverPoints) {
      const d = from.distanceTo(cp);
      if (d < minDist && d > 3.0) {
        minDist = d;
        nearest = cp;
      }
    }
    return nearest.clone();
  }
}
