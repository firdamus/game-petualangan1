import React, { useEffect, useRef, useState } from 'react';
import type { PlayerData, Mission } from '../types';
import { ASSET, HUD, TOP, at, box, u } from './petaLayout';
import './PetaScreen.css';
import profileImg from '../assets/peta/profile.png';
import currencyImg from '../assets/peta/currency.png';
import settingsImg from '../assets/peta/settings.png';
import backImg from '../assets/peta/back.png';
import titleImg from '../assets/peta/title.png';
import missionImg from '../assets/peta/mission.png';

interface TopHudProps {
  player: PlayerData;
  mission: Mission;
  showBackAndTitle?: boolean;
  onBack?: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenMission: () => void;
  onAddStars: (amount: number) => void;
  onAddGems: (amount: number) => void;
  playSound: (freq?: number, type?: OscillatorType) => void;
  showToast?: (msg: string) => void;
}

const formatCount = (n: number): string => {
  const v = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
  if (v >= 100000) return `${Math.floor(v / 1000)}K`;
  return v.toLocaleString('id-ID');
};

const ratio = (a: number, b: number) => (b > 0 ? Math.min(1, Math.max(0, a / b)) : 0);

export const TopHud: React.FC<TopHudProps> = ({
  player,
  mission,
  showBackAndTitle = false,
  onBack,
  onOpenProfile,
  onOpenSettings,
  onOpenMission,
  onAddStars,
  onAddGems,
  playSound,
  showToast,
}) => {
  const xpPct = ratio(player.exp, player.maxExp);
  const missionPct = ratio(mission.current, mission.target);

  const prevStarsRef = useRef(player.stars);
  const prevGemsRef = useRef(player.gems);
  const [starBump, setStarBump] = useState(false);
  const [gemBump, setGemBump] = useState(false);

  useEffect(() => {
    if (player.stars !== prevStarsRef.current) {
      prevStarsRef.current = player.stars;
      setStarBump(true);
      const t = setTimeout(() => setStarBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [player.stars]);

  useEffect(() => {
    if (player.gems !== prevGemsRef.current) {
      prevGemsRef.current = player.gems;
      setGemBump(true);
      const t = setTimeout(() => setGemBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [player.gems]);

  const sound = (f: number, fn: () => void) => () => {
    playSound(f);
    fn();
  };

  return (
    <div className="peta-group peta-top">
      {/* 1. KARTU PROFIL SISWA */}
      <img className="peta-img" style={box(...ASSET.profile, TOP)} src={profileImg} alt="" draggable={false} />
      <span
        className="peta-txt"
        style={{ ...at(HUD.name.x, HUD.name.y, TOP), fontSize: u(HUD.name.size), color: '#fff' }}
      >
        {player.name}
      </span>
      <span
        className="peta-txt peta-txt-soft"
        style={{ ...at(HUD.level.x, HUD.level.y, TOP), fontSize: u(HUD.level.size), color: '#a9d6f6' }}
      >
        Level {player.level}
      </span>
      <div className="peta-track peta-xp-track" style={box(HUD.xpTrack.x, HUD.xpTrack.y, HUD.xpTrack.w, HUD.xpTrack.h, TOP)}>
        <div className="peta-fill" style={{ width: `${xpPct * 100}%`, minWidth: xpPct > 0 ? '8%' : 0 }} />
      </div>
      <button
        type="button"
        className="peta-hit"
        style={box(8, 6, 376, 150, TOP)}
        onClick={sound(550, onOpenProfile)}
        aria-label={`Profil siswa ${player.name}`}
        title={`Profil Siswa ${player.name}`}
      />

      {/* 2. BILAH MATA UANG (BINTANG & BERLIAN) */}
      <img className="peta-img" style={box(...ASSET.currency, TOP)} src={currencyImg} alt="" draggable={false} />
      <span
        className={`peta-txt is-center ${starBump ? 'currency-bump' : ''}`}
        style={{ ...at(HUD.stars.x, HUD.stars.y, TOP), fontSize: u(HUD.stars.size) }}
      >
        {formatCount(player.stars)}
      </span>
      <span
        className={`peta-txt is-center ${gemBump ? 'currency-bump' : ''}`}
        style={{ ...at(HUD.gems.x, HUD.gems.y, TOP), fontSize: u(HUD.gems.size) }}
      >
        {formatCount(player.gems)}
      </span>
      {/* Tombol Tambah Bintang (+) */}
      <button
        type="button"
        className="peta-hit"
        style={box(484, 24, 192, 66, TOP)}
        onClick={sound(820, () => onAddStars(10))}
        aria-label="Tambah 10 bintang"
        title="Tambah 10 Bintang"
      />
      {/* Tombol Tambah Berlian (+) */}
      <button
        type="button"
        className="peta-hit"
        style={box(682, 24, 164, 66, TOP)}
        onClick={sound(920, () => onAddGems(5))}
        aria-label="Tambah 5 berlian"
        title="Tambah 5 Berlian"
      />

      {/* 3. TOMBOL PENGATURAN */}
      <img className="peta-img" style={box(...ASSET.settings, TOP)} src={settingsImg} alt="" draggable={false} />
      <button
        type="button"
        className="peta-hit"
        style={box(849, 22, 66, 70, TOP)}
        onClick={sound(550, onOpenSettings)}
        aria-label="Pengaturan game"
        title="Pengaturan Game"
      />

      {/* 4. KHUSUS PETA: TOMBOL KEMBALI & BANNER JUDUL */}
      {showBackAndTitle && (
        <>
          <img className="peta-img" style={box(...ASSET.back, TOP)} src={backImg} alt="" draggable={false} />
          <button
            type="button"
            className="peta-hit"
            style={box(22, 152, 88, 88, TOP)}
            onClick={sound(480, onBack ?? (() => {}))}
            aria-label="Kembali ke beranda"
            title="Kembali ke Beranda"
          />

          <img className="peta-img" style={box(...ASSET.title, TOP)} src={titleImg} alt="Peta Petualangan" draggable={false} />
          <button
            type="button"
            className="peta-hit"
            style={box(250, 130, 428, 120, TOP)}
            onClick={sound(600, () =>
              showToast?.('🗺️ Peta Petualangan: Jelajahi 5 pulau geometri dan taklukkan semua level!')
            )}
            aria-label="Peta Petualangan"
            title="Peta Petualangan"
          />
        </>
      )}

      {/* 5. KARTU MISI HARI INI */}
      <img className="peta-img" style={box(...ASSET.mission, TOP)} src={missionImg} alt="" draggable={false} />
      <div className="peta-track peta-mission-track" style={box(HUD.missionTrack.x, HUD.missionTrack.y, HUD.missionTrack.w, HUD.missionTrack.h, TOP)}>
        <div className="peta-fill" style={{ width: `${missionPct * 100}%`, minWidth: missionPct > 0 ? '10%' : 0 }} />
      </div>
      <span
        className="peta-txt peta-txt-soft is-center"
        style={{ ...at(HUD.missionText.x, HUD.missionText.y, TOP), fontSize: u(HUD.missionText.size), color: '#2d4c82' }}
      >
        {mission.current}/{mission.target}
      </span>
      <button
        type="button"
        className="peta-hit"
        style={box(662, 105, 279, 150, TOP)}
        onClick={sound(680, onOpenMission)}
        aria-label="Misi hari ini"
        title="Misi Hari Ini"
      />
    </div>
  );
};
