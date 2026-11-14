import { useState, useCallback, useRef } from 'react';
import './App.css';
import type { PlayerData, Mission, TabType } from './types';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { MateriModal } from './components/MateriModal';
import { PetaScreen } from './components/PetaScreen';
import { PrestasiModal } from './components/PrestasiModal';
import { DailyMissionModal } from './components/DailyMissionModal';
import { BerandaScreen } from './components/BerandaScreen';

const INITIAL_PLAYER: PlayerData = {
  name: 'Rizki',
  role: 'Siswa',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4',
  level: 1,
  exp: 0,
  maxExp: 100,
  stars: 0,
  gems: 0,
};

export default function App() {
  // Tab Aktif (Beranda atau Peta Petualangan)
  const [currentTab, setCurrentTab] = useState<TabType>('beranda');

  // Data Pemain: Selalu mulai dari Level 1 dan 0 bintang saat aplikasi dibuka/direfresh
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER);

  // Misi Harian
  const [mission, setMission] = useState<Mission>({
    id: 'm1',
    title: 'Misi Hari Ini',
    desc: 'Selesaikan 3 level dengan nilai sempurna',
    current: 0,
    target: 3,
    completed: false,
    rewardStars: 50,
    rewardGems: 5,
  });

  // Modal Aktif
  const [activeModal, setActiveModal] = useState<
    'profile' | 'settings' | 'materi' | 'prestasi' | 'mission' | null
  >(null);

  // Bintang level: saat direfresh pemain mengulang ke level 1, bintang 0, level 2+ terkunci
  const [levelStars, setLevelStars] = useState<Record<number, number>>({});

  const handleSaveLevelStars = useCallback((levelNum: number, stars: number) => {
    setLevelStars((prev) => {
      const best = Math.max(prev[levelNum] ?? 0, stars);
      if (best === (prev[levelNum] ?? 0)) return prev;
      return { ...prev, [levelNum]: best };
    });

    // Jika level berhasil diselesaikan (bintang >= 2), naikkan level pemain ke level berikutnya
    if (stars >= 2) {
      setPlayer((prev) => {
        const nextLv = Math.max(prev.level, levelNum + 1);
        return { ...prev, level: nextLv };
      });
    }
  }, []);

  // Audio & Notifikasi
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  }, []);

  // Satu AudioContext dipakai ulang. Membuat yang baru di setiap bunyi (apalagi saat
  // karakter berjalan) cepat menghabiskan batas context browser sehingga suara mati.
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((freq = 520, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') void audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  }, [soundEnabled]);

  const handleAddStars = useCallback((amount: number) => {
    setPlayer((prev) => {
      const nextStars = prev.stars + amount;
      showToast(`⭐ Bintang bertambah +${amount}! (Total: ${nextStars})`);
      return { ...prev, stars: nextStars };
    });
  }, [showToast]);

  const handleAddGems = useCallback((amount: number) => {
    setPlayer((prev) => {
      const nextGems = prev.gems + amount;
      showToast(`💎 Berlian bertambah +${amount}! (Total: ${nextGems})`);
      return { ...prev, gems: nextGems };
    });
  }, [showToast]);

  const handleWinReward = (rewardStars: number, rewardGems: number, expGained: number) => {
    playSound(900);
    setPlayer((prev) => {
      let newExp = prev.exp + expGained;
      let newLevel = prev.level;
      if (newExp >= prev.maxExp) {
        newLevel += 1;
        newExp = newExp - prev.maxExp;
        showToast(`🎊 NAIK LEVEL! Sekarang Level ${newLevel}!`);
      }
      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        stars: prev.stars + rewardStars,
        gems: prev.gems + rewardGems,
      };
    });

    // Update mission progress
    setMission((m) => {
      const nextCurrent = Math.min(m.target, m.current + 1);
      return {
        ...m,
        current: nextCurrent,
        completed: nextCurrent >= m.target,
      };
    });
  };

  const handleTabClick = (tab: TabType) => {
    playSound(500);
    if (tab === 'peta') {
      setCurrentTab('peta');
      showToast('🗺️ Membuka Peta Petualangan...');
    } else if (tab === 'beranda') {
      setCurrentTab('beranda');
      showToast('🏠 Anda berada di Beranda');
    } else if (tab === 'prestasi') {
      setActiveModal('prestasi');
    } else if (tab === 'materi') {
      setActiveModal('materi');
    } else if (tab === 'profil') {
      setActiveModal('profile');
    }
  };

  return (
    <div className="mobile-app-wrapper">
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="game-toast-banner">
          {toastMessage}
        </div>
      )}

      {/* Frame Layar Game Murni Satu Gambar Asli */}
      <main className="game-screen-frame">
        {currentTab === 'peta' ? (
          /* ==========================================================
             TAMPILAN PETA PETUALANGAN (IDENTIK & INTERAKTIF)
             ========================================================== */
          <PetaScreen
            player={player}
            mission={mission}
            onBack={() => {
              setCurrentTab('beranda');
              showToast('🏠 Kembali ke Beranda');
            }}
            onNavigateTab={handleTabClick}
            levelStars={levelStars}
            onSaveLevelStars={handleSaveLevelStars}
            onAddStars={handleAddStars}
            onAddGems={handleAddGems}
            onWinReward={handleWinReward}
            onOpenProfile={() => setActiveModal('profile')}
            onOpenSettings={() => setActiveModal('settings')}
            onOpenMateri={() => setActiveModal('materi')}
            onOpenPrestasi={() => setActiveModal('prestasi')}
            showToast={showToast}
            playSound={playSound}
          />
        ) : (
          /* ==========================================================
             TAMPILAN BERANDA UTAMA (RESPONSIF & DINAMIS SEPERTI PETA)
             ========================================================== */
          <BerandaScreen
            player={player}
            mission={mission}
            onNavigateTab={handleTabClick}
            onOpenProfile={() => setActiveModal('profile')}
            onOpenSettings={() => setActiveModal('settings')}
            onOpenMission={() => setActiveModal('mission')}
            onOpenMateri={() => setActiveModal('materi')}
            onOpenPrestasi={() => setActiveModal('prestasi')}
            onAddStars={handleAddStars}
            onAddGems={handleAddGems}
            playSound={playSound}
            showToast={showToast}
          />
        )}
      </main>

      {/* ==========================================================
          MODAL INTERAKTIF GLOBAL
          ========================================================== */}
      {activeModal === 'profile' && (
        <ProfileModal
          player={player}
          onSave={(updated) => {
            setPlayer((prev) => ({ ...prev, ...updated }));
            showToast('✅ Profil berhasil diperbarui!');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onToggleMusic={() => setMusicEnabled((v) => !v)}
          onResetProgress={() => {
            setPlayer(INITIAL_PLAYER);
            setLevelStars({});
            setMission((m) => ({ ...m, current: 0, completed: false }));
            showToast('🔄 Progres di-reset ke Level 1 & 0 Bintang!');
          }}
          onCheatCurrency={() => {
            setPlayer((p) => ({ ...p, stars: p.stars + 100, gems: p.gems + 50 }));
            showToast('🎁 Bonus: +100 ⭐ & +50 💎!');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'materi' && (
        <MateriModal onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'prestasi' && (
        <PrestasiModal
          onClaimReward={(reward) => {
            playSound(950);
            setPlayer((p) => ({ ...p, stars: p.stars + reward }));
            showToast(`🏆 Klaim ⭐ +${reward} Bintang!`);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'mission' && (
        <DailyMissionModal
          mission={mission}
          onClaim={() => {
            playSound(950);
            handleAddStars(mission.rewardStars);
            handleAddGems(mission.rewardGems);
            setMission((m) => ({ ...m, completed: true }));
            showToast(`🎉 Misi selesai! Hadiah ⭐ +${mission.rewardStars} & 💎 +${mission.rewardGems} berhasil diklaim!`);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
