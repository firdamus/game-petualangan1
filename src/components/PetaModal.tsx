import React from 'react';
import type { PlayerData, Mission, TabType } from '../types';
import { PetaScreen } from './PetaScreen';

interface PetaModalProps {
  player: PlayerData;
  mission: Mission;
  levelStars: Record<number, number>;
  onSaveLevelStars: (level: number, stars: number) => void;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
  onAddStars: (amount: number) => void;
  onAddGems: (amount: number) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenMateri: () => void;
  onOpenPrestasi: () => void;
  showToast: (msg: string) => void;
  playSound: (freq?: number, type?: OscillatorType) => void;
}

export const PetaModal: React.FC<PetaModalProps> = ({
  player,
  mission,
  levelStars,
  onSaveLevelStars,
  onClose,
  onNavigateTab,
  onAddStars,
  onAddGems,
  onOpenProfile,
  onOpenSettings,
  onOpenMateri,
  onOpenPrestasi,
  showToast,
  playSound,
}) => {
  return (
    <PetaScreen
      player={player}
      mission={mission}
      onBack={onClose}
      onNavigateTab={onNavigateTab}
      levelStars={levelStars}
      onSaveLevelStars={onSaveLevelStars}
      onAddStars={onAddStars}
      onAddGems={onAddGems}
      onOpenProfile={onOpenProfile}
      onOpenSettings={onOpenSettings}
      onOpenMateri={onOpenMateri}
      onOpenPrestasi={onOpenPrestasi}
      showToast={showToast}
      playSound={playSound}
    />
  );
};
