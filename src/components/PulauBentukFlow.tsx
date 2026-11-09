import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import type { PlayerData } from '../types';

// Asset gambar (hanya yang masih dipakai). Latar belakang, HUD, koin, bentuk, dan
// tombol kontrol digambar langsung (SVG/CSS) agar tajam dan selaras dengan logika game.
import charTriangleImg from '../assets/minigame/char-triangle.png';
import pauseBtnImg from '../assets/minigame/pause-btn.jpeg';

import { WATER_Y, WORLD_H, createPlayer, findPickups, isAtFlag, stepPlayer } from './pulauBentukEngine';
import type { CollectibleItem, InputState, ItemKind, Platform } from './pulauBentukEngine';
import {
  LEVELS,
  QUESTIONS_PER_LEVEL,
  STARS_TO_UNLOCK,
  STAR_RULES,
  TOTAL_LEVELS,
  getLevel,
  isLevelUnlocked,
  shapeItems,
  starsFromCorrect,
} from './pulauBentukLevels';
import type { LevelConfig, QuizVisual } from './pulauBentukLevels';

interface PulauBentukFlowProps {
  player: PlayerData;
  /** Level yang dipilih dari peta dunia */
  initialLevel: number;
  /** Bintang terbaik per level (0-3), disimpan oleh App */
  levelStars: Record<number, number>;
  onSaveLevelStars: (level: number, stars: number) => void;
  onClose: () => void;
  onWinReward: (stars: number, gems: number, exp: number) => void;
  showToast: (msg: string) => void;
  playSound: (freq?: number, type?: OscillatorType) => void;
}

type StageType = 'peta' | 'detail' | 'eksplorasi' | 'soal' | 'hasil';
const STAGE_ORDER: StageType[] = ['peta', 'detail', 'eksplorasi', 'soal', 'hasil'];

const INITIAL_COINS = 12;
const QUIZ_SECONDS = 45;
const POINTS_PER_CORRECT = 100;
const POINTS_PER_COLLECTIBLE = 10;
const Y_UNIT = WORLD_H / 100; // 1 unit y dunia = (1 / 1.8) % tinggi layar

// ==========================================================
// KOMPONEN GAMBAR KECIL (SVG)
// ==========================================================
const CoinIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="11" fill="#f59e0b" />
    <circle cx="12" cy="12" r="9" fill="#fcd34d" />
    <circle cx="12" cy="12" r="6.2" fill="none" stroke="#f59e0b" strokeWidth="1.6" />
    <path d="M7 8 Q10 5 15 6" stroke="#fffbeb" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>
);

const ShapeIcon: React.FC<{ kind: ItemKind }> = ({ kind }) => {
  switch (kind) {
    case 'tri':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <polygon points="20,4 37,35 3,35" fill="#fbbf24" stroke="#d97706" strokeWidth="2.4" strokeLinejoin="round" />
          <polygon points="20,10 30,30 12,26" fill="rgba(255,255,255,0.28)" />
        </svg>
      );
    case 'square':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="5" y="5" width="30" height="30" rx="4" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2.4" />
          <rect x="9" y="9" width="12" height="7" rx="2" fill="rgba(255,255,255,0.32)" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill="#ec4899" stroke="#be185d" strokeWidth="2.4" />
          <ellipse cx="14" cy="13" rx="6" ry="3.5" fill="rgba(255,255,255,0.32)" />
        </svg>
      );
    case 'rect':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="2.5" y="10" width="35" height="20" rx="3" fill="#10b981" stroke="#047857" strokeWidth="2.4" />
          <rect x="6" y="13" width="14" height="5" rx="2" fill="rgba(255,255,255,0.32)" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill="#ffffff" stroke="#ea580c" strokeWidth="3.2" />
          <path d="M20 9v11l7 4" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="20" cy="20" r="1.8" fill="#1e293b" />
        </svg>
      );
    case 'roof':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="26" y="6" width="6" height="12" fill="#991b1b" />
          <polygon points="20,6 38,30 2,30" fill="#ef4444" stroke="#b91c1c" strokeWidth="2.4" strokeLinejoin="round" />
          <polygon points="20,12 29,26 14,26" fill="rgba(255,255,255,0.25)" />
        </svg>
      );
    case 'tile':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="5" y="5" width="30" height="30" rx="2" fill="#bbf7d0" stroke="#16a34a" strokeWidth="2.4" />
          <path d="M20 5v30M5 20h30" stroke="#16a34a" strokeWidth="1.8" />
        </svg>
      );
    case 'door':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="9" y="3" width="22" height="34" rx="2.5" fill="#a16207" stroke="#713f12" strokeWidth="2.4" />
          <rect x="13" y="7" width="14" height="10" rx="1.5" fill="rgba(255,255,255,0.22)" />
          <circle cx="26" cy="22" r="2" fill="#facc15" />
        </svg>
      );
    case 'wheel':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#334155" strokeWidth="4" />
          <circle cx="20" cy="20" r="3" fill="#334155" />
          <path d="M20 6v28M6 20h28M10 10l20 20M30 10L10 30" stroke="#94a3b8" strokeWidth="1.4" />
        </svg>
      );
    default:
      return <CoinIcon size={40} />;
  }
};

// ==========================================================
// LATAR BELAKANG MINI GAME (SVG, koordinat dunia 100 x 180)
// ==========================================================
const Cloud: React.FC<{ x: number; y: number; s?: number; delay?: number }> = ({ x, y, s = 1, delay = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="mg-cloud-drift" style={{ animationDelay: `${delay}s` }}>
      <ellipse cx="0" cy="0" rx="9" ry="3.6" fill="#ffffff" opacity="0.92" />
      <ellipse cx="-4" cy="-2.4" rx="5" ry="3.4" fill="#ffffff" opacity="0.92" />
      <ellipse cx="3.5" cy="-3" rx="5.5" ry="3.8" fill="#ffffff" opacity="0.92" />
    </g>
  </g>
);

const Island: React.FC<{ p: Platform }> = ({ p }) => {
  const T = WORLD_H - p.top; // y SVG permukaan (sumbu y SVG ke bawah)
  const L = p.from - 2;
  const R = p.to + 2;
  const w = R - L;
  const cx = (L + R) / 2;
  const d = p.depth;
  const rock =
    `M ${L + 0.5} ${T + 2} L ${R - 0.5} ${T + 2} ` +
    `C ${R - 1} ${T + d * 0.4} ${R - w * 0.14} ${T + d * 0.8} ${cx + w * 0.12} ${T + d} ` +
    `Q ${cx} ${T + d + 2.5} ${cx - w * 0.12} ${T + d} ` +
    `C ${L + w * 0.14} ${T + d * 0.8} ${L + 1} ${T + d * 0.4} ${L + 0.5} ${T + 2} Z`;
  const clipId = `mg-clip-${p.id}`;
  const tufts: number[] = [];
  for (let x = L + 3; x < R - 2; x += 4.2) tufts.push(x);

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={rock} />
        </clipPath>
      </defs>
      <path d={rock} fill="url(#mg-rock)" />
      <g clipPath={`url(#${clipId})`} stroke="rgba(60,35,15,0.3)" strokeWidth="0.5" fill="none">
        <path d={`M ${L} ${T + d * 0.32} H ${R}`} />
        <path d={`M ${L} ${T + d * 0.58} H ${R}`} />
        <path d={`M ${cx - w * 0.2} ${T + 2} V ${T + d * 0.32}`} />
        <path d={`M ${cx + w * 0.22} ${T + d * 0.32} V ${T + d * 0.58}`} />
        <path d={`M ${cx - w * 0.08} ${T + d * 0.58} V ${T + d}`} />
      </g>
      <rect x={L - 0.5} y={T - 1.5} width={w + 1} height={5.2} rx={2.6} fill="url(#mg-grass)" />
      <rect x={L + 1} y={T - 1.1} width={w - 2} height={1.3} rx={0.65} fill="rgba(255,255,255,0.3)" />
      {tufts.map((x) => (
        <path key={x} d={`M ${x} ${T - 1.4} l 0.9 -1.6 l 0.9 1.6 z`} fill="#4ade80" />
      ))}
    </g>
  );
};

