import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScreenState,
  Language,
  Difficulty,
  GameMode,
  GraphicsQuality,
  GameSettings,
  ZoneConfig,
  WeaponData,
  MatchStats,
  KillEvent,
  CapturePoint
} from './types';
import { ZONES } from './game/zones';
import { WEAPON_REGISTRY, DEFAULT_PRIMARY_WEAPON } from './game/weapons';
import { GameEngine } from './game/engine';
import { MainMenu } from './components/MainMenu';
import { ZoneSelectModal } from './components/ZoneSelectModal';
import { LoadingScreen } from './components/LoadingScreen';
import { GameHUD } from './components/GameHUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { WeaponsModal } from './components/WeaponsModal';
import { StatsModal } from './components/StatsModal';
import { BuyMenuModal } from './components/BuyMenuModal';
import { soundEngine } from './audio/soundSystem';

const DEFAULT_SETTINGS: GameSettings = {
  graphics: 'high',
  masterVolume: 0.8,
  effectsVolume: 0.8,
  musicVolume: 0.5,
  mouseSensitivity: 0.0022,
  invertY: false,
  language: 'uz',
  crosshairSize: 8,
  crosshairThickness: 2,
  crosshairOpacity: 0.9,
  crosshairColor: '#38bdf8'
};

const STATS_STORAGE_KEY = 'tactical_strike_uz_stats';

