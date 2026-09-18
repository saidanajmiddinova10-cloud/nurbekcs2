import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Language } from '../types';
import { translations } from '../localization';
import { soundEngine } from '../audio/soundSystem';
import {
  Play,
  MapPin,
  Settings,
  Crosshair,
  BarChart3,
  LogOut,
  Globe,
  Shield,
  Volume2
} from 'lucide-react';

interface MainMenuProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onQuickPlay: () => void;
  onSelectZone: () => void;
  onOpenSettings: () => void;
  onOpenWeapons: () => void;
  onOpenStats: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  language,
  onLanguageChange,
  onQuickPlay,
  onSelectZone,
  onOpenSettings,
  onOpenWeapons,
  onOpenStats
}) => {
  const t = translations[language];
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 3D Animated Tactical Background (Abandoned Industrial Environment)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.02);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 4, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Ground Road / Asphalt
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // Road yellow markings
    const lineGeo = new THREE.PlaneGeometry(0.4, 80);
    lineGeo.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0, 0.02, 0);
    scene.add(line);

    // Industrial Buildings & Warehouses in background
    const bMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const bPositions = [
      { x: -16, z: -15, w: 14, h: 18, d: 20 },
      { x: 16, z: -15, w: 14, h: 22, d: 20 },
      { x: -28, z: 5, w: 12, h: 12, d: 16 },
      { x: 28, z: 5, w: 12, h: 14, d: 16 }
    ];

    bPositions.forEach((b) => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), bMat);
      bMesh.position.set(b.x, b.h / 2, b.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      scene.add(bMesh);
    });

    // Shipping Containers
    const containerColors = [0x0369a1, 0xb91c1c, 0xca8a04, 0x15803d];
    const cPositions = [
      { x: -6, z: -4, r: 0.2, c: 0 },
      { x: -5.5, z: -4, r: 0.2, c: 1, y: 2.8 },
      { x: 7, z: -6, r: -0.4, c: 2 },
      { x: -9, z: 8, r: 0.6, c: 3 }
    ];

    cPositions.forEach((cp) => {
      const cMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 2.6, 6.5),
        new THREE.MeshStandardMaterial({ color: containerColors[cp.c], roughness: 0.6, metalness: 0.2 })
      );
      cMesh.position.set(cp.x, (cp.y || 0) + 1.3, cp.z);
      cMesh.rotation.y = cp.r;
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      scene.add(cMesh);
    });

    // Dynamic Tactical Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Atmospheric Spotlights (Military blue & emergency amber)
    const spotBlue = new THREE.SpotLight(0x0284c7, 4.0, 35, Math.PI / 4, 0.5);
    spotBlue.position.set(-10, 12, -2);
    spotBlue.target.position.set(0, 0, 0);
    scene.add(spotBlue);
    scene.add(spotBlue.target);

    const spotAmber = new THREE.SpotLight(0xf59e0b, 3.0, 30, Math.PI / 4, 0.6);
    spotAmber.position.set(12, 10, -4);
    spotAmber.target.position.set(2, 0, -2);
    scene.add(spotAmber);
    scene.add(spotAmber.target);

    // Floating Dust & Smoke Particles
    const particleCount = 180;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pPositions[i] = (Math.random() - 0.5) * 40;
      pPositions[i + 1] = Math.random() * 12;
      pPositions[i + 2] = (Math.random() - 0.5) * 40;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Animation Loop
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.005;

      // Subtle atmospheric camera panning
      camera.position.x = Math.sin(time * 0.4) * 2.5;
      camera.position.y = 3.5 + Math.cos(time * 0.3) * 0.5;
      camera.lookAt(0, 2, 0);

      // Particle drift
      const positions = pGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.01;
        if (positions[i] > 14) positions[i] = 0;
      }
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleButtonClick = (action: () => void) => {
    soundEngine.playUiClick();
    action();
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-neutral-950 overflow-hidden select-none font-tactical">
      {/* 3D Animated Background */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Dark Tactical Vignette Overlay & Grid */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70 z-10 pointer-events-none" />
      <div className="absolute inset-0 tactical-grid-bg opacity-30 z-10 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-20 z-10 pointer-events-none" />

      {/* Top Bar: Language Selector & Audio Indicator */}
      <div className="relative z-20 w-full px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs tracking-widest text-emerald-400 font-mono-tech uppercase">
            SERVER: CENTRAL ASIA // SECURE PROTOCOL v2.4
          </span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur border border-neutral-700/80 rounded-lg p-1 shadow-lg">
          <Globe className="w-4 h-4 text-sky-400 ml-2" />
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onLanguageChange('uz');
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              language === 'uz'
                ? 'bg-sky-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            O‘zbekcha
          </button>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onLanguageChange('en');
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              language === 'en'
                ? 'bg-sky-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onLanguageChange('ru');
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              language === 'ru'
                ? 'bg-sky-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Русский
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 max-w-7xl mx-auto px-8 h-[calc(100vh-100px)] flex flex-col justify-center">
        <div className="max-w-xl">
          {/* Tactical Game Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/80 border border-sky-500/40 rounded text-sky-300 text-xs font-mono-tech tracking-widest mb-3">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>ORIGINAL TACTICAL FPS PROJECT</span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-neutral-200 to-sky-400 tracking-wider drop-shadow-2xl">
              {t.gameTitle}
            </h1>
            <p className="text-sm font-semibold tracking-widest text-neutral-400 mt-2 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-sky-500"></span>
              {t.gameSubtitle}
              <span className="w-8 h-[2px] bg-sky-500"></span>
            </p>
          </div>

          {/* Tactical Action Buttons List */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            {/* O'YNASH (Quick Play) */}
            <button
              onClick={() => handleButtonClick(onQuickPlay)}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold text-lg rounded-lg shadow-xl shadow-sky-900/30 transition-all transform hover:translate-x-1.5 active:translate-x-0.5 cursor-pointer border border-sky-400/40"
            >
              <div className="flex items-center gap-4">
                <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
                <span className="tracking-widest font-black">{t.play}</span>
              </div>
              <span className="text-xs font-mono-tech text-sky-200 opacity-80 group-hover:opacity-100">
                [ {t.quickMatch} ]
              </span>
            </button>

            {/* ZONA TANLASH (Select Zone) */}
            <button
              onClick={() => handleButtonClick(onSelectZone)}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="group flex items-center justify-between px-6 py-3.5 bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-100 hover:text-white font-bold text-base rounded-lg border border-neutral-700/80 hover:border-sky-500/60 transition-all transform hover:translate-x-1.5 active:translate-x-0.5 cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wider">{t.selectZone}</span>
              </div>
              <span className="text-xs font-mono-tech text-neutral-500 group-hover:text-sky-400">
                6 ZONALAR
              </span>
            </button>

            {/* QUROLLAR (Weapons) */}
            <button
              onClick={() => handleButtonClick(onOpenWeapons)}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="group flex items-center justify-between px-6 py-3.5 bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-100 hover:text-white font-bold text-base rounded-lg border border-neutral-700/80 hover:border-sky-500/60 transition-all transform hover:translate-x-1.5 active:translate-x-0.5 cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-4">
                <Crosshair className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wider">{t.weapons}</span>
              </div>
              <span className="text-xs font-mono-tech text-neutral-500 group-hover:text-sky-400">
                ARSENAL (10)
              </span>
            </button>

            {/* SOZLAMALAR (Settings) */}
            <button
              onClick={() => handleButtonClick(onOpenSettings)}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="group flex items-center justify-between px-6 py-3.5 bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-100 hover:text-white font-bold text-base rounded-lg border border-neutral-700/80 hover:border-sky-500/60 transition-all transform hover:translate-x-1.5 active:translate-x-0.5 cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-4">
                <Settings className="w-5 h-5 text-sky-400 group-hover:rotate-45 transition-transform" />
                <span className="tracking-wider">{t.settings}</span>
              </div>
              <span className="text-xs font-mono-tech text-neutral-500 group-hover:text-sky-400">
                GRAFIKA & OVOZ
              </span>
            </button>

            {/* STATISTIKA (Stats) */}
            <button
              onClick={() => handleButtonClick(onOpenStats)}
              onMouseEnter={() => soundEngine.playUiHover()}
              className="group flex items-center justify-between px-6 py-3.5 bg-neutral-900/80 hover:bg-neutral-800/90 text-neutral-100 hover:text-white font-bold text-base rounded-lg border border-neutral-700/80 hover:border-sky-500/60 transition-all transform hover:translate-x-1.5 active:translate-x-0.5 cursor-pointer shadow-lg"
            >
              <div className="flex items-center gap-4">
                <BarChart3 className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wider">{t.stats}</span>
              </div>
              <span className="text-xs font-mono-tech text-neutral-500 group-hover:text-sky-400">
                PROFIL
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="absolute bottom-4 left-8 right-8 z-20 flex justify-between items-center text-xs text-neutral-500 font-mono-tech border-t border-neutral-800 pt-3">
        <div>TACTICAL STRIKE: UZ // ORIGINAL ENGINE</div>
        <div className="hidden sm:block">{t.controlsHint}</div>
        <div>WEBGL 3D // 60 FPS</div>
      </div>
    </div>
  );
};