const SceneBackground: React.FC<{ level: LevelConfig }> = ({ level }) => {
  const platforms = level.platforms;
  const left = platforms[0];
  const fall = platforms[1] ?? platforms[0];
  const right = platforms[platforms.length - 1];
  const leftTop = WORLD_H - left.top;
  const rightTop = WORLD_H - right.top;
  const waterTop = WORLD_H - WATER_Y;
  const fallBottom = WORLD_H - (fall.top - fall.depth);
  const fallX = (fall.from + fall.to) / 2;
  const poleTop = rightTop - 26;
  const flagX = level.flagX;
  const tx = left.from + 4.2; // posisi pohon di pulau pertama

  return (
    <svg className="mg-scene" viewBox={`0 0 100 ${WORLD_H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="mg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f8fe8" />
          <stop offset="45%" stopColor="#6cc2f6" />
          <stop offset="100%" stopColor="#c9ecfc" />
        </linearGradient>
        <linearGradient id="mg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="mg-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9854a" />
          <stop offset="100%" stopColor="#6f4524" />
        </linearGradient>
        <linearGradient id="mg-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22a559" />
        </linearGradient>
        <linearGradient id="mg-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Langit */}
      <rect x="0" y="0" width="100" height={WORLD_H} fill="url(#mg-sky)" />
      <Cloud x={22} y={78} s={1.1} />
      <Cloud x={80} y={64} s={1.3} delay={2} />
      <Cloud x={58} y={104} s={0.9} delay={4} />
      <Cloud x={10} y={118} s={0.8} delay={1} />

      {/* Perbukitan jauh di cakrawala */}
      <path d={`M0 ${waterTop - 6} Q16 ${waterTop - 24} 32 ${waterTop - 8} T64 ${waterTop - 10} T100 ${waterTop - 16} V${waterTop + 2} H0 Z`} fill="#9bd7c6" opacity="0.7" />
      <path d={`M0 ${waterTop - 2} Q22 ${waterTop - 14} 44 ${waterTop - 3} T100 ${waterTop - 6} V${waterTop + 2} H0 Z`} fill="#6fc2ae" opacity="0.85" />

      {/* Air terjun dari bawah pulau kedua */}
      <rect x={fallX - 2.6} y={fallBottom - 2} width="5.2" height={waterTop - fallBottom + 2} fill="url(#mg-fall)" />
      <ellipse cx={fallX} cy={waterTop} rx="7.5" ry="2.6" fill="#ffffff" opacity="0.75" />

      {/* Air laut */}
      <rect x="0" y={waterTop} width="100" height={WORLD_H - waterTop} fill="url(#mg-water)" />
      <g stroke="#ffffff" strokeOpacity="0.38" strokeWidth="0.6" fill="none" strokeLinecap="round">
        <path d={`M0 ${waterTop + 4} Q5 ${waterTop + 2.6} 10 ${waterTop + 4} T20 ${waterTop + 4} T30 ${waterTop + 4} T40 ${waterTop + 4} T50 ${waterTop + 4} T60 ${waterTop + 4} T70 ${waterTop + 4} T80 ${waterTop + 4} T90 ${waterTop + 4} T100 ${waterTop + 4}`} />
        <path d={`M0 ${waterTop + 11} Q5 ${waterTop + 9.6} 10 ${waterTop + 11} T20 ${waterTop + 11} T30 ${waterTop + 11} T40 ${waterTop + 11} T50 ${waterTop + 11} T60 ${waterTop + 11} T70 ${waterTop + 11} T80 ${waterTop + 11} T90 ${waterTop + 11} T100 ${waterTop + 11}`} />
      </g>

      {/* Pulau-pulau melayang */}
      {platforms.map((p) => (
        <Island key={p.id} p={p} />
      ))}

      {/* Pohon di pulau pertama */}
      <g>
        <rect x={tx} y={leftTop - 9} width="1.7" height="9" fill="#7c4a21" />
        <circle cx={tx + 0.8} cy={leftTop - 13} r="5.2" fill="#2f9e57" />
        <circle cx={tx - 2.4} cy={leftTop - 10} r="3.8" fill="#38b36a" />
        <circle cx={tx + 4.2} cy={leftTop - 10} r="3.8" fill="#38b36a" />
      </g>

      {/* Bendera tujuan di pulau terakhir */}
      <g>
        <ellipse cx={flagX} cy={rightTop + 0.4} rx="3.6" ry="1.2" fill="#9ca3af" />
        <rect x={flagX - 0.4} y={poleTop} width="0.9" height="26" fill="#7c4a21" />
        <path d={`M ${flagX + 0.5} ${poleTop} L ${flagX + 10} ${poleTop + 3.6} L ${flagX + 0.5} ${poleTop + 7.2} Z`} fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

// ==========================================================
// ILUSTRASI SOAL
// ==========================================================
const QuizIllustration: React.FC<{ visual: QuizVisual }> = ({ visual }) => {
  if (visual === 'none') return null;

  const vertex = (x: number, y: number) => (
    <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
  );

  if (visual === 'triangle') {
    return (
      <div className="quiz-illustration-box">
        <svg width="170" height="130" viewBox="0 0 200 150" aria-label="Segitiga">
          <polygon points="100,16 176,132 24,132" fill="#fde68a" stroke="#d97706" strokeWidth="5" strokeLinejoin="round" />
          {[[100, 16], [176, 132], [24, 132]].map(([x, y]) => vertex(x, y))}
        </svg>
      </div>
    );
  }

  if (visual === 'square') {
    return (
      <div className="quiz-illustration-box">
        <svg width="150" height="130" viewBox="0 0 200 170" aria-label="Persegi">
          <rect x="45" y="20" width="110" height="110" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="5" strokeLinejoin="round" />
          {[[45, 20], [155, 20], [155, 130], [45, 130]].map(([x, y]) => vertex(x, y))}
        </svg>
      </div>
    );
  }

  if (visual === 'circle') {
    return (
      <div className="quiz-illustration-box">
        <svg width="150" height="130" viewBox="0 0 200 170" aria-label="Lingkaran">
          <circle cx="100" cy="75" r="58" fill="#fbcfe8" stroke="#be185d" strokeWidth="5" />
        </svg>
      </div>
    );
  }

  if (visual === 'clock') {
    return (
      <div className="quiz-illustration-box">
        <svg width="150" height="130" viewBox="0 0 200 170" aria-label="Jam dinding">
          <circle cx="100" cy="80" r="62" fill="#ffffff" stroke="#ea580c" strokeWidth="8" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line key={i} x1={100 + 50 * Math.sin(a)} y1={80 - 50 * Math.cos(a)} x2={100 + 56 * Math.sin(a)} y2={80 - 56 * Math.cos(a)} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            );
          })}
          <path d="M100 80V42M100 80l26 14" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="100" cy="80" r="5" fill="#1e293b" />
        </svg>
      </div>
    );
  }

  if (visual === 'tile') {
    return (
      <div className="quiz-illustration-box">
        <svg width="150" height="130" viewBox="0 0 200 170" aria-label="Ubin lantai">
          <rect x="40" y="15" width="120" height="120" fill="#bbf7d0" stroke="#16a34a" strokeWidth="5" />
          <path d="M100 15v120M40 75h120" stroke="#16a34a" strokeWidth="3" />
          <path d="M40 15l120 120" stroke="#16a34a" strokeWidth="0" />
        </svg>
      </div>
    );
  }

  if (visual === 'wheel') {
    return (
      <div className="quiz-illustration-box">
        <svg width="150" height="130" viewBox="0 0 200 170" aria-label="Roda sepeda">
          <circle cx="100" cy="80" r="62" fill="none" stroke="#334155" strokeWidth="9" />
          <circle cx="100" cy="80" r="8" fill="#334155" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1="100" y1="80" x2={100 + 56 * Math.sin(a)} y2={80 - 56 * Math.cos(a)} stroke="#94a3b8" strokeWidth="2.4" />;
          })}
        </svg>
      </div>
    );
  }

  // visual === 'roof': rumah dengan atap yang ditandai garis putus-putus
  const dash = { fill: 'none', stroke: '#7c3aed', strokeWidth: 3.5, strokeDasharray: '8 6', strokeLinejoin: 'round' as const };
  return (
    <div className="quiz-illustration-box">
      <svg width="180" height="150" viewBox="0 0 200 170" aria-label="Rumah">
        <ellipse cx="100" cy="158" rx="80" ry="10" fill="#86efac" opacity="0.6" />
        <rect x="126" y="26" width="13" height="30" fill="#991b1b" rx="2" />
        <polygon points="100,18 158,74 42,74" fill="#ef4444" stroke="#b91c1c" strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="62" y="74" width="76" height="76" fill="#fed7aa" stroke="#ea580c" strokeWidth="3.5" />
        <rect x="104" y="90" width="26" height="26" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2.5" rx="2" />
        <line x1="117" y1="90" x2="117" y2="116" stroke="#ffffff" strokeWidth="2" />
        <line x1="104" y1="103" x2="130" y2="103" stroke="#ffffff" strokeWidth="2" />
        <rect x="72" y="106" width="22" height="44" fill="#a16207" stroke="#713f12" strokeWidth="2.5" rx="2" />
        <circle cx="89" cy="130" r="2.4" fill="#facc15" />
        <polygon points="100,8 168,78 32,78" {...dash} />
      </svg>
    </div>
  );
};

// ==========================================================
// TOMBOL KONTROL (tahan untuk bergerak). Memakai pointer capture + pointercancel
// agar gerakan tidak "nyangkut" di layar sentuh.
// ==========================================================
const HoldButton: React.FC<{
  className: string;
  label: string;
  onHold: (on: boolean) => void;
  children: React.ReactNode;
}> = ({ className, label, onHold, children }) => (
  <button
    type="button"
    className={className}
    aria-label={label}
    title={label}
    onPointerDown={(e) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture tidak tersedia: tetap lanjut
      }
      onHold(true);
    }}
    onPointerUp={() => onHold(false)}
    onPointerCancel={() => onHold(false)}
    onLostPointerCapture={() => onHold(false)}
    onContextMenu={(e) => e.preventDefault()}
  >
    {children}
  </button>
);

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12H5M11 5l-7 7 7 7" />
  </svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h15M13 5l7 7-7 7" />
  </svg>
);
const ArrowUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V5M5 11l7-7 7 7" />
  </svg>
);

const StarsRow: React.FC<{ count: number; max?: number; className?: string }> = ({ count, max = 3, className }) => (
  <span className={className} aria-label={`${count} dari ${max} bintang`}>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={i < count ? 'star-lit' : 'star-off'}>★</span>
    ))}
  </span>
);

export const PulauBentukFlow: React.FC<PulauBentukFlowProps> = ({
  player,
  initialLevel,
  levelStars,
  onSaveLevelStars,
  onClose,
  onWinReward,
  showToast,
  playSound,
}) => {
  const [levelId, setLevelId] = useState<number>(initialLevel);
  const level = getLevel(levelId);
  const shapes = shapeItems(level);
  const totalShapes = shapes.length;
  const quizList = level.quiz;
  const bestStars = levelStars[level.id] ?? 0;

  const [stage, setStage] = useState<StageType>('detail');
  // Layar tertinggi yang sudah boleh dibuka pada percobaan ini (tab tidak bisa melompati alur)
  const [maxStageIdx, setMaxStageIdx] = useState<number>(1);
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);

  // ==========================================================
  // EKSPLORASI & MINI GAME
  // Posisi pemain disimpan di ref dan digerakkan oleh loop requestAnimationFrame.
  // ==========================================================
  const [coins, setCoins] = useState<number>(INITIAL_COINS);
  const [collectedItemIds, setCollectedItemIds] = useState<string[]>([]);
  const [facingRight, setFacingRight] = useState<boolean>(true);
  const [isHurt, setIsHurt] = useState<boolean>(false);
  const [splashX, setSplashX] = useState<number | null>(null);
  const [floatingFeedback, setFloatingFeedback] = useState<{ text: string; x: number; y: number } | null>(null);

  const gameRef = useRef(createPlayer(getLevel(initialLevel).platforms));
  const collectedRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false });
  const spriteRef = useRef<HTMLDivElement | null>(null);
  const atFlagRef = useRef<boolean>(false);
  const facingRef = useRef<boolean>(true);
  const lastStepSoundRef = useRef<number>(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);

  // Callback terbaru (playSound berubah identitas saat suara di-toggle)
  const cbRef = useRef({ playSound, showToast });
  useEffect(() => {
    cbRef.current = { playSound, showToast };
  });

  // Pastikan tab aktif selalu terlihat penuh di strip tab yang bisa digeser
  useEffect(() => {
    const box = tabsScrollRef.current;
    const active = box?.querySelector<HTMLElement>('.flow-tab-btn.active');
    if (!box || !active) return;
    const left = active.offsetLeft - box.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < box.scrollLeft) box.scrollTo({ left: Math.max(0, left - 8), behavior: 'smooth' });
    else if (right > box.scrollLeft + box.clientWidth) {
      box.scrollTo({ left: right - box.clientWidth + 8, behavior: 'smooth' });
    }
  }, [stage]);

  const collectedShapes = shapes.filter((s) => collectedItemIds.includes(s.id)).length;
  const allShapesCollected = collectedShapes >= totalShapes;

  const renderSprite = useCallback(() => {
    const el = spriteRef.current;
    if (!el) return;
    const p = gameRef.current;
    el.style.left = `${p.x}%`;
    el.style.bottom = `${p.y / Y_UNIT}%`;
  }, []);

  // Pasang posisi awal sprite sebelum digambar pertama kali
  useLayoutEffect(() => {
    if (stage === 'eksplorasi') renderSprite();
  }, [stage, renderSprite]);

  const showFeedback = useCallback((text: string, x: number, y: number) => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    setFloatingFeedback({ text, x, y });
    feedbackTimerRef.current = window.setTimeout(() => {
      setFloatingFeedback(null);
      feedbackTimerRef.current = null;
    }, 1400);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handlePickup = useCallback(
    (item: CollectibleItem) => {
      collectedRef.current.add(item.id);
      setCollectedItemIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      if (item.kind === 'coin') {
        cbRef.current.playSound(880, 'sine');
        setCoins((c) => c + item.value);
      } else {
        cbRef.current.playSound(980, 'triangle');
      }
      showFeedback(item.label, item.x, item.y + 8);
    },
    [showFeedback],
  );

  // Loop game: hanya berjalan di layar eksplorasi & saat tidak dijeda
  useEffect(() => {
    if (stage !== 'eksplorasi' || showPauseModal) return;
    let raf = 0;
    let last = 0;
    const platforms = level.platforms;
    const items = level.collectibles;
    const shapeIds = items.filter((c) => c.kind !== 'coin').map((c) => c.id);

    const tick = (now: number) => {
      const dt = last === 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const p = gameRef.current;
      const input = inputRef.current;
      const { playSound: play, showToast: toast } = cbRef.current;

      const events = stepPlayer(p, input, dt, platforms);
      for (const ev of events) {
        if (ev === 'jump') {
          play(620, 'triangle');
        } else if (ev === 'splash') {
          play(320, 'sine');
          toast('💧 Tercebur ke air! Kamu dikembalikan ke pulau yang aman.');
          setIsHurt(true);
          setSplashX(p.x);
        } else if (ev === 'respawn') {
          setIsHurt(false);
          setSplashX(null);
        }
      }

      if (p.facingRight !== facingRef.current) {
        facingRef.current = p.facingRight;
        setFacingRight(p.facingRight);
      }

      // Suara langkah kaki (dibatasi agar tidak membanjiri audio)
      if (p.grounded && p.hurtTimer <= 0 && (input.left || input.right) && now - lastStepSoundRef.current > 260) {
        lastStepSoundRef.current = now;
        play(p.facingRight ? 450 : 420);
      }

      for (const item of findPickups(p, collectedRef.current, items)) handlePickup(item);

      // Bendera hanya penanda tujuan; gerbang soal terbuka bila semua bentuk terkumpul
      const atFlag = isAtFlag(p, level.flagX, level.flagMinY);
      if (atFlag && !atFlagRef.current) {
        atFlagRef.current = true;
        const got = shapeIds.filter((id) => collectedRef.current.has(id)).length;
        play(1050, 'triangle');
        toast(
          got >= shapeIds.length
            ? '🚩 Semua bentuk terkumpul! Masuk ke soal.'
            : `🚩 Kumpulkan dulu semua bentuk (${got}/${shapeIds.length}) untuk membuka gerbang soal!`,
        );
      } else if (!atFlag) {
        atFlagRef.current = false;
      }

      renderSprite();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, showPauseModal, renderSprite, handlePickup, level]);

  // Keyboard (desktop): panah / WASD / spasi
  useEffect(() => {
    if (stage !== 'eksplorasi' || showPauseModal) return;
    const input = inputRef.current;
    const isLeft = (k: string) => k === 'ArrowLeft' || k === 'a' || k === 'A';
    const isRight = (k: string) => k === 'ArrowRight' || k === 'd' || k === 'D';
    const isJump = (k: string) => k === 'ArrowUp' || k === ' ' || k === 'w' || k === 'W';

    const onKeyDown = (e: KeyboardEvent) => {
      if (isLeft(e.key)) input.left = true;
      else if (isRight(e.key)) input.right = true;
      else if (isJump(e.key)) {
        if (!e.repeat) input.jump = true;
      } else return;
      e.preventDefault(); // cegah halaman ter-scroll / tombol terfokus ikut "klik"
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (isLeft(e.key)) input.left = false;
      else if (isRight(e.key)) input.right = false;
      else if (!isJump(e.key)) return;
      e.preventDefault();
    };
    const clear = () => {
      input.left = false;
      input.right = false;
      input.jump = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clear);
      clear(); // tombol yang sedang ditahan tidak boleh terbawa saat jeda / pindah layar
    };
  }, [stage, showPauseModal]);

  const resetExploration = useCallback(
    (lv: LevelConfig) => {
      gameRef.current = createPlayer(lv.platforms);
      collectedRef.current = new Set();
      atFlagRef.current = false;
      facingRef.current = true;
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jump = false;
      setCoins(INITIAL_COINS);
      setCollectedItemIds([]);
      setIsHurt(false);
      setSplashX(null);
      setFacingRight(true);
      setFloatingFeedback(null);
      renderSprite();
    },
    [renderSprite],
  );

  // ==========================================================
  // SOAL & HASIL
  // ==========================================================
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [wrongOptions, setWrongOptions] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number>(0); // jawaban benar pada percobaan pertama
  const [timeLeft, setTimeLeft] = useState<number>(QUIZ_SECONDS);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [passedBefore, setPassedBefore] = useState<boolean>(false); // level ini sudah pernah lulus (>= 2 bintang)
  const resultSavedRef = useRef<boolean>(false);
  const timeLeftRef = useRef<number>(QUIZ_SECONDS);

  const currentQuiz = quizList[questionIndex] ?? quizList[0];
  const starsEarned = starsFromCorrect(quizScore);
  const canContinue = starsEarned >= STARS_TO_UNLOCK;

  // Timer per soal: berhenti saat dijeda / sudah dijawab, dan benar-benar habis di 0
  useEffect(() => {
    if (stage !== 'soal' || showPauseModal || quizAnswered) return;
    const id = window.setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current === 0) {
        window.clearInterval(id);
        setQuizAnswered(true);
        cbRef.current.playSound(300, 'sawtooth');
        cbRef.current.showToast('⏰ Waktu habis! Baca penjelasannya ya.');
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage, showPauseModal, quizAnswered, questionIndex]);

  const resetTimer = () => {
    timeLeftRef.current = QUIZ_SECONDS;
    setTimeLeft(QUIZ_SECONDS);
  };

  const handleSelectQuizOption = (idx: number) => {
    if (quizAnswered || wrongOptions.includes(idx)) return;
    if (idx === currentQuiz.correctIndex) {
      playSound(880);
      setQuizAnswered(true);
      // Poin & bintang hanya untuk jawaban benar tanpa salah sebelumnya
      if (wrongOptions.length === 0) setQuizScore((s) => s + 1);
    } else {
      playSound(300, 'sawtooth');
      setWrongOptions((w) => [...w, idx]);
    }
  };

  const goStage = (s: StageType) => {
    setStage(s);
    setMaxStageIdx((m) => Math.max(m, STAGE_ORDER.indexOf(s)));
  };

  const handleNextQuiz = () => {
    playSound(520);
    if (questionIndex + 1 < quizList.length) {
      setQuestionIndex((prev) => prev + 1);
      setWrongOptions([]);
      setQuizAnswered(false);
      resetTimer();
    } else {
      // Semua soal selesai: simpan bintang terbaik (sekali per percobaan)
      if (!resultSavedRef.current) {
        resultSavedRef.current = true;
        setPassedBefore(bestStars >= STARS_TO_UNLOCK);
        onSaveLevelStars(level.id, starsFromCorrect(quizScore));
      }
      goStage('hasil');
    }
  };

  const resetQuiz = () => {
    setQuizScore(0);
    setQuestionIndex(0);
    setWrongOptions([]);
    setQuizAnswered(false);
    resultSavedRef.current = false;
    resetTimer();
  };

  /** Mulai (atau ulang) level dari layar detail: tujuan & misi ditampilkan dulu. */
  const startLevel = (id: number) => {
    const lv = getLevel(id);
    setLevelId(id);
    resetExploration(lv);
    resetQuiz();
    setPassedBefore(false);
    setMaxStageIdx(1);
    setStage('detail');
  };

  // Skor nyata: 100 poin / jawaban benar + 10 poin / benda yang dikumpulkan
  const finalScore = quizScore * POINTS_PER_CORRECT + collectedItemIds.length * POINTS_PER_COLLECTIBLE;

  const handleClaimReward = () => {
    if (!canContinue) return;
    playSound(950);
    if (!passedBefore) {
      showToast(`🎉 Level ${level.id} selesai! +${finalScore} Skor, +${level.rewardXp} XP`);
      onWinReward(finalScore, level.rewardGems, level.rewardXp);
      setPassedBefore(true);
    }
    const next = level.id + 1;
    if (next <= TOTAL_LEVELS) {
      startLevel(next);
    } else {
      showToast('🏝️ Pulau Bentuk selesai! Kamu hebat!');
      setStage('peta');
    }
  };

  const handleRetry = () => {
    playSound(500);
    resetExploration(level);
    resetQuiz();
    setPassedBefore(false);
    setMaxStageIdx(2);
    setStage('eksplorasi');
  };

  const showWrongHint = wrongOptions.length > 0 || quizAnswered;
  const worldPassed = LEVELS.filter((l) => (levelStars[l.id] ?? 0) >= STARS_TO_UNLOCK).length;

  const tabs: { stage: StageType; label: string }[] = [
    { stage: 'peta', label: '1. Peta Dunia' },
    { stage: 'detail', label: '2. Detail Level' },
    { stage: 'eksplorasi', label: '3. Eksplorasi 🎮' },
    { stage: 'soal', label: '4. Soal / Kuis' },
    { stage: 'hasil', label: '5. Hasil Level' },
  ];

  const renderMapNode = (lv: LevelConfig) => {
    const unlocked = isLevelUnlocked(lv.id, levelStars);
    const stars = levelStars[lv.id] ?? 0;
    if (!unlocked) {
      return (
        <button
          key={lv.id}
          type="button"
          className="map-node-button node-locked"
          onClick={() => {
            playSound(300, 'sawtooth');
            showToast(`🔒 Level ${lv.id} terkunci! Dapatkan minimal ${STARS_TO_UNLOCK} bintang di Level ${lv.id - 1}.`);
          }}
        >
          <span>🔒 {lv.id}</span>
        </button>
      );
    }
    return (
      <button
        key={lv.id}
        type="button"
        className="map-node-button node-active"
        onClick={() => {
          playSound(700);
          startLevel(lv.id);
        }}
      >
        <span className="node-num">{lv.id}</span>
        <StarsRow count={stars} className="node-stars" />
      </button>
    );
  };

  return (
    <div className="flow-container-fullscreen">
      {/* ==========================================================
          NAVIGASI TAHAPAN (tahap yang belum dicapai terkunci)
          ========================================================== */}
      <div className="flow-stage-tabs-header">
        <div className="flow-stage-tabs-scroll" ref={tabsScrollRef}>
          {tabs.map((t, idx) => (
            <button
              key={t.stage}
              type="button"
              className={`flow-tab-btn ${stage === t.stage ? 'active' : ''}`}
              disabled={idx > maxStageIdx && idx > 1}
              onClick={() => {
                playSound(480);
                setStage(t.stage);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="flow-rules-pill-btn"
          onClick={() => { playSound(620); setShowRuleModal(true); }}
        >
          📖 Panduan
        </button>

        <button
          type="button"
          className="flow-close-btn"
          onClick={onClose}
          title="Tutup Petualangan"
        >
          ✕
        </button>
      </div>

      {/* ==========================================================
          1. PETA DUNIA (PULAU BENTUK) - 3 level, terbuka bertahap
          ========================================================== */}
      {stage === 'peta' && (
        <div className="stage-screen-body stage-peta-view">
          <div className="game-top-bar-transparent">
            <div className="avatar-chip">
              <img src={player.avatar} alt="Avatar" className="chip-avatar-img" />
              <div className="chip-info">
                <span className="chip-name">{player.name}</span>
                <span className="chip-level">Level {player.level}</span>
              </div>
            </div>

            <div className="currency-pill star-pill">
              <span>⭐</span>
              <strong>{player.stars}</strong>
            </div>

            <div className="currency-pill gem-pill">
              <span>💎</span>
              <strong>{player.gems}</strong>
            </div>
          </div>

          <div className="stage-title-banner-wooden">
            <button type="button" className="round-back-btn" onClick={onClose}>
              ‹
            </button>
            <div className="wooden-banner-box">
              <span className="wooden-main-text">Pulau Bentuk</span>
              <span className="wooden-sub-text">Mengenal bentuk dasar</span>
            </div>
          </div>

          <div className="map-island-viewport">
            <div className="level-nodes-container">
              {renderMapNode(LEVELS[0])}

              <div className="map-character-avatar" onClick={() => playSound(650)}>
                <img
                  src={charTriangleImg}
                  alt="Si Segitiga"
                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                />
              </div>

              {LEVELS.slice(1).map((lv) => renderMapNode(lv))}
            </div>

            <div className="hadiah-dunia-card">
              <div className="hadiah-header">
                <strong>Hadiah Dunia</strong>
                <span className="progress-badge">{worldPassed}/{TOTAL_LEVELS}</span>
              </div>
              <div className="hadiah-shapes-row">
                <span style={{ color: '#f59e0b', fontSize: '18px' }}>▲</span>
                <span style={{ color: '#3b82f6', fontSize: '18px' }}>■</span>
                <span style={{ color: '#ec4899', fontSize: '18px' }}>●</span>
                <div className="hadiah-prog-bar">
                  <div className="prog-bar-fill" style={{ width: `${(worldPassed / TOTAL_LEVELS) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="screen-caption-footer">
            <strong>1. Peta Dunia:</strong> Pilih level. Level berikutnya terbuka jika kamu mendapat minimal {STARS_TO_UNLOCK} bintang. Dapat 1 bintang? Ulangi game-nya!
          </div>
        </div>
      )}

      {/* ==========================================================
          2. DETAIL LEVEL: TUJUAN GAME + MISI + ATURAN BINTANG
          ========================================================== */}
      {stage === 'detail' && (
        <div className="stage-screen-body stage-detail-view">
          <div className="detail-top-bar">
            <button type="button" className="round-back-btn" onClick={() => setStage('peta')}>
              ‹
            </button>
            <div className="top-counters">
              <div className="counter-chip">
                <span>⭐</span>
                <strong>{player.stars}</strong>
              </div>
              <div className="counter-chip">
                <CoinIcon size={18} />
                <strong>{coins}</strong>
              </div>
            </div>
          </div>

          <div className="detail-title-card">
            <div className="wooden-banner-box large-banner">
              <span className="wooden-main-text">Level {level.id}</span>
              <div className="blue-ribbon-tag">{level.name}</div>
            </div>
          </div>

          <div className="objective-white-card">
            <div className="detail-goal-head">
              <img src={charTriangleImg} alt="Si Segitiga" className="detail-goal-mascot" />
              <div className="tujuan-title">🎯 Tujuan Game</div>
            </div>
            <p className="tujuan-desc">{level.goal}</p>
            <p className="detail-capaian">📘 {level.capaian}</p>

            <div className="detail-star-row">
              <StarsRow count={bestStars} className="detail-stars" />
            </div>
            <div className="detail-best-note">
              {bestStars > 0 ? `Bintang terbaikmu: ${bestStars} dari 3` : 'Belum dimainkan'}
            </div>

            <div className="detail-badges-row">
              <span className={`badge-pill diff-${level.difficulty.toLowerCase()}`}>🔥 {level.difficulty}</span>
              <span className="badge-pill">🏝️ {level.platforms.length} pulau</span>
              <span className="badge-pill">🎯 {totalShapes} bentuk</span>
            </div>
          </div>

          <div className="detail-mission-card">
            <div className="tujuan-title">📜 Misi Petualangan</div>
            <p className="mission-desc">{level.mission}</p>
            <div className="mission-target-row">
              {shapes.map((s) => (
                <div key={s.id} className="mission-target-chip">
                  <div className="mission-target-icon">
                    <ShapeIcon kind={s.kind} />
                  </div>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
            <p className="mission-hint">Kumpulkan semua bentuk untuk membuka gerbang soal.</p>
          </div>

          <div className="detail-howto-card">
            <div className="tujuan-title">🕹️ Cara Bermain</div>
            <ul className="howto-list">
              <li>Tahan tombol ◀ ▶ untuk berjalan dan tombol ▲ untuk meloncat antar pulau.</li>
              <li>Hati-hati, jangan jatuh ke air! Kamu akan kembali ke pulau yang aman.</li>
              <li>Setelah semua bentuk terkumpul, jawab {QUESTIONS_PER_LEVEL} soal.</li>
            </ul>
            <div className="star-rule-row">
              {STAR_RULES.map((r) => (
                <div key={r.correct} className="star-rule-chip">
                  <StarsRow count={r.stars} className="star-rule-stars" />
                  <span>{r.correct}</span>
                </div>
              ))}
            </div>
            <p className="mission-hint">
              Dapatkan minimal {STARS_TO_UNLOCK} bintang untuk membuka level berikutnya. Jika hanya 1 bintang, ulangi game-nya.
            </p>
          </div>

          <div className="detail-action-footer">
            <button
              type="button"
              className="btn-mulai-glossy"
              onClick={() => {
                playSound(800, 'triangle');
                goStage('eksplorasi');
              }}
            >
              Mulai Petualangan 🎮
            </button>
          </div>

          <div className="screen-caption-footer">
            <strong>2. Detail Level:</strong> Baca tujuan game, misi, dan aturan bintang. Tekan Mulai untuk bermain!
          </div>
        </div>
      )}

      {/* ==========================================================
          3. EKSPLORASI & KUMPULKAN (MINI GAME)
          ========================================================== */}
      {stage === 'eksplorasi' && (
        <div className="stage-screen-body stage-eksplorasi-view">
          <div className="mg-frame">
            <SceneBackground level={level} />

            {/* HUD atas */}
            <div className="mg-hud-top">
              <button
                type="button"
                className="mg-pause-btn"
                aria-label="Jeda game"
                title="Jeda Game"
                onClick={() => {
                  playSound(500);
                  setShowPauseModal(true);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
                  <rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor" />
                </svg>
              </button>
              <div className="mg-hud-spacer" />
              <div className="mg-pill" title="Koin terkumpul">
                <CoinIcon size={20} />
                <span>{coins}</span>
              </div>
            </div>

            {/* Kartu misi level */}
            <div className="mg-mission-card">
              <div className="mg-mission-title">{level.missionShort}</div>
              <div className={`mg-mission-row ${totalShapes > 4 ? 'dense' : ''}`}>
                {shapes.map((s) => (
                  <div
                    key={s.id}
                    title={s.name}
                    className={`mg-shape-slot ${collectedItemIds.includes(s.id) ? 'found' : ''}`}
                  >
                    <ShapeIcon kind={s.kind} />
                  </div>
                ))}
                <div className="mg-mission-count">
                  {collectedShapes}/{totalShapes}
                </div>
              </div>
            </div>

            {/* Benda yang bisa dikumpulkan (hilang setelah diambil) */}
            {level.collectibles.filter((it) => !collectedItemIds.includes(it.id)).map((it) => (
              <div
                key={it.id}
                className="mg-item"
                style={{ left: `${it.x}%`, bottom: `${it.y / Y_UNIT}%` }}
              >
                <div className="mg-item-inner">
                  <ShapeIcon kind={it.kind} />
                </div>
              </div>
            ))}

            {/* Karakter "Si Segitiga" (posisi diatur oleh loop game lewat ref) */}
            <div
              ref={spriteRef}
              className={`mg-player ${facingRight ? '' : 'flip'} ${isHurt ? 'hurt' : ''}`}
              onClick={() => {
                inputRef.current.jump = true;
              }}
              title="Si Segitiga Petualang (tekan untuk loncat!)"
            >
              <img src={charTriangleImg} alt="Si Segitiga" draggable={false} />
            </div>

            {/* Efek cipratan saat tercebur */}
            {splashX !== null && (
              <div
                className="mg-splash"
                style={{ left: `${splashX}%`, bottom: `${(WATER_Y + 2) / Y_UNIT}%` }}
              >
                💦 SPLASH!
              </div>
            )}

            {/* Umpan balik saat mengambil benda */}
            {floatingFeedback && (
              <div
                className="mg-feedback"
                style={{
                  left: `${Math.max(22, Math.min(78, floatingFeedback.x))}%`,
                  bottom: `${floatingFeedback.y / Y_UNIT}%`,
                }}
              >
                {floatingFeedback.text}
              </div>
            )}

            {/* Tombol kontrol */}
            <HoldButton
              className="mg-ctrl mg-ctrl-left"
              label="Geser kiri (tahan)"
              onHold={(on) => {
                inputRef.current.left = on;
              }}
            >
              <ArrowLeft />
            </HoldButton>
            <HoldButton
              className="mg-ctrl mg-ctrl-right"
              label="Geser kanan (tahan)"
              onHold={(on) => {
                inputRef.current.right = on;
              }}
            >
              <ArrowRight />
            </HoldButton>
            <HoldButton
              className="mg-ctrl mg-ctrl-jump"
              label="Loncat"
              onHold={(on) => {
                if (on) inputRef.current.jump = true;
              }}
            >
              <ArrowUp />
            </HoldButton>

            {/* Gerbang soal: hanya terbuka bila SEMUA bentuk target terkumpul */}
            {allShapesCollected && (
              <div className="stage-checkpoint-finish-banner">
                <button
                  type="button"
                  className="btn-lanjut-soal-banner"
                  onClick={() => {
                    playSound(750);
                    showToast('🚀 Gerbang soal terbuka! Jawab 5 soal ya.');
                    goStage('soal');
                  }}
                >
                  🏁 Semua Bentuk Terkumpul! Masuk Soal ➔
                </button>
              </div>
            )}
          </div>

          <div className="screen-caption-footer">
            <strong>3. Eksplorasi & Kumpulkan:</strong> Tahan tombol arah & tekan loncat. Kumpulkan {totalShapes} bentuk target untuk membuka gerbang soal!
          </div>
        </div>
      )}

      {/* ==========================================================
          4. SOAL / TANTANGAN
          ========================================================== */}
      {stage === 'soal' && (
        <div className="stage-screen-body stage-soal-view">
          <div className="quiz-top-bar">
            <button
              type="button"
              className="round-pause-btn"
              aria-label="Jeda game"
              onClick={() => {
                playSound(500);
                setShowPauseModal(true);
              }}
            >
              ⏸
            </button>
            <div className="timer-pill">
              ⏱️ <strong>{timeLeft}s</strong>
            </div>
            <div className="quiz-prog-indicator">
              <strong>
                {questionIndex + 1}/{quizList.length}
              </strong>
            </div>
          </div>

          <div className="quiz-top-progress-bar">
            <div
              className="prog-fill"
              style={{ width: `${((questionIndex + 1) / quizList.length) * 100}%` }}
            />
          </div>

          <div className="quiz-main-card">
            <div className="quiz-level-tag">Level {level.id} • Soal {questionIndex + 1}/{quizList.length}</div>
            <h3 className="quiz-header-text">{currentQuiz.question}</h3>

            <QuizIllustration visual={currentQuiz.visual} />

            <div className="quiz-options-group">
              {currentQuiz.options.map((opt, idx) => {
                const isCorrect = idx === currentQuiz.correctIndex;
                const isWrong = wrongOptions.includes(idx);

                let optClass = 'quiz-styled-option-btn';
                if (quizAnswered && isCorrect) optClass += ' option-state-correct';
                else if (isWrong) optClass += ' option-state-wrong';

                return (
                  <button
                    key={opt.label}
                    type="button"
                    className={optClass}
                    style={{ borderLeft: `6px solid ${opt.color}` }}
                    disabled={quizAnswered || isWrong}
                    onClick={() => handleSelectQuizOption(idx)}
                  >
                    <span
                      className="opt-shape-symbol"
                      style={{ color: opt.color, fontSize: opt.picture ? '34px' : undefined }}
                    >
                      {opt.icon}
                    </span>
                    <span className="opt-shape-name">{opt.label}</span>
                    {quizAnswered && isCorrect && <span className="opt-check-badge">✔</span>}
                  </button>
                );
              })}
            </div>

            {showWrongHint && (
              <div className="quiz-explanation-box">
                {!quizAnswered && <p className="explanation-text"><strong>Belum tepat, coba lagi ya!</strong></p>}
                <p className="explanation-text">{currentQuiz.explanation}</p>
                {quizAnswered && (
                  <button type="button" className="btn-next-question" onClick={handleNextQuiz}>
                    {questionIndex + 1 < quizList.length ? 'Soal Berikutnya ➔' : 'Lihat Hasil Level 🏆'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="screen-caption-footer">
            <strong>4. Soal / Tantangan:</strong> Jawab benar pada percobaan pertama untuk mendapat bintang. Jika salah, ada penjelasan dan kesempatan mencoba lagi!
          </div>
        </div>
      )}

      {/* ==========================================================
          5. HASIL LEVEL: BINTANG + SYARAT BUKA LEVEL BERIKUTNYA
          ========================================================== */}
      {stage === 'hasil' && (
        <div className="stage-screen-body stage-hasil-view">
          <div className="confetti-sky-layer">
            <span className="confetti c1">{canContinue ? '🎊' : '💪'}</span>
            <span className="confetti c2">✨</span>
            <span className="confetti c3">{canContinue ? '🎉' : '📘'}</span>
            <span className="confetti c4">⭐</span>
          </div>

          <div className="victory-stars-banner">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`big-glowing-star ${i === 1 ? 's2' : ''} ${i < starsEarned ? '' : 'off'}`}
              >
                ★
              </span>
            ))}
          </div>

          <div className={`victory-title-ribbon ${canContinue ? '' : 'retry'}`}>
            {starsEarned === 3 ? 'Sempurna!' : canContinue ? 'Level Selesai!' : starsEarned === 1 ? 'Hampir Berhasil!' : 'Ayo Coba Lagi!'}
          </div>

          <div className="victory-mascot-center">
            <img
              src={charTriangleImg}
              alt="Mascot"
              style={{
                width: '110px',
                height: '110px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
              }}
            />
          </div>

          <div className="victory-score-card">
            <div className="score-row">
              <div className="score-item">
                <span className="score-icon check-circle">✔</span>
                <span className="score-label">Jawaban benar</span>
                <strong className="score-val text-green">
                  {quizScore} / {quizList.length}
                </strong>
              </div>
            </div>

            <div className="score-row">
              <div className="score-item">
                <span className="score-icon">⭐</span>
                <span className="score-label">Skor</span>
                <strong className="score-val">{finalScore}</strong>
              </div>
            </div>

            <div className="score-row">
              <div className="score-item">
                <span className="score-icon"><CoinIcon size={20} /></span>
                <span className="score-label">Koin</span>
                <strong className="score-val">+{coins - INITIAL_COINS}</strong>
              </div>
            </div>

            <div className="score-row">
              <div className="score-item">
                <span className="score-icon xp-circle">XP</span>
                <span className="score-label">XP</span>
                <strong className="score-val text-purple">
                  {canContinue && !passedBefore ? `+${level.rewardXp}` : '-'}
                </strong>
              </div>
            </div>
          </div>

          <p className={`result-note ${canContinue ? 'ok' : 'retry'}`}>
            {canContinue
              ? level.id < TOTAL_LEVELS
                ? `🔓 Level ${level.id + 1} terbuka! Kamu mendapat ${starsEarned} bintang.`
                : '🏝️ Hebat! Semua level di Pulau Bentuk selesai.'
              : `Kamu baru mendapat ${starsEarned} bintang. Butuh minimal ${STARS_TO_UNLOCK} bintang (4 jawaban benar) untuk lanjut. Ulangi game-nya ya!`}
          </p>

          <div className="victory-action-buttons">
            {canContinue ? (
              <>
                <button type="button" className="btn-lanjutkan-green" onClick={handleClaimReward}>
                  {level.id < TOTAL_LEVELS ? `Lanjut ke Level ${level.id + 1} ➔` : 'Selesai ➔'}
                </button>
                <button type="button" className="btn-ulangi-outline" onClick={handleRetry}>
                  🔄 Ulangi untuk Bintang Lebih Banyak
                </button>
              </>
            ) : (
              <button type="button" className="btn-lanjutkan-green" onClick={handleRetry}>
                🔄 Ulangi Game
              </button>
            )}
          </div>

          <div className="screen-caption-footer">
            <strong>5. Hasil Level:</strong> 2 benar = 1 bintang, 4 benar = 2 bintang, 5 benar = 3 bintang. Minimal {STARS_TO_UNLOCK} bintang untuk membuka level berikutnya.
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL PAUSE (menyesuaikan layar yang sedang aktif)
          ========================================================== */}
      {showPauseModal && (
        <div className="modal-overlay" onClick={() => setShowPauseModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={pauseBtnImg} alt="Pause" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                <h2 style={{ margin: 0 }}>Game Dijeda</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowPauseModal(false)}>✕</button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button type="button" className="btn-primary" onClick={() => setShowPauseModal(false)}>
                Lanjutkan Permainan ▶
              </button>
              {stage === 'eksplorasi' && (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowPauseModal(false);
                      resetExploration(level);
                      showToast('🔄 Eksplorasi diulang dari awal!');
                    }}
                  >
                    🔄 Ulangi Eksplorasi
                  </button>
                  {allShapesCollected && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowPauseModal(false);
                        goStage('soal');
                      }}
                    >
                      Masuk Soal Tantangan ➔
                    </button>
                  )}
                </>
              )}
              {stage === 'soal' && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowPauseModal(false);
                    resetQuiz();
                    showToast('🔄 Soal diulang dari awal!');
                  }}
                >
                  🔄 Ulangi Soal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: PANDUAN, CONTOH SOAL, DAN ATURAN BINTANG
          ========================================================== */}
      {showRuleModal && (
        <div className="modal-overlay" onClick={() => setShowRuleModal(false)}>
          <div className="modal-card wide-card rule-modal-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>📋</span>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Panduan Level {level.id}</h2>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setShowRuleModal(false)}>✕</button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '72vh' }}>
              <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '16px', padding: '14px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0369a1' }}>
                  Soal di {level.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {quizList.map((q, i) => (
                    <div key={q.question} style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '12px', border: '1px solid #e0f2fe', fontSize: '13px', fontWeight: 700 }}>
                      {i + 1}. {q.question}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '14px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#15803d' }}>
                  Aturan Bintang & Level
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  {STAR_RULES.map((r) => (
                    <div key={r.correct} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                      <span>✔ {r.correct}</span>
                      <strong style={{ color: '#ca8a04' }}>{'⭐'.repeat(r.stars)}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                    <span>🔓 Buka level berikutnya</span>
                    <strong style={{ color: '#16a34a' }}>minimal {STARS_TO_UNLOCK} bintang</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                    <span>🔁 Hanya 1 bintang</span>
                    <strong style={{ color: '#dc2626' }}>harus ulangi game</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                    <span>✔ Jawaban benar</span>
                    <strong style={{ color: '#16a34a' }}>+100 poin</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                    <span>❌ Jawaban salah</span>
                    <span style={{ color: '#dc2626' }}>0 poin (ada penjelasan & coba lagi)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #dcfce7' }}>
                    <span>🔺 Bonus eksplorasi</span>
                    <strong style={{ color: '#ca8a04' }}>+10 poin / benda</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>💧 Jatuh ke air</span>
                    <span style={{ color: '#15803d' }}>Tidak ada hukuman (kembali ke pulau aman)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => setShowRuleModal(false)}>
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
