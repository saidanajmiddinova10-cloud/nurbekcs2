import React from 'react';
import { Language } from '../types';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import { Play, Settings, MapPin, Home } from 'lucide-react';

interface PauseMenuProps {
  language: Language;
  onResume: () => void;
  onOpenSettings: () => void;
  onReturnToZoneSelect: () => void;
  onReturnToMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  language,
  onResume,
  onOpenSettings,
  onReturnToZoneSelect,
  onReturnToMainMenu
}) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-tactical">
      <div className="w-full max-w-md bg-neutral-900/95 border-2 border-neutral-700/80 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Title */}
        <div className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest mb-1">
          OPERATSIYA TO‘XTATILDI
        </div>
        <h2 className="text-4xl font-black text-white tracking-widest mb-8 border-b-2 border-sky-500 pb-2 px-8">
          {t.pause}
        </h2>

        {/* Buttons List */}
        <div className="flex flex-col gap-3.5 w-full">
          {/* DAVOM ETISH (Resume) */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onResume();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-base rounded-xl shadow-lg shadow-sky-900/40 border border-sky-400/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white text-white" />
            <span>{t.resume}</span>
          </button>

          {/* SOZLAMALAR (Settings) */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onOpenSettings();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-base rounded-xl border border-neutral-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Settings className="w-5 h-5 text-sky-400" />
            <span>{t.pauseSettings}</span>
          </button>

          {/* ZONAGA QAYTISH (Return to Zone Selection) */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onReturnToZoneSelect();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-base rounded-xl border border-neutral-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>{t.returnToZone}</span>
          </button>

          {/* ASOSIY MENYU (Return to Main Menu) */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onReturnToMainMenu();
            }}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-neutral-900 hover:bg-red-950/60 text-neutral-300 hover:text-red-300 font-bold text-base rounded-xl border border-neutral-800 hover:border-red-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>{t.mainMenu}</span>
          </button>
        </div>

        <div className="mt-8 text-xs text-neutral-500 font-mono-tech">
          TACTICAL STRIKE: UZ // PAUSE STATE
        </div>
      </div>
    </div>
  );
};
