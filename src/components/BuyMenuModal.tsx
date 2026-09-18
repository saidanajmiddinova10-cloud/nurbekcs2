import React, { useState } from 'react';
import { WeaponData, Language } from '../types';
import { WEAPON_REGISTRY } from '../game/weapons';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import {
  X,
  Crosshair,
  Shield,
  Heart,
  Zap,
  Check,
  ShoppingBag,
  Flame,
  Award
} from 'lucide-react';

interface BuyMenuModalProps {
  language: Language;
  playerMoney: number;
  currentWeaponId: string;
  onBuyWeapon: (weaponId: string, cost: number) => void;
  onBuyArmor: (cost: number) => void;
  onBuyMedkit: (cost: number) => void;
  onBuyAmmo: (cost: number) => void;
  onClose: () => void;
}

export const BuyMenuModal: React.FC<BuyMenuModalProps> = ({
  language,
  playerMoney,
  currentWeaponId,
  onBuyWeapon,
  onBuyArmor,
  onBuyMedkit,
  onBuyAmmo,
  onClose
}) => {
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rifles' | 'heavy' | 'smg' | 'equipment'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handlePurchaseWeapon = (weapon: WeaponData) => {
    const cost = weapon.price || 2000;
    if (playerMoney < cost) {
      soundEngine.playEmptyClick();
      showNotification(t.insufficientFunds);
      return;
    }
    soundEngine.playBuy();
    onBuyWeapon(weapon.id, cost);
    showNotification(`${weapon.name} ${t.purchased}!`);
  };

  const handlePurchaseArmor = () => {
    const cost = 650;
    if (playerMoney < cost) {
      soundEngine.playEmptyClick();
      showNotification(t.insufficientFunds);
      return;
    }
    soundEngine.playBuy();
    onBuyArmor(cost);
    showNotification(`${t.buyArmor} ${t.purchased}!`);
  };

  const handlePurchaseMedkit = () => {
    const cost = 500;
    if (playerMoney < cost) {
      soundEngine.playEmptyClick();
      showNotification(t.insufficientFunds);
      return;
    }
    soundEngine.playBuy();
    onBuyMedkit(cost);
    showNotification(`${t.buyMedkit} ${t.purchased}!`);
  };

  const handlePurchaseAmmo = () => {
    const cost = 300;
    if (playerMoney < cost) {
      soundEngine.playEmptyClick();
      showNotification(t.insufficientFunds);
      return;
    }
    soundEngine.playBuy();
    onBuyAmmo(cost);
    showNotification(`${t.buyAmmo} ${t.purchased}!`);
  };

  const weaponList = Object.values(WEAPON_REGISTRY).filter((w) => {
    if (w.category === 'knife') return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'rifles') return w.category === 'rifle' || w.category === 'sniper';
    if (selectedCategory === 'heavy') return w.id === 'AWM' || w.category === 'shotgun';
    if (selectedCategory === 'smg') return w.category === 'smg' || w.category === 'pistol';
    return true;
  });

  return (
    <div
      id="buy-menu-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none font-tactical"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl bg-neutral-900/95 border-2 border-amber-500/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] p-5 sm:p-7 flex flex-col gap-5 max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-mono-tech text-amber-400 tracking-widest uppercase flex items-center gap-2">
                <span>MILITARY LOGISTICS // FIELD SUPPLY</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-[10px]">
                  [B] BUY MENU
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                {t.buyMenuTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Player Cash Display */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-neutral-950 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <span className="text-xs font-mono-tech text-neutral-400 uppercase tracking-wider">
                {t.money}:
              </span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight font-mono-tech">
                ${playerMoney.toLocaleString()}
              </span>
            </div>

            <button
              id="buy-menu-close-btn"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="bg-amber-500/20 border border-amber-500/60 text-amber-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{feedbackMsg}</span>
            </div>
          </div>
        )}

        {/* Categories Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
          {[
            { id: 'all', label: 'Barcha Qurollar' },
            { id: 'rifles', label: 'Shturm & Snayperlar' },
            { id: 'heavy', label: 'Og‘ir & AWM' },
            { id: 'smg', label: 'To‘pponcha & SMG' },
            { id: 'equipment', label: 'Ta’minot & Zirh' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundEngine.playUiClick();
                setSelectedCategory(cat.id as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Store Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {selectedCategory === 'equipment' ? (
            /* Equipment Purchases: Armor, Medkit, Ammo */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
              {/* Heavy Armor */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-500/60 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center text-sky-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono-tech">$650</span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">{t.buyArmor}</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Jangchi himoyasini 100% gacha to‘liq tiklaydi. O‘q zarbini 50% ga kamaytiradi.
                  </p>
                </div>
                <button
                  onClick={handlePurchaseArmor}
                  disabled={playerMoney < 650}
                  className="w-full py-2.5 rounded-xl font-black text-sm tracking-wider bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md"
                >
                  {t.buyWeapon} ($650)
                </button>
              </div>

              {/* Medkit */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-500/60 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Heart className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono-tech">$500</span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">{t.buyMedkit}</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Salomatlikni 100 HP gacha to‘liq davolaydi va tezkor safga qaytaradi.
                  </p>
                </div>
                <button
                  onClick={handlePurchaseMedkit}
                  disabled={playerMoney < 500}
                  className="w-full py-2.5 rounded-xl font-black text-sm tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md"
                >
                  {t.buyWeapon} ($500)
                </button>
              </div>

              {/* Ammo Box */}
              <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-700 hover:border-amber-500/60 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono-tech">$300</span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">{t.buyAmmo}</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Barcha qurollar uchun maksimal o‘q-dori zahirasini to‘ldiradi.
                  </p>
                </div>
                <button
                  onClick={handlePurchaseAmmo}
                  disabled={playerMoney < 300}
                  className="w-full py-2.5 rounded-xl font-black text-sm tracking-wider bg-amber-600 hover:bg-amber-500 text-neutral-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md"
                >
                  {t.buyWeapon} ($300)
                </button>
              </div>
            </div>
          ) : (
            /* Weapon Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
              {weaponList.map((weapon) => {
                const cost = weapon.price || 2000;
                const isCurrent = currentWeaponId === weapon.id;
                const canAfford = playerMoney >= cost;
                const isAWM = weapon.id === 'AWM';
                const isAK47 = weapon.id === 'AK-47';

                return (
                  <div
                    key={weapon.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isAWM
                        ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : isAK47
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : isCurrent
                        ? 'bg-sky-950/30 border-sky-500/60'
                        : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isAWM
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : isAK47
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-neutral-900 text-sky-400 border border-neutral-700'
                          }`}
                        >
                          <Crosshair className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-black text-white flex items-center gap-1.5">
                            <span>{weapon.name}</span>
                            {isAK47 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/40">
                                AK-47
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono-tech text-neutral-400 uppercase tracking-wider">
                            {weapon.category} // {weapon.automatic ? 'AUTO' : 'SEMI'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 font-mono-tech">
                          ${cost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* AWM 1-Shot Kill Badge */}
                    {isAWM && (
                      <div className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/60 flex items-center gap-2 text-red-300 text-xs font-black tracking-wider animate-pulse">
                        <Flame className="w-4 h-4 text-red-400" />
                        <span>{t.oneShotKillBadge}</span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                      {language === 'uz'
                        ? weapon.descriptionUz
                        : language === 'ru'
                        ? weapon.descriptionRu
                        : weapon.descriptionEn}
                    </p>

                    {/* Weapon Stat Micro-Bars */}
                    <div className="grid grid-cols-3 gap-2 py-1 text-[10px] font-mono-tech text-neutral-400 bg-neutral-900/60 p-2 rounded-xl">
                      <div>
                        <div>ZARAR:</div>
                        <div className="font-bold text-white text-xs">{weapon.damage} HP</div>
                      </div>
                      <div>
                        <div>TEZLIK:</div>
                        <div className="font-bold text-white text-xs">
                          {weapon.fireRate > 0 ? `${weapon.fireRate} RPM` : 'SINGLE'}
                        </div>
                      </div>
                      <div>
                        <div>MAGAZIN:</div>
                        <div className="font-bold text-white text-xs">
                          {weapon.magazineSize}/{weapon.reserveAmmo}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handlePurchaseWeapon(weapon)}
                      disabled={!canAfford && !isCurrent}
                      className={`w-full py-2.5 rounded-xl font-black text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          : isAWM
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-40'
                          : isAK47
                          ? 'bg-amber-600 hover:bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-40'
                          : 'bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white border border-neutral-700 hover:border-amber-500 disabled:opacity-40'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>{t.equipped}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>
                            {t.buyWeapon} (${cost})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer controls note */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-3 text-xs text-neutral-400 font-mono-tech">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">INFO:</span>
            <span>Qurol sotib olingach, u to‘liq magazin bilan qo‘lingizga darhol o‘tadi!</span>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Jangni davom ettirish [ESC / B]
          </button>
        </div>
      </div>
    </div>
  );
};
