import React, { useState } from 'react';
import { ZoneConfig, Language, Difficulty, GameMode } from '../types';
import { ZONES } from '../game/zones';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import {
  X,
  Play,
  Users,
  Bot,
  Compass,
  AlertTriangle,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface ZoneSelectModalProps {
  language: Language;
  selectedZone: ZoneConfig;
  onSelectZone: (zone: ZoneConfig) => void;
  difficulty: Difficulty;
  onDifficultyChange: (diff: Difficulty) => void;
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  onStartGame: () => void;
  onCancel: () => void;
}

export const ZoneSelectModal: React.FC<ZoneSelectModalProps> = ({
  language,
  selectedZone,
  onSelectZone,
  difficulty,
  onDifficultyChange,
  gameMode,
  onGameModeChange,
  onStartGame,
  onCancel
}) => {
  const t = translations[language];

  // Visual thumbnail themes for each zone
  const getZoneThumbnailGradient = (env: string) => {
    switch (env) {
      case 'desert':
        return 'from-amber-700 via-yellow-600 to-amber-900';
      case 'urban':
        return 'from-slate-700 via-slate-600 to-slate-900';
      case 'industrial':
        return 'from-stone-700 via-orange-800 to-stone-900';
      case 'mountain':
        return 'from-blue-900 via-slate-600 to-slate-800';
      case 'port':
        return 'from-cyan-900 via-blue-800 to-slate-900';
      case 'night':
      default:
        return 'from-indigo-950 via-slate-900 to-black';
    }
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">{t.easy}</span>;
      case 'normal':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-950 text-sky-400 border border-sky-500/40">{t.normal}</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-500/40">{t.hard}</span>;
      case 'extreme':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-500/40 animate-pulse">{t.extreme}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-tactical overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-neutral-900/95 border-2 border-neutral-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="text-xs font-mono-tech text-sky-400 tracking-widest uppercase">
              SECTOR RECONNAISSANCE // TACTICAL MAPS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              {t.zoneSelectTitle}
            </h2>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onCancel();
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Game Mode & Difficulty Selector Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
          {/* Game Mode Selector */}
          <div>
            <label className="text-xs font-mono-tech text-neutral-400 uppercase tracking-wider block mb-2">
              {t.gameMode}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['tdm', 'zone_control', 'elimination'] as GameMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onGameModeChange(mode);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    gameMode === mode
                      ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {t[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="text-xs font-mono-tech text-neutral-400 uppercase tracking-wider block mb-2">
              {t.difficulty}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'normal', 'hard', 'extreme'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onDifficultyChange(d);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {t[d]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6 Zones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ZONES.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            const zoneName = language === 'uz' ? zone.nameUz : language === 'en' ? zone.nameEn : zone.nameRu;
            const zoneDesc = language === 'uz' ? zone.descUz : language === 'en' ? zone.descEn : zone.descRu;

            return (
              <div
                key={zone.id}
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectZone(zone);
                }}
                onMouseEnter={() => soundEngine.playUiHover()}
                className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden p-4 flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-400 bg-sky-950/40 shadow-xl shadow-sky-950/50 scale-[1.02]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-600 hover:bg-neutral-900/60'
                }`}
              >
                {/* Visual Thumbnail */}
                <div
                  className={`w-full h-28 rounded-lg mb-3 bg-gradient-to-br ${getZoneThumbnailGradient(
                    zone.environmentType
                  )} relative overflow-hidden flex items-end p-3 border border-white/10`}
                >
                  {/* Grid pattern overlay */}
                  <div className="absolute inset-0 tactical-grid-bg opacity-30" />
                  
                  {/* Selected Tick Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>TANLANDI</span>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between w-full">
                    {getDifficultyBadge(zone.difficulty)}
                    <span className="text-[10px] font-mono-tech text-white/90 bg-black/60 px-2 py-0.5 rounded uppercase">
                      {zone.environmentType}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide mb-1">
                    {zoneName}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans mb-3 line-clamp-2">
                    {zoneDesc}
                  </p>
                </div>

                {/* Metadata Badges */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-mono-tech">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-sky-400" />
                    <span>{zone.defaultBotCount} {t.botCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>{zone.recommendedPlayers}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Zone Briefing */}
        <div className="bg-sky-950/20 border border-sky-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest">
              {t.objective}:
            </div>
            <div className="text-sm font-bold text-neutral-200 mt-0.5">
              {language === 'uz' ? selectedZone.objectiveUz : language === 'en' ? selectedZone.objectiveEn : selectedZone.objectiveRu}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* BEKOR QILISH (Cancel - Closes Zone Select, returns to menu without starting) */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onCancel();
              }}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-sm tracking-wider transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>

            {/* O‘YNASH (Play - Starts Loading Screen and Launches Game) */}
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onStartGame();
              }}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="flex-1 sm:flex-initial px-8 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-black text-sm tracking-widest shadow-xl shadow-sky-900/40 border border-sky-400/50 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>{t.startMission}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
