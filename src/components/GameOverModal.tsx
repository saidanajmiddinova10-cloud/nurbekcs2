import React from 'react';
import { MatchStats, Language } from '../types';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import { Trophy, Skull, RotateCcw, MapPin, Home, ArrowRight, Target, Clock, Award } from 'lucide-react';

interface GameOverModalProps {
  language: Language;
  stats: MatchStats;
  onPlayAgain: () => void;
  onNextZoneOrSelect: () => void;
  onReturnToMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  language,
  stats,
  onPlayAgain,
  onNextZoneOrSelect,
  onReturnToMainMenu
}) => {
  const t = translations[language];

  // Format time (MM:SS)
  const minutes = Math.floor(stats.timeSeconds / 60);
  const seconds = stats.timeSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-tactical">
      <div className="w-full max-w-xl bg-neutral-900/95 border-2 border-neutral-700/80 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header Icon */}
        <div className="mb-3">
          {stats.victory ? (
            <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500/80 flex items-center justify-center shadow-lg shadow-emerald-950/60 animate-bounce">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-950 border-2 border-red-500/80 flex items-center justify-center shadow-lg shadow-red-950/60">
              <Skull className="w-8 h-8 text-red-400" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className={`text-xs font-mono-tech uppercase tracking-widest ${stats.victory ? 'text-emerald-400' : 'text-red-400'}`}>
          {stats.victory ? t.victory : t.defeat}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider mt-1 mb-6">
          {stats.victory ? t.missionSuccess : t.missionFailed}
        </h2>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-8">
          {/* Kills */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              {t.kills}
            </div>
            <div className="text-2xl font-black text-sky-400 font-mono-tech">
              {stats.kills}
            </div>
          </div>

          {/* Deaths */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              {t.deaths}
            </div>
            <div className="text-2xl font-black text-neutral-300 font-mono-tech">
              {stats.deaths}
            </div>
          </div>

          {/* Score */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              {t.score}
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono-tech">
              {stats.score}
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              {t.accuracy}
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono-tech">
              {stats.accuracy}%
            </div>
          </div>

          {/* Headshots */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              {t.headshotsCount}
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono-tech">
              {stats.headshots}
            </div>
          </div>

          {/* Operation Time */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              {t.time}
            </div>
            <div className="text-2xl font-black text-neutral-200 font-mono-tech">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* QAYTA O'YNASH */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onPlayAgain();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-sm rounded-xl shadow-lg shadow-sky-900/40 border border-sky-400/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.playAgain}</span>
          </button>

          {/* KEYINGI ZONA or ZONA TANLASH */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onNextZoneOrSelect();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm rounded-xl border border-neutral-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {stats.victory ? (
              <>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span>{t.nextZone}</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{t.selectZone}</span>
              </>
            )}
          </button>

          {/* ASOSIY MENYU */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onReturnToMainMenu();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-sm rounded-xl border border-neutral-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.mainMenu}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
