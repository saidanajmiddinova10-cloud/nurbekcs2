import React, { useState } from 'react';
import { GameSettings, Language, GraphicsQuality } from '../types';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import { X, Monitor, Volume2, Gamepad2, Globe, Crosshair as CrosshairIcon, Check } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [current, setCurrent] = useState<GameSettings>({ ...settings });
  const t = translations[current.language];

  const handleSave = () => {
    soundEngine.playUiClick();
    soundEngine.setVolumes(current.masterVolume, current.effectsVolume, current.musicVolume);
    onSave(current);
  };

  const handleCancel = () => {
    soundEngine.playUiClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-tactical overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900/95 border-2 border-neutral-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest">
              SYSTEM CONFIGURATION // HARDWARE & INPUT
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              {t.settingsTitle}
            </h2>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Settings Sections */}
        <div className="flex flex-col gap-6">
          {/* 1. LANGUAGE */}
          <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-3 text-sky-400 text-sm font-bold">
              <Globe className="w-4 h-4" />
              <span>{t.language}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['uz', 'en', 'ru'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setCurrent((prev) => ({ ...prev, language: lang }));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    current.language === lang
                      ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {lang === 'uz' ? 'O‘zbekcha' : lang === 'en' ? 'English' : 'Русский'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. GRAPHICS */}
          <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-3 text-sky-400 text-sm font-bold">
              <Monitor className="w-4 h-4" />
              <span>{t.graphics}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'ultra'] as GraphicsQuality[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setCurrent((prev) => ({ ...prev, graphics: g }));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    current.graphics === g
                      ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {t[g]}
                </button>
              ))}
            </div>
          </div>

          {/* 3. SOUND */}
          <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-4 text-sky-400 text-sm font-bold">
              <Volume2 className="w-4 h-4" />
              <span>{t.sound}</span>
            </div>

            <div className="flex flex-col gap-4 font-sans text-xs">
              {/* Master Volume */}
              <div>
                <div className="flex justify-between text-neutral-300 font-bold mb-1">
                  <span>{t.masterVol}</span>
                  <span className="font-mono-tech">{Math.round(current.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={current.masterVolume}
                  onChange={(e) =>
                    setCurrent((prev) => ({ ...prev, masterVolume: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Combat SFX */}
              <div>
                <div className="flex justify-between text-neutral-300 font-bold mb-1">
                  <span>{t.effectsVol}</span>
                  <span className="font-mono-tech">{Math.round(current.effectsVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={current.effectsVolume}
                  onChange={(e) =>
                    setCurrent((prev) => ({ ...prev, effectsVolume: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. CONTROLS & SENSITIVITY */}
          <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-4 text-sky-400 text-sm font-bold">
              <Gamepad2 className="w-4 h-4" />
              <span>{t.controls}</span>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 font-bold mb-1 font-sans text-xs">
                <span>{t.mouseSensitivity}</span>
                <span className="font-mono-tech">{(current.mouseSensitivity * 1000).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0008"
                max="0.005"
                step="0.0002"
                value={current.mouseSensitivity}
                onChange={(e) =>
                  setCurrent((prev) => ({ ...prev, mouseSensitivity: parseFloat(e.target.value) }))
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Invert Mouse Y Toggle */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-neutral-200 font-bold font-sans text-xs">
                  {t.invertMouseY}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono-tech mt-0.5">
                  {t.invertMouseYDesc}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setCurrent((prev) => ({ ...prev, invertY: !prev.invertY }));
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border ${
                  current.invertY
                    ? 'bg-sky-600 border-sky-400'
                    : 'bg-neutral-800 border-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    current.invertY ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Key Bindings Quick Reference */}
            <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] font-mono-tech text-neutral-400 grid grid-cols-2 gap-2">
              <div>W, A, S, D: Harakat (Move)</div>
              <div>SHIFT: Yugurish (Sprint)</div>
              <div>SPACE: Sakrash (Jump)</div>
              <div>CTRL: O‘tirish (Crouch)</div>
              <div>R: Qayta o‘qlash (Reload)</div>
              <div>LKM: O‘t ochish (Fire)</div>
              <div>PKM: Nishon (ADS)</div>
              <div>1, 2, 3: Qurollar (Slots)</div>
            </div>
          </div>

          {/* 5. CROSSHAIR */}
          <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 mb-4 text-sky-400 text-sm font-bold">
              <CrosshairIcon className="w-4 h-4" />
              <span>{t.crosshair}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3 font-sans text-xs">
                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.crosshairSize}</span>
                    <span className="font-mono-tech">{current.crosshairSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="18"
                    step="1"
                    value={current.crosshairSize}
                    onChange={(e) =>
                      setCurrent((prev) => ({ ...prev, crosshairSize: parseInt(e.target.value) }))
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.crosshairThickness}</span>
                    <span className="font-mono-tech">{current.crosshairThickness}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={current.crosshairThickness}
                    onChange={(e) =>
                      setCurrent((prev) => ({ ...prev, crosshairThickness: parseInt(e.target.value) }))
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-neutral-900 rounded-lg border border-neutral-700 flex items-center justify-center h-28 relative">
                <span className="absolute top-1 left-2 text-[10px] font-mono-tech text-neutral-500">PRITSEL PREVIEW</span>
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute bg-sky-400"
                    style={{
                      width: `${current.crosshairThickness}px`,
                      height: `${current.crosshairSize}px`,
                      top: `-${current.crosshairSize + 4}px`
                    }}
                  />
                  <div
                    className="absolute bg-sky-400"
                    style={{
                      width: `${current.crosshairThickness}px`,
                      height: `${current.crosshairSize}px`,
                      bottom: `-${current.crosshairSize + 4}px`
                    }}
                  />
                  <div
                    className="absolute bg-sky-400"
                    style={{
                      height: `${current.crosshairThickness}px`,
                      width: `${current.crosshairSize}px`,
                      left: `-${current.crosshairSize + 4}px`
                    }}
                  />
                  <div
                    className="absolute bg-sky-400"
                    style={{
                      height: `${current.crosshairThickness}px`,
                      width: `${current.crosshairSize}px`,
                      right: `-${current.crosshairSize + 4}px`
                    }}
                  />
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons: SAQLASH & BEKOR QILISH */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={handleCancel}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="px-6 py-2.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-sm tracking-wider transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            onClick={handleSave}
            onMouseEnter={() => soundEngine.playUiHover()}
            className="px-8 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-sm tracking-wider shadow-lg shadow-sky-900/40 border border-sky-400/50 transition-all cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{t.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
