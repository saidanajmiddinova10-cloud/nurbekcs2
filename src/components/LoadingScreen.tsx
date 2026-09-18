import React, { useEffect, useState } from 'react';
import { ZoneConfig, Language } from '../types';
import { translations } from '../localization';
import { Shield, Loader2, Sparkles, Crosshair } from 'lucide-react';

interface LoadingScreenProps {
  language: Language;
  zone: ZoneConfig;
  onLoadingComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  language,
  zone,
  onLoadingComplete
}) => {
  const t = translations[language];
  const [progress, setProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const zoneName = language === 'uz' ? zone.nameUz : language === 'en' ? zone.nameEn : zone.nameRu;

  // Progress simulation (0 to 100%)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onLoadingComplete();
          }, 300);
          return 100;
        }
        // Increment smoothly with realistic variable chunks
        const inc = Math.floor(Math.random() * 8) + 4;
        return Math.min(100, prev + inc);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  // Rotate tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % t.tips.length);
    }, 2400);

    return () => clearInterval(tipInterval);
  }, [t.tips.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-8 sm:p-14 bg-neutral-950 text-white select-none font-tactical overflow-hidden">
      {/* Animated Tactical Grid & Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-sky-950/40 z-0" />
      <div className="absolute inset-0 tactical-grid-bg opacity-30 z-0" />
      <div className="absolute inset-0 scanline opacity-25 z-0" />

      {/* Decorative Corner Accents */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-sky-400 z-10" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-sky-400 z-10" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-sky-400 z-10" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-sky-400 z-10" />

      {/* TOP HEADER */}
      <div className="relative z-10 flex justify-between items-center border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-sky-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-black tracking-wider text-neutral-100">
              {t.gameTitle}
            </h1>
            <p className="text-[11px] font-mono-tech text-neutral-400 tracking-widest">
              DEPLOYMENT PROTOCOL // MILITARY ENGINE
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest">
            STATUS: INITIALIZING ASSETS
          </span>
        </div>
      </div>

      {/* CENTER: Zone Briefing & Visual Preview */}
      <div className="relative z-10 max-w-2xl mx-auto w-full my-auto text-center flex flex-col items-center">
        {/* Animated Target Reticle */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border border-sky-500/30 flex items-center justify-center animate-spin">
            <div className="w-16 h-16 rounded-full border-t-2 border-sky-400"></div>
          </div>
          <Crosshair className="w-10 h-10 text-sky-400 absolute inset-0 m-auto" />
        </div>

        <div className="text-xs font-mono-tech text-sky-400 tracking-widest uppercase mb-2">
          {t.loadingZone}
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-widest mb-4 uppercase drop-shadow-lg">
          {zoneName}
        </h2>
        <p className="text-sm font-sans text-neutral-300 max-w-lg mb-8 leading-relaxed">
          {language === 'uz' ? zone.descUz : language === 'en' ? zone.descEn : zone.descRu}
        </p>

        {/* Tactical Tip Box */}
        <div className="w-full max-w-lg bg-neutral-900/80 backdrop-blur border border-neutral-700/80 rounded-xl p-4 text-left flex items-start gap-3 shadow-xl">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-mono-tech text-amber-400 tracking-widest uppercase mb-1">
              TAKTIC MASLAHAT
            </div>
            <p className="text-xs font-sans text-neutral-200 leading-normal">
              {t.tips[currentTipIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM PROGRESS BAR */}
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-2 font-mono-tech text-xs">
          <span className="text-neutral-400 uppercase tracking-wider">{t.systemCheck}</span>
          <span className="text-sky-400 font-bold text-base">{progress}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700 p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-sky-600 via-sky-400 to-emerald-400 rounded-full transition-all duration-100 shadow-[0_0_12px_#38bdf8]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
