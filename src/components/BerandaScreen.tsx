import React from 'react';
import type { PlayerData, Mission, TabType } from '../types';
import berandaBg from '../assets/beranda-bg-clean.png';
import { TopHud } from './TopHud';
import { BOTTOM, MID, NAV, box } from './petaLayout';
import './PetaScreen.css';
import './BerandaScreen.css';

interface BerandaScreenProps {
  player: PlayerData;
  mission: Mission;
  onNavigateTab: (tab: TabType) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenMission: () => void;
  onOpenMateri: () => void;
  onOpenPrestasi: () => void;
  onAddStars: (amount: number) => void;
  onAddGems: (amount: number) => void;
  playSound: (freq?: number, type?: OscillatorType) => void;
  showToast: (msg: string) => void;
}

export const BerandaScreen: React.FC<BerandaScreenProps> = ({
  player,
  mission,
  onNavigateTab,
  onOpenProfile,
  onOpenSettings,
  onOpenMission,
  onOpenMateri,
  onOpenPrestasi,
  onAddStars,
  onAddGems,
  playSound,
  showToast,
}) => {
  return (
    <div className="beranda-screen">
      {/* Latar langit di belakang panggung agar menyatu mulus di semua rasio layar */}
      <div className="beranda-sky" aria-hidden="true" />

      {/* ============ PANGGUNG TENGAH: Latar beranda asli + Tombol Interaktif ============ */}
      <div className="beranda-stage">
        <img
          src={berandaBg}
          alt="Petualangan Bangun Datar"
          className="beranda-bg"
          draggable={false}
        />

        {/* 1. Tombol MULAI PETUALANGAN -> Buka Peta Petualangan */}
        <button
          type="button"
          className="beranda-hit beranda-hit-play"
          style={box(198, 745, 546, 145, MID)}
          onClick={() => {
            playSound(800, 'triangle');
            onNavigateTab('peta');
            showToast('🗺️ Membuka Peta Petualangan...');
          }}
          aria-label="Mulai Petualangan"
          title="Mulai Petualangan"
        />

        {/* 2. Papan Kayu Kenali Bangun Datar -> Buka Materi */}
        <button
          type="button"
          className="beranda-hit beranda-hit-signboard"
          style={box(10, 1020, 245, 168, MID)}
          onClick={() => {
            playSound(650);
            onOpenMateri();
          }}
          aria-label="Kenali Bangun Datar"
          title="Kenali Bangun Datar"
        />

        {/* 3. Karakter Segitiga Kuning */}
        <button
          type="button"
          className="beranda-hit beranda-hit-character"
          style={box(225, 1003, 358, 400, MID)}
          onClick={() => {
            playSound(700);
            showToast('👋 Halo! Aku Si Segitiga Petualang! Ayo buka Peta untuk berpetualang!');
          }}
          aria-label="Si Segitiga Petualang"
          title="Si Segitiga Petualang"
        />
      </div>

      {/* ============ HUD ATAS (IDENTIK DENGAN PETA & DINAMIS) ============ */}
      <TopHud
        player={player}
        mission={mission}
        showBackAndTitle={false}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onOpenMission={onOpenMission}
        onAddStars={onAddStars}
        onAddGems={onAddGems}
        playSound={playSound}
        showToast={showToast}
      />

      {/* ============ BILAH NAVIGASI BAWAH (5 TAB PRESISI) ============ */}
      <div className="peta-group peta-bottom">
        {([
          ['Beranda (aktif)', () => { playSound(500); showToast('🏠 Anda berada di Beranda'); }],
          ['Peta', () => { playSound(500); onNavigateTab('peta'); }],
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
            aria-current={i === 0 ? 'page' : undefined}
            title={label}
          />
        ))}
      </div>
    </div>
  );
};
