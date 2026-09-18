import React from 'react';
import { Language } from '../types';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import { X, Trophy, Target, Award, Skull, Flame, Shield, Crosshair } from 'lucide-react';

interface StatsModalProps {
  language: Language;
  onClose: () => void;
  careerStats: {
    matchesPlayed: number;
    victories: number;
    totalKills: number;
    totalDeaths: number;
    totalHeadshots: number;
    bestScore: number;
  };
}

export const StatsModal: React.FC<StatsModalProps> = ({
  language,
  onClose,
  careerStats
}) => {
  const t = translations[language];

  const kdRatio =
    careerStats.totalDeaths > 0
      ? (careerStats.totalKills / careerStats.totalDeaths).toFixed(2)
      : careerStats.totalKills.toString();

  const winRate =
    careerStats.matchesPlayed > 0
      ? Math.round((careerStats.victories / careerStats.matchesPlayed) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-tactical overflow-y-auto">
      <div className="w-full max-w-3xl bg-neutral-900/95 border-2 border-neutral-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest">
              OPERATIONAL RECORD // CAREER DOSSIER
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              {t.careerStats}
            </h2>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Top Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              K/D NISBATI
            </div>
            <div className="text-3xl font-black text-sky-400 font-mono-tech">{kdRatio}</div>
          </div>

          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              G‘ALABA FOIZI
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono-tech">{winRate}%</div>
          </div>

          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              JAMI O‘LDIRISHLAR
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono-tech">{careerStats.totalKills}</div>
          </div>

          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 text-center">
            <div className="text-[11px] font-mono-tech text-neutral-400 uppercase tracking-wider mb-1">
              ENG YUQORI BALL
            </div>
            <div className="text-3xl font-black text-purple-400 font-mono-tech">{careerStats.bestScore}</div>
          </div>
        </div>

        {/* Detailed Career Table */}
        <div className="bg-neutral-950/60 rounded-xl border border-neutral-800 divide-y divide-neutral-800 text-sm font-sans">
          <div className="flex justify-between p-3.5">
            <span className="text-neutral-400">Jami o‘tkazilgan o‘yinlar (Matches Deployed)</span>
            <span className="font-mono-tech font-bold text-white">{careerStats.matchesPlayed}</span>
          </div>
          <div className="flex justify-between p-3.5">
            <span className="text-neutral-400">Muvaffaqiyatli operatsiyalar (Victories)</span>
            <span className="font-mono-tech font-bold text-emerald-400">{careerStats.victories}</span>
          </div>
          <div className="flex justify-between p-3.5">
            <span className="text-neutral-400">Boshdan urilgan o‘qlar (Headshots)</span>
            <span className="font-mono-tech font-bold text-purple-400">{careerStats.totalHeadshots}</span>
          </div>
          <div className="flex justify-between p-3.5">
            <span className="text-neutral-400">Halok bo‘lishlar (Casualties)</span>
            <span className="font-mono-tech font-bold text-red-400">{careerStats.totalDeaths}</span>
          </div>
        </div>

        {/* Tactical Badges */}
        <div>
          <div className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest mb-3">
            HARBIY UNVONLAR VA NISHONLAR
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
              <Shield className="w-8 h-8 text-sky-400" />
              <div>
                <div className="text-xs font-bold text-white">MAXSUS KUCHLAR</div>
                <div className="text-[10px] text-neutral-500 font-mono-tech">1-DARAJA MERGAN</div>
              </div>
            </div>

            <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
              <Crosshair className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">ANIQ ZARB</div>
                <div className="text-[10px] text-neutral-500 font-mono-tech">HEADSHOT MASTER</div>
              </div>
            </div>

            <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
              <Flame className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">HIMOYA CHIZIG‘I</div>
                <div className="text-[10px] text-neutral-500 font-mono-tech">ZONE DOMINATOR</div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm tracking-wider border border-neutral-700 transition-colors cursor-pointer"
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
};
