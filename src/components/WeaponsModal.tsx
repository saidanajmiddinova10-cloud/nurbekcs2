import React, { useState } from 'react';
import { WeaponData, Language } from '../types';
import { WEAPON_REGISTRY, DEFAULT_PRIMARY_WEAPON } from '../game/weapons';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import { X, Crosshair, Check, ShieldAlert, Zap, Target, Gauge } from 'lucide-react';

interface WeaponsModalProps {
  language: Language;
  selectedPrimaryId: string;
  onSelectPrimary: (weaponId: string) => void;
  onClose: () => void;
}

export const WeaponsModal: React.FC<WeaponsModalProps> = ({
  language,
  selectedPrimaryId,
  onSelectPrimary,
  onClose
}) => {
  const t = translations[language];
  const allWeapons = Object.values(WEAPON_REGISTRY);
  const [activeWeapon, setActiveWeapon] = useState<WeaponData>(
    WEAPON_REGISTRY[selectedPrimaryId] || WEAPON_REGISTRY[DEFAULT_PRIMARY_WEAPON]
  );

  const handleSelect = (weapon: WeaponData) => {
    soundEngine.playUiClick();
    if (weapon.slot === 1) {
      onSelectPrimary(weapon.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-tactical overflow-y-auto">
      <div className="w-full max-w-5xl bg-neutral-900/95 border-2 border-neutral-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest">
              ARSENAL // TACTICAL WEAPON INVENTORY
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              {t.weaponsArsenal}
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

        {/* Weapons Layout: Left List + Right Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Weapon List (Categorized) */}
          <div className="lg:col-span-5 flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {allWeapons.map((w) => {
              const isCurrent = activeWeapon.id === w.id;
              const isEquippedPrimary = selectedPrimaryId === w.id;

              return (
                <div
                  key={w.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveWeapon(w);
                  }}
                  onMouseEnter={() => soundEngine.playUiHover()}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isCurrent
                      ? 'bg-sky-950/40 border-sky-400 text-white'
                      : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-sky-400">
                      <Crosshair className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black">{w.name}</div>
                      <div className="text-[10px] font-mono-tech text-neutral-400 uppercase tracking-wider">
                        {w.category} // {w.fireRate > 0 ? `${w.fireRate} RPM` : 'MELEE'}
                      </div>
                    </div>
                  </div>

                  {isEquippedPrimary && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold">
                      {t.equipped}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Weapon Detailed Specs */}
          <div className="lg:col-span-7 bg-neutral-950/70 p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between mb-4 border-b border-neutral-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-tech text-sky-400 uppercase tracking-widest">
                      {activeWeapon.category} // SLOT {activeWeapon.slot}
                    </span>
                    {activeWeapon.price && (
                      <span className="text-xs font-mono-tech font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        ${activeWeapon.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-white mt-1 flex items-center gap-2">
                    <span>{activeWeapon.name}</span>
                  </h3>
                  {activeWeapon.id === 'AWM' && (
                    <div className="mt-1 px-2.5 py-1 rounded bg-red-600/20 border border-red-500/60 text-red-300 text-xs font-black tracking-wider inline-flex items-center gap-1.5 animate-pulse">
                      <span>⚡ 1-SHOT KILL (BITTADA O‘LDIRADI)</span>
                    </div>
                  )}
                  <p className="text-xs text-neutral-300 mt-2 font-sans leading-relaxed">
                    {language === 'uz'
                      ? activeWeapon.descriptionUz
                      : language === 'ru'
                      ? activeWeapon.descriptionRu
                      : activeWeapon.descriptionEn}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono-tech text-neutral-400">{t.magazine}</div>
                  <div className="text-2xl font-black text-sky-400 font-mono-tech">
                    {activeWeapon.magazineSize} / {activeWeapon.reserveAmmo}
                  </div>
                </div>
              </div>

              {/* Spec Bars Grid */}
              <div className="flex flex-col gap-3 font-sans text-xs">
                {/* Damage */}
                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.damage}</span>
                    <span className="font-mono-tech">{activeWeapon.damage} HP</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(100, activeWeapon.damage)}%` }}
                    />
                  </div>
                </div>

                {/* Accuracy */}
                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.accuracy}</span>
                    <span className="font-mono-tech">{activeWeapon.accuracy}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${activeWeapon.accuracy}%` }}
                    />
                  </div>
                </div>

                {/* Fire Rate */}
                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.fireRate}</span>
                    <span className="font-mono-tech">{activeWeapon.fireRate} RPM</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeWeapon.fireRate / 900) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Range */}
                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.range}</span>
                    <span className="font-mono-tech">{activeWeapon.range}m</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeWeapon.range / 120) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Recoil */}
                <div>
                  <div className="flex justify-between text-neutral-300 font-bold mb-1">
                    <span>{t.recoil}</span>
                    <span className="font-mono-tech">{(activeWeapon.recoil * 1000).toFixed(0)} PTS</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeWeapon.recoil / 0.05) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
              <span className="text-xs font-mono-tech text-neutral-500">
                RELOAD TIME: {activeWeapon.reloadTime}s
              </span>

              {activeWeapon.slot === 1 ? (
                <button
                  onClick={() => handleSelect(activeWeapon)}
                  disabled={selectedPrimaryId === activeWeapon.id}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    selectedPrimaryId === activeWeapon.id
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 border border-sky-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{selectedPrimaryId === activeWeapon.id ? t.equipped : t.equip}</span>
                </button>
              ) : (
                <span className="text-xs text-neutral-400 font-mono-tech">
                  {t.equipped} (Avtomatik)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
