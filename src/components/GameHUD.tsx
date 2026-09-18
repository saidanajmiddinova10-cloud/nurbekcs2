import React from 'react';
import { WeaponData, CapturePoint, KillEvent, Language } from '../types';
import { translations } from '../localization';
import { Shield, Heart, Crosshair as CrosshairIcon, Target, Award, Compass, ShoppingBag, DollarSign, Flame } from 'lucide-react';

interface GameHUDProps {
  language: Language;
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
  hitConfirm: boolean;
  isHeadshotHit: boolean;
  killEvents: KillEvent[];
  isPointerLocked: boolean;
  onLockPointer: () => void;
  crosshairConfig: {
    size: number;
    thickness: number;
    opacity: number;
    color: string;
  };
  playerMoney?: number;
  onOpenBuyMenu?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  language,
  health,
  armor,
  ammo,
  reserveAmmo,
  currentWeapon,
  blueScore,
  redScore,
  matchTime,
  capturingZone,
  capturedNotice,
  crosshairSpread,
  playerPos,
  playerRot,
  teammates,
  enemies,
  capturePoints,
  objectiveText,
  hitConfirm,
  isHeadshotHit,
  killEvents,
  isPointerLocked,
  onLockPointer,
  crosshairConfig,
  playerMoney = 3000,
  onOpenBuyMenu
}) => {
  const t = translations[language];

  // Format match time (MM:SS)
  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Mini-map coordinates transform (scale 120m map to 160px canvas)
  const mapScale = 1.1;
  const mapCenter = 80;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-tactical">
      {/* 1. TOP HEADER: Scores, Timer, & Mission Objective */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        {/* Team Scoreboard Bar */}
        <div className="hud-panel px-6 py-2 rounded-md flex items-center gap-6 border-b-2 border-emerald-500/40">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-400 font-bold tracking-wider">{t.blueTeam}</span>
            <span className="text-2xl font-black text-blue-300 font-mono-tech ml-1">{blueScore}</span>
          </div>

          <div className="px-3 py-1 bg-neutral-900/90 rounded border border-neutral-700 font-mono-tech text-amber-400 font-bold text-lg tracking-widest">
            {timeFormatted}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-red-400 font-mono-tech mr-1">{redScore}</span>
            <span className="text-red-400 font-bold tracking-wider">{t.redTeam}</span>
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          </div>
        </div>

        {/* Dynamic Objective Banner */}
        <div className="mt-2 px-4 py-1 bg-black/70 backdrop-blur border border-amber-500/30 rounded text-xs text-amber-300 tracking-wider flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.objective}: {objectiveText}</span>
        </div>
      </div>

      {/* 2. TOP-LEFT: Tactical Mini-map Radar */}
      <div className="absolute top-4 left-4 z-20">
        <div className="w-40 h-40 rounded-full hud-panel border-2 border-emerald-500/40 relative overflow-hidden shadow-2xl">
          {/* Radar Sweep & Grid */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/20"></div>
          <div className="absolute inset-4 rounded-full border border-emerald-500/20"></div>
          <div className="absolute inset-8 rounded-full border border-emerald-500/20"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-emerald-500/25"></div>
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-emerald-500/25"></div>

          {/* Capture Zones */}
          {capturePoints.map((cp) => {
            const rx = mapCenter + (cp.position[0] - playerPos[0]) * mapScale;
            const ry = mapCenter + (cp.position[2] - playerPos[2]) * mapScale;
            if (rx < 4 || rx > 156 || ry < 4 || ry > 156) return null;
            return (
              <div
                key={cp.id}
                className={`absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  cp.owner === 'blue'
                    ? 'bg-blue-600/80 border-blue-400 text-white'
                    : cp.owner === 'red'
                    ? 'bg-red-600/80 border-red-400 text-white'
                    : 'bg-neutral-800/80 border-amber-400 text-amber-300'
                }`}
                style={{ left: `${rx}px`, top: `${ry}px` }}
              >
                {cp.id}
              </div>
            );
          })}

          {/* Blue Teammates */}
          {teammates.map((tm) => {
            const rx = mapCenter + (tm.x - playerPos[0]) * mapScale;
            const ry = mapCenter + (tm.z - playerPos[2]) * mapScale;
            if (rx < 4 || rx > 156 || ry < 4 || ry > 156) return null;
            return (
              <div
                key={tm.id}
                className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-blue-400 rounded-full shadow-[0_0_6px_#38bdf8]"
                style={{ left: `${rx}px`, top: `${ry}px` }}
              />
            );
          })}

          {/* Red Enemies (when visible) */}
          {enemies.map((en) => {
            if (!en.visible) return null;
            const rx = mapCenter + (en.x - playerPos[0]) * mapScale;
            const ry = mapCenter + (en.z - playerPos[2]) * mapScale;
            if (rx < 4 || rx > 156 || ry < 4 || ry > 156) return null;
            return (
              <div
                key={en.id}
                className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse"
                style={{ left: `${rx}px`, top: `${ry}px` }}
              />
            );
          })}

          {/* Player Arrow at Center */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[10px] border-b-emerald-400"
            style={{ transform: `translate(-50%, -50%) rotate(${(-playerRot * 180) / Math.PI}deg)` }}
          />

          <div className="absolute bottom-1 right-2 text-[9px] text-emerald-400 font-mono-tech">RADAR</div>
        </div>
      </div>

      {/* 3. TOP-RIGHT: Killfeed Banner */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 items-end max-w-sm">
        {killEvents.slice(-4).map((kill) => (
          <div
            key={kill.id}
            className="px-3 py-1 bg-black/75 backdrop-blur border border-neutral-800 rounded flex items-center gap-2 text-xs animate-in fade-in slide-in-from-right duration-200"
          >
            <span className={kill.killerTeam === 'blue' ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
              {kill.killer}
            </span>
            <span className="text-neutral-500 text-[10px] font-mono-tech px-1 bg-neutral-900 rounded">
              [{kill.weapon}]
            </span>
            {kill.headshot && (
              <span className="text-amber-400 text-[10px] font-bold">🎯 HS</span>
            )}
            <span className={kill.victimTeam === 'blue' ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
              {kill.victim}
            </span>
          </div>
        ))}
      </div>

      {/* 4. CENTER: Tactical Crosshair & Hit Confirmation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dynamic Crosshair */}
        <div className="relative flex items-center justify-center">
          {/* Top Pip */}
          <div
            className="absolute rounded-sm transition-all duration-75"
            style={{
              backgroundColor: crosshairConfig.color || '#38bdf8',
              width: `${crosshairConfig.thickness}px`,
              height: `${crosshairConfig.size}px`,
              top: `-${crosshairConfig.size + crosshairSpread * 6}px`,
              opacity: crosshairConfig.opacity
            }}
          />
          {/* Bottom Pip */}
          <div
            className="absolute rounded-sm transition-all duration-75"
            style={{
              backgroundColor: crosshairConfig.color || '#38bdf8',
              width: `${crosshairConfig.thickness}px`,
              height: `${crosshairConfig.size}px`,
              bottom: `-${crosshairConfig.size + crosshairSpread * 6}px`,
              opacity: crosshairConfig.opacity
            }}
          />
          {/* Left Pip */}
          <div
            className="absolute rounded-sm transition-all duration-75"
            style={{
              backgroundColor: crosshairConfig.color || '#38bdf8',
              height: `${crosshairConfig.thickness}px`,
              width: `${crosshairConfig.size}px`,
              left: `-${crosshairConfig.size + crosshairSpread * 6}px`,
              opacity: crosshairConfig.opacity
            }}
          />
          {/* Right Pip */}
          <div
            className="absolute rounded-sm transition-all duration-75"
            style={{
              backgroundColor: crosshairConfig.color || '#38bdf8',
              height: `${crosshairConfig.thickness}px`,
              width: `${crosshairConfig.size}px`,
              right: `-${crosshairConfig.size + crosshairSpread * 6}px`,
              opacity: crosshairConfig.opacity
            }}
          />
          {/* Center Dot */}
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: crosshairConfig.color || '#38bdf8' }}
          />

          {/* Hit Confirmation (ZARB!) */}
          {hitConfirm && (
            <div className="absolute -translate-y-8 flex flex-col items-center animate-bounce">
              <span className={`text-sm font-black tracking-widest px-2 py-0.5 rounded ${
                isHeadshotHit ? 'text-amber-400 bg-amber-950/80 border border-amber-500' : 'text-emerald-400 bg-emerald-950/80 border border-emerald-500'
              }`}>
                {isHeadshotHit ? t.headshot : t.hitConfirm}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. CENTER NOTIFICATIONS: Zone capture alerts */}
      {capturingZone && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-950/90 border border-blue-500 rounded-md text-blue-200 text-sm font-bold tracking-widest animate-pulse">
          {capturingZone}
        </div>
      )}

      {capturedNotice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-emerald-950/95 border-2 border-emerald-500 rounded-md text-emerald-300 text-base font-black tracking-widest shadow-2xl">
          {capturedNotice}
        </div>
      )}

      {/* 6. BOTTOM-LEFT: Health & Armor */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
        <div className="hud-panel p-4 rounded-lg flex items-center gap-6 border-l-4 border-emerald-500">
          {/* Health */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span>{t.health}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono-tech ${health < 30 ? 'text-red-500 animate-pulse' : 'text-neutral-100'}`}>
                {health}
              </span>
              <span className="text-xs text-neutral-500">/ 100</span>
            </div>
            <div className="w-28 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div
                className={`h-full transition-all duration-200 ${health < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.max(0, health)}%` }}
              />
            </div>
          </div>

          <div className="w-[1px] h-12 bg-neutral-700"></div>

          {/* Armor */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Shield className="w-4 h-4 text-sky-400 fill-sky-400/20" />
              <span>{t.armor}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono-tech text-sky-400">
                {armor}
              </span>
              <span className="text-xs text-neutral-500">/ 100</span>
            </div>
            <div className="w-28 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-sky-500 transition-all duration-200"
                style={{ width: `${Math.max(0, armor)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6.5 BOTTOM-CENTER: Keybinds Quick Reference */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-neutral-800 text-[11px] font-mono-tech text-neutral-300">
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">R / LKM</span>
        <span>Otish</span>
        <span className="text-neutral-600">|</span>
        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">SPACE</span>
        <span>Sakrash</span>
        <span className="text-neutral-600">|</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">E</span>
        <span>O‘qlash</span>
        <span className="text-neutral-600">|</span>
        <button
          onClick={onOpenBuyMenu}
          className="pointer-events-auto px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-black hover:bg-amber-400 cursor-pointer transition-colors shadow flex items-center gap-1"
        >
          <ShoppingBag className="w-3 h-3" />
          <span>DO‘KON [B]</span>
        </button>
      </div>

      {/* 7. BOTTOM-RIGHT: Ammo, Weapon Name, Cash & Shop */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        {/* Cash and Quick Shop Access Bar */}
        <div className="hud-panel px-3 py-1.5 rounded-lg flex items-center gap-3 border border-amber-500/40">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider">{t.money}:</span>
            <span className="text-lg font-black text-emerald-400 font-mono-tech">${playerMoney.toLocaleString()}</span>
          </div>

          <button
            id="hud-open-buy-btn"
            onClick={onOpenBuyMenu}
            className="pointer-events-auto px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold font-mono-tech tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>[B] {t.openShopBtn}</span>
          </button>
        </div>

        <div className="hud-panel p-4 rounded-lg flex flex-col items-end gap-2 border-r-4 border-sky-500">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-neutral-400 uppercase tracking-widest">{currentWeapon.category}</div>
              <div className="text-lg font-black text-neutral-100 flex items-center gap-2 justify-end">
                <span>{currentWeapon.name}</span>
                {currentWeapon.id === 'AK-47' && (
                  <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/40">
                    AK-47
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-sky-400">
              <CrosshairIcon className="w-6 h-6" />
            </div>
          </div>

          {/* AWM 1-Shot Kill Indicator */}
          {currentWeapon.id === 'AWM' && (
            <div className="px-2 py-0.5 rounded bg-red-600/30 border border-red-500 text-red-300 text-[10px] font-black tracking-widest flex items-center gap-1 animate-pulse">
              <Flame className="w-3 h-3 text-red-400" />
              <span>1-SHOT KILL</span>
            </div>
          )}

          {/* Ammo Numbers */}
          {currentWeapon.category !== 'knife' ? (
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-black font-mono-tech ${ammo <= 5 ? 'text-red-500 animate-pulse' : 'text-neutral-100'}`}>
                {ammo}
              </span>
              <span className="text-xl font-bold font-mono-tech text-neutral-400">
                / {reserveAmmo}
              </span>
            </div>
          ) : (
            <div className="text-xl font-bold text-neutral-400 mt-1">
              {t.equipped}
            </div>
          )}

          {/* Reload Prompt if ammo empty */}
          {currentWeapon.category !== 'knife' && ammo <= 0 && reserveAmmo > 0 && (
            <div className="text-xs font-bold text-amber-400 animate-bounce tracking-wider">
              {t.reloadPrompt}
            </div>
          )}

          {/* Quick Weapon Slots Guide */}
          <div className="flex gap-1.5 mt-1 text-[11px] font-mono-tech text-neutral-400">
            <span className={`px-2 py-0.5 rounded border ${currentWeapon.slot === 1 ? 'border-sky-400 text-sky-300 bg-sky-950/60' : 'border-neutral-800'}`}>1: PRIM</span>
            <span className={`px-2 py-0.5 rounded border ${currentWeapon.slot === 2 ? 'border-sky-400 text-sky-300 bg-sky-950/60' : 'border-neutral-800'}`}>2: SEC</span>
            <span className={`px-2 py-0.5 rounded border ${currentWeapon.slot === 3 ? 'border-sky-400 text-sky-300 bg-sky-950/60' : 'border-neutral-800'}`}>3: KNIFE</span>
          </div>
        </div>
      </div>

      {/* 8. POINTER LOCK OVERLAY (If mouse isn't captured) */}
      {!isPointerLocked && (
        <div
          onClick={onLockPointer}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-30 cursor-pointer pointer-events-auto"
        >
          <div className="hud-panel p-6 rounded-xl border border-sky-400/40 text-center max-w-md mx-4 animate-in fade-in duration-300">
            <CrosshairIcon className="w-12 h-12 text-sky-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">{t.clickToLockPointer}</h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-4">
              {t.controlsHint}
            </p>
            <div className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg tracking-wider transition-colors inline-block text-sm">
              {t.resume}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
