export type Language = 'uz' | 'en' | 'ru';

export type GameMode = 'tdm' | 'zone_control' | 'elimination' | 'training' | 'survival';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export type Team = 'blue' | 'red';

export type WeaponCategory = 'rifle' | 'smg' | 'shotgun' | 'sniper' | 'pistol' | 'knife';

export interface WeaponData {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number; // rounds per minute
  magazineSize: number;
  reserveAmmo: number;
  reloadTime: number; // seconds
  recoil: number; // 1-10
  accuracy: number; // 0-100%
  range: number; // meters
  slot: 1 | 2 | 3; // 1=primary, 2=secondary, 3=melee
  descriptionUz: string;
  descriptionEn: string;
  descriptionRu: string;
  automatic: boolean;
  pellets?: number;
  zoomFov?: number;
  price?: number;
  oneShotKill?: boolean;
}

export interface ZoneConfig {
  id: string;
  nameKey: string;
  nameUz: string;
  nameEn: string;
  nameRu: string;
  descUz: string;
  descEn: string;
  descRu: string;
  difficulty: Difficulty;
  environmentType: 'desert' | 'urban' | 'industrial' | 'mountain' | 'port' | 'night';
  defaultBotCount: number;
  recommendedPlayers: string;
  objectiveUz: string;
  objectiveEn: string;
  objectiveRu: string;
  skyColor: number;
  groundColor: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  sunIntensity: number;
  sunColor: number;
  nightMode?: boolean;
}

export type ScreenState = 'menu' | 'loading' | 'game' | 'gameover';

export interface GameSettings {
  language: Language;
  graphics: GraphicsQuality;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  mouseSensitivity: number;
  invertY?: boolean;
  crosshairSize: number;
  crosshairThickness: number;
  crosshairOpacity: number;
  crosshairColor: string;
  fov?: number;
}

export interface MatchStats {
  kills: number;
  deaths: number;
  score: number;
  shotsFired: number;
  shotsHit: number;
  headshots: number;
  accuracy: number;
  timeSeconds: number;
  victory: boolean;
  zoneId: string;
  mode: GameMode;
}

export interface CapturePoint {
  id: 'A' | 'B' | 'C';
  name: string;
  position: [number, number, number];
  radius: number;
  owner: Team | 'neutral';
  progress: number; // -100 (Full RED) to +100 (Full BLUE)
}

export interface KillEvent {
  id: string;
  killer: string;
  killerTeam: Team;
  victim: string;
  victimTeam: Team;
  weapon: string;
  headshot: boolean;
  timestamp: number;
}