export default function App() {
  // Screen and Modal State
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [showZoneSelect, setShowZoneSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWeapons, setShowWeapons] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBuyMenu, setShowBuyMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playerMoney, setPlayerMoney] = useState(3000);

  // Match Configuration
  const [selectedZone, setSelectedZone] = useState<ZoneConfig>(ZONES[0]);
  const [gameMode, setGameMode] = useState<GameMode>('tdm');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [selectedPrimaryWeapon, setSelectedPrimaryWeapon] = useState<string>(DEFAULT_PRIMARY_WEAPON);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('tactical_strike_uz_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  // Career Statistics
  const [careerStats, setCareerStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      matchesPlayed: 0,
      victories: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalHeadshots: 0,
      bestScore: 0
    };
  });

  // Active Match Results
  const [lastMatchStats, setLastMatchStats] = useState<MatchStats | null>(null);

  // Real-time In-Game HUD State
  const [hudStats, setHudStats] = useState<{
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
  }>({
    health: 100,
    armor: 100,
    ammo: 30,
    reserveAmmo: 120,
    currentWeapon: WEAPON_REGISTRY[DEFAULT_PRIMARY_WEAPON],
    blueScore: 0,
    redScore: 0,
    matchTime: 0,
    capturingZone: null,
    capturedNotice: null,
    crosshairSpread: 1.0,
    playerPos: [0, 1.7, 0],
    playerRot: 0,
    teammates: [],
    enemies: [],
    capturePoints: [],
    objectiveText: ''
  });

  const [hitConfirm, setHitConfirm] = useState(false);
  const [isHeadshotHit, setIsHeadshotHit] = useState(false);
  const [killEvents, setKillEvents] = useState<KillEvent[]>([]);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Game Engine Reference
  const gameEngineRef = useRef<GameEngine | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Sound Engine Volume sync
  useEffect(() => {
    soundEngine.setVolumes(settings.masterVolume, settings.effectsVolume, settings.musicVolume);
  }, [settings.masterVolume, settings.effectsVolume, settings.musicVolume]);

  // Pointer lock state listener
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === gameContainerRef.current?.querySelector('canvas');
      setIsPointerLocked(locked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Handle ESC and B keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen === 'game') {
        if (e.code === 'KeyB') {
          setShowBuyMenu((prev) => {
            if (!prev) {
              if (document.pointerLockElement) document.exitPointerLock();
              return true;
            } else {
              return false;
            }
          });
          return;
        }

        if (e.code === 'Escape') {
          if (showBuyMenu) {
            setShowBuyMenu(false);
            return;
          }
          if (!isPaused) {
            setIsPaused(true);
            gameEngineRef.current?.pause();
          } else {
            setIsPaused(false);
            gameEngineRef.current?.resume();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isPaused, showBuyMenu]);

  // Save Settings
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    gameEngineRef.current?.updateSettings(newSettings);
    try {
      localStorage.setItem('tactical_strike_uz_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  // Launch Game Workflow
  const handleStartGame = () => {
    setShowZoneSelect(false);
    setScreen('loading');
  };

  const handleLoadingComplete = () => {
    setScreen('game');
  };

  // Instantiate GameEngine once entering 'game' screen
  useEffect(() => {
    if (screen !== 'game' || !gameContainerRef.current) return;

    // Reset HUD state
    setKillEvents([]);
    setIsPaused(false);

    const engine = new GameEngine(
      gameContainerRef.current,
      selectedZone,
      gameMode,
      difficulty,
      settings.graphics,
      selectedPrimaryWeapon,
      {
        onStatsUpdate: (stats) => {
          setHudStats(stats);
        },
        onHitConfirm: (isHeadshot) => {
          setHitConfirm(true);
          setIsHeadshotHit(isHeadshot);
          setTimeout(() => setHitConfirm(false), 180);
        },
        onKillEvent: (kill) => {
          setKillEvents((prev) => [...prev, kill]);
        },
        onOpenBuyMenu: () => {
          setShowBuyMenu(true);
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        },
        onRewardMoney: (amount) => {
          setPlayerMoney((prev) => prev + amount);
        },
        onMatchEnd: (stats) => {
          setLastMatchStats(stats);
          // Update career dossier
          setCareerStats((prev: any) => {
            const updated = {
              matchesPlayed: prev.matchesPlayed + 1,
              victories: prev.victories + (stats.victory ? 1 : 0),
              totalKills: prev.totalKills + stats.kills,
              totalDeaths: prev.totalDeaths + stats.deaths,
              totalHeadshots: prev.totalHeadshots + stats.headshots,
              bestScore: Math.max(prev.bestScore, stats.score)
            };
            try {
              localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
            return updated;
          });

          // Transition to Game Over screen
          setScreen('gameover');
        }
      },
      settings.mouseSensitivity,
      settings.invertY ?? false
    );

    gameEngineRef.current = engine;

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, [screen, selectedZone, gameMode, difficulty, selectedPrimaryWeapon, settings.graphics, settings.mouseSensitivity, settings.invertY]);

  // Pause Menu Actions
  const handleResumeGame = () => {
    setIsPaused(false);
    gameEngineRef.current?.resume();
  };

  const handleReturnToZoneSelect = () => {
    setIsPaused(false);
    if (gameEngineRef.current) {
      gameEngineRef.current.destroy();
      gameEngineRef.current = null;
    }
    setScreen('menu');
    setShowZoneSelect(true);
  };

  const handleReturnToMainMenu = () => {
    setIsPaused(false);
    if (gameEngineRef.current) {
      gameEngineRef.current.destroy();
      gameEngineRef.current = null;
    }
    setScreen('menu');
  };

  const handleNextZone = () => {
    const currentIndex = ZONES.findIndex((z) => z.id === selectedZone.id);
    const nextZone = ZONES[(currentIndex + 1) % ZONES.length];
    setSelectedZone(nextZone);
    setScreen('loading');
  };

  // Weapon Buy Menu Handlers
  const handleBuyWeapon = (weaponId: string, cost: number) => {
    setPlayerMoney((prev) => Math.max(0, prev - cost));
    gameEngineRef.current?.equipPurchasedWeapon(weaponId);
  };

  const handleBuyArmor = (cost: number) => {
    setPlayerMoney((prev) => Math.max(0, prev - cost));
    gameEngineRef.current?.refillArmor(100);
  };

  const handleBuyMedkit = (cost: number) => {
    setPlayerMoney((prev) => Math.max(0, prev - cost));
    gameEngineRef.current?.refillHealth(100);
  };

  const handleBuyAmmo = (cost: number) => {
    setPlayerMoney((prev) => Math.max(0, prev - cost));
    gameEngineRef.current?.refillAllAmmo();
  };

  return (
    <div className="w-full h-full min-h-screen bg-black text-white relative overflow-hidden select-none font-tactical">
      {/* 1. MAIN MENU SCREEN */}
      {screen === 'menu' && (
        <MainMenu
          language={settings.language}
          onLanguageChange={(lang) => {
            const updated = { ...settings, language: lang };
            setSettings(updated);
            localStorage.setItem('tactical_strike_uz_settings', JSON.stringify(updated));
          }}
          onQuickPlay={() => {
            setSelectedZone(ZONES[0]);
            handleStartGame();
          }}
          onSelectZone={() => setShowZoneSelect(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenWeapons={() => setShowWeapons(true)}
          onOpenStats={() => setShowStats(true)}
        />
      )}

      {/* 2. LOADING SCREEN */}
      {screen === 'loading' && (
        <LoadingScreen
          language={settings.language}
          zone={selectedZone}
          onLoadingComplete={handleLoadingComplete}
        />
      )}

      {/* 3. ACTIVE GAMEPLAY CANVAS & HUD */}
      {screen === 'game' && (
        <div className="relative w-full h-full min-h-screen">
          {/* 3D WebGL Canvas Container */}
          <div ref={gameContainerRef} className="w-full h-full min-h-screen cursor-crosshair" />

          {/* Tactical Game HUD */}
          <GameHUD
            language={settings.language}
            health={hudStats.health}
            armor={hudStats.armor}
            ammo={hudStats.ammo}
            reserveAmmo={hudStats.reserveAmmo}
            currentWeapon={hudStats.currentWeapon}
            blueScore={hudStats.blueScore}
            redScore={hudStats.redScore}
            matchTime={hudStats.matchTime}
            capturingZone={hudStats.capturingZone}
            capturedNotice={hudStats.capturedNotice}
            crosshairSpread={hudStats.crosshairSpread}
            playerPos={hudStats.playerPos}
            playerRot={hudStats.playerRot}
            teammates={hudStats.teammates}
            enemies={hudStats.enemies}
            capturePoints={hudStats.capturePoints}
            objectiveText={hudStats.objectiveText}
            hitConfirm={hitConfirm}
            isHeadshotHit={isHeadshotHit}
            killEvents={killEvents}
            isPointerLocked={isPointerLocked}
            onLockPointer={() => {
              if (gameEngineRef.current && !isPaused) {
                gameEngineRef.current.resume();
              }
            }}
            crosshairConfig={{
              size: settings.crosshairSize,
              thickness: settings.crosshairThickness,
              opacity: settings.crosshairOpacity,
              color: settings.crosshairColor
            }}
            playerMoney={playerMoney}
            onOpenBuyMenu={() => {
              setShowBuyMenu(true);
              if (document.pointerLockElement) {
                document.exitPointerLock();
              }
            }}
          />

          {/* In-Game Weapon & Equipment Buy Menu */}
          {showBuyMenu && (
            <BuyMenuModal
              language={settings.language}
              playerMoney={playerMoney}
              currentWeaponId={hudStats.currentWeapon.id}
              onBuyWeapon={handleBuyWeapon}
              onBuyArmor={handleBuyArmor}
              onBuyMedkit={handleBuyMedkit}
              onBuyAmmo={handleBuyAmmo}
              onClose={() => setShowBuyMenu(false)}
            />
          )}

          {/* In-Game Pause Menu */}
          {isPaused && (
            <PauseMenu
              language={settings.language}
              onResume={handleResumeGame}
              onOpenSettings={() => setShowSettings(true)}
              onReturnToZoneSelect={handleReturnToZoneSelect}
              onReturnToMainMenu={handleReturnToMainMenu}
            />
          )}
        </div>
      )}

      {/* 4. GAME OVER RESULTS */}
      {screen === 'gameover' && lastMatchStats && (
        <GameOverModal
          language={settings.language}
          stats={lastMatchStats}
          onPlayAgain={() => setScreen('loading')}
          onNextZoneOrSelect={lastMatchStats.victory ? handleNextZone : () => setShowZoneSelect(true)}
          onReturnToMainMenu={handleReturnToMainMenu}
        />
      )}

      {/* MODALS */}
      {showZoneSelect && (
        <ZoneSelectModal
          language={settings.language}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          gameMode={gameMode}
          onGameModeChange={setGameMode}
          onStartGame={handleStartGame}
          onCancel={() => setShowZoneSelect(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showWeapons && (
        <WeaponsModal
          language={settings.language}
          selectedPrimaryId={selectedPrimaryWeapon}
          onSelectPrimary={(wId) => {
            setSelectedPrimaryWeapon(wId);
          }}
          onClose={() => setShowWeapons(false)}
        />
      )}

      {showStats && (
        <StatsModal
          language={settings.language}
          careerStats={careerStats}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
