import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerData, Mission, TabType } from '../types';
import { IslandDetailModal } from './IslandDetailModal';
import { KoleksiModal } from './KoleksiModal';
import { DailyMissionModal } from './DailyMissionModal';
import { PulauBentukFlow } from './PulauBentukFlow';
import { TopHud } from './TopHud';
import { LEVELS, STARS_TO_UNLOCK, isLevelUnlocked } from './pulauBentukLevels';
import {
  ASSET, BANNERS, BOTTOM, DIGIT_OFFSET, LOCKED_NODES, NAV, NUMBER_FIXES,
  PLAYABLE_NODES, STAR_OFFSETS, STAR_ROT, at, box, centered, u,
  HERO_POSITIONS, MAP_PATH_SEGMENTS,
} from './petaLayout';
import './PetaScreen.css';

import bgSky from '../assets/peta/bg-sky.jpg';
import island1 from '../assets/peta/island-1.png';
import island2 from '../assets/peta/island-2.png';
import island3 from '../assets/peta/island-3.png';
import island4 from '../assets/peta/island-4.png';
import island5 from '../assets/peta/island-5.png';
import nodeActive from '../assets/peta/node-active.png';
import nodeNormal from '../assets/peta/node-normal.png';
import nodeLocked from '../assets/peta/node-locked.png';
import heroImg from '../assets/peta/hero.png';
import starOn from '../assets/peta/star-on.png';
import starOff from '../assets/peta/star-off.png';
import koleksiImg from '../assets/peta/koleksi.png';
import navHome from '../assets/peta/nav-home.png';
import navPeta from '../assets/peta/nav-peta.png';
import navPrestasi from '../assets/peta/nav-prestasi.png';
import navMateri from '../assets/peta/nav-materi.png';
import navProfil from '../assets/peta/nav-profil.png';

interface PetaScreenProps {
  player: PlayerData;
  mission: Mission;
  onBack: () => void;
  onNavigateTab: (tab: TabType) => void;
  levelStars: Record<number, number>;
  onSaveLevelStars: (level: number, stars: number) => void;
  onAddStars: (amount: number) => void;
  onAddGems: (amount: number) => void;
  onWinReward?: (stars: number, gems: number, exp: number) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenMateri: () => void;
  onOpenPrestasi: () => void;
  showToast: (msg: string) => void;
  playSound: (freq?: number, type?: OscillatorType) => void;
}

type NodeState = 'locked' | 'normal' | 'active';
const NODE_IMG: Record<NodeState, string> = { locked: nodeLocked, normal: nodeNormal, active: nodeActive };
const NAV_GLYPHS: [readonly [number, number, number, number], string][] = [
  [ASSET.navHome, navHome], [ASSET.navPeta, navPeta], [ASSET.navPrestasi, navPrestasi], [ASSET.navMateri, navMateri], [ASSET.navProfil, navProfil],
];
const NODE_HIT = 76; // area ketuk node = diameter lingkarannya (sprite 130x130 hanya visual)

export const PetaScreen: React.FC<PetaScreenProps> = ({
  player, mission, onBack, onNavigateTab, levelStars, onSaveLevelStars, onAddStars, onAddGems,
  onWinReward, onOpenProfile, onOpenSettings, onOpenMateri, onOpenPrestasi, showToast, playSound,
}) => {
  const [selectedIsland, setSelectedIsland] = useState<number | null>(null);
  const [showKoleksi, setShowKoleksi] = useState(false);
  const [showMission, setShowMission] = useState(false);
  const [showPulauBentukFlow, setShowPulauBentukFlow] = useState(false);
  const [flowLevel, setFlowLevel] = useState<number>(1);
  const [shakingNode, setShakingNode] = useState<string | null>(null);
  const [characterBubble, setCharacterBubble] = useState<string | null>(null);

  // Timer disimpan di ref: klik beruntun tidak lagi saling menimpa dan timer dibersihkan saat layar ditutup.
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
  }, []);

  const handleLockedClick = useCallback((nodeId: string, levelName: string, hint?: string) => {
    playSound(260, 'sawtooth');
    setShakingNode(nodeId);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShakingNode(null), 500);
    showToast(hint || `🔒 ${levelName} masih terkunci! Selesaikan level sebelumnya terlebih dahulu.`);
  }, [playSound, showToast]);

  // Level pertama yang belum lulus (< 2 bintang) = level yang disarankan untuk dimainkan
  const nextLevel =
    LEVELS.find((l) => (levelStars[l.id] ?? 0) < STARS_TO_UNLOCK)?.id ?? LEVELS[LEVELS.length - 1].id;

  // Level aktif pemain di Pulau Bentuk (1-3) untuk posisi karakter orang keju
  const currentHeroLevel = Math.min(3, Math.max(1, player.level || nextLevel));
  const heroPos = HERO_POSITIONS[currentHeroLevel] || HERO_POSITIONS[1];

  const prevHeroLevelRef = useRef<number>(currentHeroLevel);
  const [isWalking, setIsWalking] = useState(false);

  useEffect(() => {
    if (prevHeroLevelRef.current !== currentHeroLevel) {
      playSound(680, 'triangle');
      setIsWalking(true);
      const timer = setTimeout(() => setIsWalking(false), 900);
      prevHeroLevelRef.current = currentHeroLevel;
      return () => clearTimeout(timer);
    }
  }, [currentHeroLevel, playSound]);

  const openLevel = (levelNum: number) => {
    if (!isLevelUnlocked(levelNum, levelStars)) {
      handleLockedClick(
        `lvl-${levelNum}`,
        `Level ${levelNum}`,
        `🔒 Level ${levelNum} terkunci! Dapatkan minimal ${STARS_TO_UNLOCK} bintang di Level ${levelNum - 1} untuk membukanya.`,
      );
      return;
    }
    playSound(750 + levelNum * 50);
    setFlowLevel(levelNum);
    setShowPulauBentukFlow(true);
  };

  const handleCharacterClick = () => {
    playSound(720, 'triangle');
    const quotesByLevel: Record<number, string[]> = {
      1: [
        `👋 Semangat ${player.name}! Ayo taklukkan Level 1 di Pulau Bentuk!`,
        `🎒 Siap berpetualang ${player.name}? Sentuh Level 1 untuk mulai!`,
        `⭐ Dapatkan minimal 2 bintang di Level 1 untuk membuka Level 2!`,
      ],
      2: [
        `🎉 Keren! Kamu sekarang ada di Level 2! Ayo lanjut!`,
        `✨ Level 2 tantangannya lebih seru! Siap melanjutkan petualangan, ${player.name}?`,
        `⭐ Kumpulkan 2 bintang lagi di Level 2 untuk membuka Level 3!`,
      ],
      3: [
        `🏆 Luar biasa ${player.name}! Kamu sudah sampai di Level 3!`,
        `👑 Selesaikan Level 3 dengan bintang penuh untuk menjadi Master Geometri!`,
        `🚀 Ayo selesaikan petualangan di Pulau Bentuk sekarang!`,
      ],
    };
    const list = quotesByLevel[currentHeroLevel] || quotesByLevel[1];
    setCharacterBubble(list[Math.floor(Math.random() * list.length)]);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setCharacterBubble(null), 3500);
  };

  const sound = (f: number, fn: () => void) => () => { playSound(f); fn(); };

  const A = ASSET;

  return (
    <div className="peta-screen">
      {/* Latar langit bersih (tanpa pulau/UI), ikut skala panggung agar garis putus-putus tetap nyambung */}
      <div className="peta-sky" aria-hidden="true" />

      {/* ============ PANGGUNG TENGAH: pulau, node, karakter ============ */}
      <div className="peta-stage">
        <img className="peta-bg" src={bgSky} alt="" draggable={false} />

        <img className="peta-img" style={box(...A.island1)} src={island1} alt="Pulau Bentuk" draggable={false} />
        <img className="peta-img" style={box(...A.island2)} src={island2} alt="Hutan Segi Empat" draggable={false} />
        <img className="peta-img" style={box(...A.island3)} src={island3} alt="Pegunungan Segitiga" draggable={false} />
        <img className="peta-img" style={box(...A.island4)} src={island4} alt="Danau Lingkaran" draggable={false} />
        <img className="peta-img" style={box(...A.island5)} src={island5} alt="Kastil Geometri" draggable={false} />

        {/* Garis putus-putus rute jalan pulau, berfungsi sebagai penanda pemain menuju level berikutnya */}
        <svg className="peta-paths-svg" viewBox="0 0 941 1672" aria-hidden="true">
          <defs>
            <filter id="peta-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.9" />
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fde047" floodOpacity="0.8" />
            </filter>
          </defs>
          {MAP_PATH_SEGMENTS.map((seg) => {
            const isCompleted =
              seg.toLevel <= currentHeroLevel &&
              (seg.fromLevel === 0 || (levelStars[seg.fromLevel] ?? 0) >= STARS_TO_UNLOCK);
            const isActive = seg.fromLevel === currentHeroLevel;
            const isLocked = !isCompleted && !isActive;

            return (
              <g
                key={seg.id}
                className={`peta-path-segment ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''} ${isLocked ? 'is-locked' : ''}`}
              >
                {/* Bayangan jalan di bawah garis putus-putus */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke="rgba(15, 35, 20, 0.32)"
                  strokeWidth="10"
                  strokeDasharray="12 14"
                  strokeLinecap="round"
                />
                {/* Garis putih utama (animasi marching bergeser bila aktif menuju level berikutnya) */}
                <path
                  d={seg.d}
                  fill="none"
                  className="path-stroke"
                  stroke={isActive ? '#ffffff' : isCompleted ? '#ffffff' : 'rgba(255, 255, 255, 0.45)'}
                  strokeWidth="6.5"
                  strokeDasharray="12 14"
                  strokeLinecap="round"
                  filter={isActive ? 'url(#peta-glow)' : undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* Perbaikan angka ganda Pulau 2 */}
        {NUMBER_FIXES.map((f) => (
          <div key={f.n} className="peta-patch" style={centered(f.x, f.y, 40, 30)} aria-hidden="true">
            <span style={{ fontSize: u(33) }}>{f.n}</span>
          </div>
        ))}

        {/* Level 1-3: status & bintang mengikuti progres sebenarnya */}
        {PLAYABLE_NODES.map(({ id, x, y }) => {
          const stars = Math.min(3, Math.max(0, levelStars[id] ?? 0));
          const unlocked = isLevelUnlocked(id, levelStars);
          const state: NodeState = !unlocked ? 'locked' : stars >= STARS_TO_UNLOCK ? 'active' : 'normal';
          const [dx, dy] = DIGIT_OFFSET[state];
          const isNext = unlocked && id === nextLevel;
          return (
            <React.Fragment key={id}>
              <div className={`peta-stars ${unlocked ? '' : 'is-dim'}`} aria-hidden="true">
                {STAR_OFFSETS.map(([ox, oy], i) => {
                  const on = i < stars;
                  const s = on ? 40 : 37;
                  return (
                    <img
                      key={i}
                      className="peta-img"
                      style={{ ...centered(x + ox, y + oy, s, s), transform: `rotate(${STAR_ROT[i]}deg)` }}
                      src={on ? starOn : starOff}
                      alt=""
                      draggable={false}
                    />
                  );
                })}
              </div>
              {isNext && <div className="peta-ring active-level-pulse" style={centered(x, y + 3, 78, 78)} aria-hidden="true" />}
              <button
                type="button"
                className={`peta-hit peta-node ${shakingNode === `lvl-${id}` ? 'shake-animation' : ''}`}
                style={centered(x, y, NODE_HIT, NODE_HIT)}
                onClick={() => openLevel(id)}
                aria-label={`Level ${id}${unlocked ? '' : ' (terkunci)'}${stars ? `, ${stars} bintang` : ''}`}
                title={`Level ${id}${unlocked ? '' : ' (Terkunci)'}`}
              >
                <img className="peta-node-img" src={NODE_IMG[state]} alt="" draggable={false} />
                <span
                  className="peta-digit"
                  style={{ left: `calc(50% + ${u(dx)})`, top: `calc(50% + ${u(dy)})`, fontSize: u(34) }}
                >
                  {id}
                </span>
              </button>
            </React.Fragment>
          );
        })}

        {/* Node terkunci pulau 2-5: gambar sudah ada di pulau, di sini hanya area ketuk */}
        {LOCKED_NODES.map((nd) => (
          <button
            key={nd.n}
            type="button"
            className={`peta-hit ${shakingNode === `node-${nd.n}` ? 'shake-animation' : ''}`}
            style={centered(nd.x, nd.y + 2, 58, 58)}
            onClick={() => handleLockedClick(`node-${nd.n}`, `Level ${nd.n}`, nd.hint)}
            aria-label={`Level ${nd.n} (terkunci)`}
            title={`Level ${nd.n} (Terkunci)`}
          />
        ))}

        {/* Banner pulau */}
        {BANNERS.map((b) => (
          <button
            key={b.id}
            type="button"
            className="peta-hit"
            style={box(...b.rect)}
            onClick={sound(620, () => setSelectedIsland(b.id))}
            aria-label={b.name}
            title={b.name}
          />
        ))}

        {/* Si Segitiga (orang keju) berjalan sesuai level pemain */}
        <div
          className={`peta-hero-wrapper ${isWalking ? 'is-walking' : ''}`}
          style={box(...heroPos.box)}
        >
          <img className="peta-img peta-hero" src={heroImg} alt="Si Segitiga Petualang" draggable={false} />
          <button
            type="button"
            className="peta-hit peta-hero-hit"
            onClick={handleCharacterClick}
            aria-label="Si Segitiga Petualang"
            title="Si Segitiga Petualang"
          />
        </div>
        {characterBubble && (
          <div
            className="peta-bubble"
            style={{ ...at(...heroPos.bubble), maxWidth: '50%', fontSize: u(22) }}
            role="status"
          >
            {characterBubble}
          </div>
        )}
      </div>

      {/* ============ HUD ATAS (menempel ke tepi atas layar) ============ */}
      <TopHud
        player={player}
        mission={mission}
        showBackAndTitle
        onBack={onBack}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onOpenMission={() => setShowMission(true)}
        onAddStars={onAddStars}
        onAddGems={onAddGems}
        playSound={playSound}
        showToast={showToast}
      />

      {/* ============ BAWAH (menempel ke tepi bawah layar) ============ */}
      <div className="peta-group peta-bottom">
        <img className="peta-img" style={box(...A.koleksi, BOTTOM)} src={koleksiImg} alt="" draggable={false} />
        <button type="button" className="peta-hit" style={box(10, 1322, 292, 138, BOTTOM)} onClick={sound(680, () => setShowKoleksi(true))} aria-label="Koleksi bentuk" title="Koleksi Bentuk (8/24)" />

        <nav className="peta-nav" style={box(...NAV.bar, BOTTOM)} aria-label="Navigasi utama" />
        <div className="peta-nav-active" style={box(...NAV.highlight, BOTTOM)} aria-hidden="true" />
        {NAV_GLYPHS.map(([r, src], i) => (
          <img key={i} className="peta-img" style={box(r[0], r[1], r[2], r[3], BOTTOM)} src={src} alt="" draggable={false} />
        ))}
        {([
          ['Beranda', () => { playSound(500); onNavigateTab('beranda'); }],
          ['Peta (aktif)', () => { playSound(500); showToast('🗺️ Anda berada di Peta Petualangan'); }],
          ['Prestasi', () => { playSound(500); onOpenPrestasi(); }],
          ['Materi', () => { playSound(500); onOpenMateri(); }],
          ['Profil', () => { playSound(500); onOpenProfile(); }],
        ] as [string, () => void][]).map(([label, fn], i) => (
          <button
            key={label}
            type="button"
            className="peta-hit"
            style={box(NAV.tabs[i] - NAV.tabW / 2, NAV.tabY, NAV.tabW, NAV.tabH, BOTTOM)}
            onClick={fn}
            aria-label={label}
            aria-current={i === 1 ? 'page' : undefined}
            title={label}
          />
        ))}
      </div>

      {/* ============ MODAL ============ */}
      {showPulauBentukFlow && (
        <PulauBentukFlow
          player={player}
          initialLevel={flowLevel}
          levelStars={levelStars}
          onSaveLevelStars={onSaveLevelStars}
          onClose={() => setShowPulauBentukFlow(false)}
          onWinReward={(stars, gems, exp) => {
            if (onWinReward) {
              onWinReward(stars, gems, exp);
            } else {
              onAddStars(stars);
              onAddGems(gems);
            }
          }}
          showToast={showToast}
          playSound={playSound}
        />
      )}
      {selectedIsland !== null && <IslandDetailModal islandId={selectedIsland} onClose={() => setSelectedIsland(null)} />}
      {showKoleksi && <KoleksiModal playSound={playSound} onClose={() => setShowKoleksi(false)} />}
      {showMission && <DailyMissionModal mission={mission} onClose={() => setShowMission(false)} />}
    </div>
  );
};

