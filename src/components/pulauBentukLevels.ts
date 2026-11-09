// ==========================================================
// DATA LEVEL "PULAU BENTUK" (sesuai rancangan: 3 level x 5 soal)
//
// Tingkat kesulitan naik lewat jumlah benda target dan jumlah pijakan:
//   Level 1 (Mudah)  : 3 bentuk, 3 pulau pijakan lebar
//   Level 2 (Sedang) : 4 bentuk, 4 pulau pijakan lebih sempit & bertingkat
//   Level 3 (Sulit)  : 5 bentuk, 5 pulau pijakan kecil, naik lalu turun
// ==========================================================
import type { CollectibleItem, Platform } from './pulauBentukEngine';

export type QuizVisual = 'none' | 'triangle' | 'square' | 'circle' | 'roof' | 'clock' | 'tile' | 'wheel';

export interface QuizOption {
  label: string;
  icon: string;
  color: string;
  /** true bila pilihan berupa gambar (nama bentuk tidak boleh membocorkan jawaban) */
  picture?: boolean;
}

export interface QuizQuestion {
  question: string;
  visual: QuizVisual;
  options: QuizOption[];
  correctIndex: number;
  explanation: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  stage: string; // jenis tahap belajar (Pengenalan / Pemahaman / Penerapan)
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  capaian: string; // capaian pembelajaran
  goal: string; // tujuan game (ditampilkan sebelum mulai)
  mission: string; // misi petualangan (ditampilkan di awal level)
  missionShort: string; // judul kartu misi saat bermain
  platforms: Platform[];
  collectibles: CollectibleItem[];
  flagX: number;
  flagMinY: number;
  rewardXp: number;
  rewardGems: number;
  quiz: QuizQuestion[];
}

// ---------- Aturan bintang & pembukaan level ----------
export const QUESTIONS_PER_LEVEL = 5;
export const STARS_TO_UNLOCK = 2;

/** 2 benar = 1 bintang, 4 benar = 2 bintang, 5 benar = 3 bintang (3 benar tetap 1 bintang). */
export function starsFromCorrect(correct: number): number {
  if (correct >= 5) return 3;
  if (correct >= 4) return 2;
  if (correct >= 2) return 1;
  return 0;
}

export const STAR_RULES: { correct: string; stars: number }[] = [
  { correct: '2 benar', stars: 1 },
  { correct: '4 benar', stars: 2 },
  { correct: '5 benar', stars: 3 },
];

export function shapeItems(level: LevelConfig): CollectibleItem[] {
  return level.collectibles.filter((c) => c.kind !== 'coin');
}

const SHAPE_OPTS = {
  tri: { label: 'Segitiga', icon: '▲', color: '#f59e0b' },
  square: { label: 'Persegi', icon: '■', color: '#3b82f6' },
  circle: { label: 'Lingkaran', icon: '●', color: '#ec4899' },
};

// ==========================================================
// LEVEL 1 - Gerbang Pulau Bentuk (Mudah)
// ==========================================================
const LEVEL_1: LevelConfig = {
  id: 1,
  name: 'Gerbang Pulau Bentuk',
  stage: 'Pengenalan',
  difficulty: 'Mudah',
  capaian: 'Siswa mampu mengenali segitiga, persegi, dan lingkaran dari tampilannya.',
  goal: 'Jelajahi pulau, kumpulkan 3 bentuk, lalu jawab 5 soal tentang mengenali bentuk. Kumpulkan bintang untuk membuka level berikutnya!',
  mission: 'Misi: kumpulkan 1 segitiga, 1 persegi, dan 1 lingkaran yang tersebar di pulau.',
  missionShort: 'Kumpulkan segitiga, persegi, dan lingkaran!',
  platforms: [
    { id: 'p1', from: 4, to: 34, top: 47, depth: 19 },
    { id: 'p2', from: 40, to: 62, top: 72, depth: 26 },
    { id: 'p3', from: 70, to: 96, top: 47, depth: 20 },
  ],
  collectibles: [
    { id: 'shape-tri', kind: 'tri', x: 25, y: 56, value: 5, name: 'Segitiga', label: '▲ Segitiga Ditemukan!' },
    { id: 'coin-1', kind: 'coin', x: 31, y: 72, value: 2, label: '+2 Koin' },
    { id: 'shape-square', kind: 'square', x: 51, y: 81, value: 5, name: 'Persegi', label: '■ Persegi Ditemukan!' },
    { id: 'coin-2', kind: 'coin', x: 46, y: 102, value: 2, label: '+2 Koin' },
    { id: 'coin-3', kind: 'coin', x: 57, y: 103, value: 2, label: '+2 Koin' },
    { id: 'shape-circle', kind: 'circle', x: 78, y: 56, value: 5, name: 'Lingkaran', label: '● Lingkaran Ditemukan!' },
  ],
  flagX: 88,
  flagMinY: 40,
  rewardXp: 100,
  rewardGems: 5,
  quiz: [
    {
      question: 'Manakah gambar yang berbentuk segitiga?',
      visual: 'none',
      options: [
        { ...SHAPE_OPTS.square, label: 'Gambar A', picture: true },
        { ...SHAPE_OPTS.tri, label: 'Gambar B', picture: true },
        { ...SHAPE_OPTS.circle, label: 'Gambar C', picture: true },
      ],
      correctIndex: 1,
      explanation: 'Segitiga memiliki 3 sisi lurus dan 3 sudut. Gambar B adalah segitiga!',
    },
    {
      question: 'Bangun datar manakah yang berbentuk bulat?',
      visual: 'none',
      options: [SHAPE_OPTS.tri, SHAPE_OPTS.square, SHAPE_OPTS.circle],
      correctIndex: 2,
      explanation: 'Lingkaran berbentuk bulat sempurna dan tidak memiliki sudut.',
    },
    {
      question: 'Pilih gambar yang merupakan persegi.',
      visual: 'none',
      options: [
        { ...SHAPE_OPTS.circle, label: 'Gambar A', picture: true },
        { ...SHAPE_OPTS.tri, label: 'Gambar B', picture: true },
        { ...SHAPE_OPTS.square, label: 'Gambar C', picture: true },
      ],
      correctIndex: 2,
      explanation: 'Persegi memiliki 4 sisi sama panjang dan 4 sudut siku-siku. Gambar C adalah persegi!',
    },
    {
      question: 'Bentuk apa yang memiliki tiga sisi?',
      visual: 'none',
      options: [SHAPE_OPTS.square, SHAPE_OPTS.tri, SHAPE_OPTS.circle],
      correctIndex: 1,
      explanation: 'Segitiga dibentuk oleh tepat 3 sisi lurus.',
    },
    {
      question: 'Bangun datar apa yang memiliki empat sisi sama panjang?',
      visual: 'none',
      options: [SHAPE_OPTS.circle, SHAPE_OPTS.tri, SHAPE_OPTS.square],
      correctIndex: 2,
      explanation: 'Persegi memiliki empat sisi yang sama panjang.',
    },
  ],
};

// ==========================================================
// LEVEL 2 - Lembah Bentuk (Sedang)
// ==========================================================
const LEVEL_2: LevelConfig = {
  id: 2,
  name: 'Lembah Bentuk',
  stage: 'Pemahaman',
  difficulty: 'Sedang',
  capaian: 'Siswa mampu menyebutkan jumlah sisi dan titik sudut pada bangun datar sederhana.',
  goal: 'Jelajahi lembah dengan pulau yang lebih kecil, kumpulkan 4 bentuk dengan ciri berbeda, lalu jawab 5 soal tentang sisi dan titik sudut.',
  mission:
    'Misi: kumpulkan bentuk dengan ciri berbeda: segitiga (3 sisi), persegi (4 sisi sama panjang), persegi panjang, dan lingkaran (tanpa titik sudut).',
  missionShort: 'Kumpulkan 4 bentuk dengan ciri berbeda!',
  platforms: [
    { id: 'p1', from: 4, to: 22, top: 44, depth: 18 },
    { id: 'p2', from: 32, to: 48, top: 66, depth: 22 },
    { id: 'p3', from: 58, to: 72, top: 88, depth: 26 },
    { id: 'p4', from: 82, to: 97, top: 54, depth: 20 },
  ],
  collectibles: [
    { id: 'shape-tri', kind: 'tri', x: 13, y: 53, value: 5, name: '3 sisi', label: '▲ Segitiga (3 sisi) Ditemukan!' },
    { id: 'coin-1', kind: 'coin', x: 27, y: 74, value: 2, label: '+2 Koin' },
    { id: 'shape-square', kind: 'square', x: 40, y: 75, value: 5, name: '4 sisi sama', label: '■ Persegi (4 sisi sama) Ditemukan!' },
    { id: 'coin-2', kind: 'coin', x: 53, y: 95, value: 2, label: '+2 Koin' },
    { id: 'shape-rect', kind: 'rect', x: 65, y: 97, value: 5, name: 'Persegi panjang', label: '▬ Persegi Panjang Ditemukan!' },
    { id: 'coin-3', kind: 'coin', x: 77, y: 118, value: 2, label: '+2 Koin' },
    { id: 'shape-circle', kind: 'circle', x: 91, y: 63, value: 5, name: 'Tanpa sudut', label: '● Lingkaran (tanpa sudut) Ditemukan!' },
  ],
  flagX: 90,
  flagMinY: 48,
  rewardXp: 120,
  rewardGems: 7,
  quiz: [
    {
      question: 'Berapa jumlah sisi pada segitiga?',
      visual: 'triangle',
      options: [
        { label: '2 sisi', icon: '2', color: '#8b5cf6' },
        { label: '3 sisi', icon: '3', color: '#10b981' },
        { label: '4 sisi', icon: '4', color: '#3b82f6' },
      ],
      correctIndex: 1,
      explanation: 'Segitiga selalu memiliki 3 sisi dan 3 titik sudut.',
    },
    {
      question: 'Berapa jumlah titik sudut pada persegi?',
      visual: 'square',
      options: [
        { label: '3 titik sudut', icon: '3', color: '#f59e0b' },
        { label: '0 titik sudut', icon: '0', color: '#8b5cf6' },
        { label: '4 titik sudut', icon: '4', color: '#10b981' },
      ],
      correctIndex: 2,
      explanation: 'Persegi memiliki 4 titik sudut, tepat di setiap pojoknya.',
    },
    {
      question: 'Berapa jumlah titik sudut pada lingkaran?',
      visual: 'circle',
      options: [
        { label: '0 titik sudut', icon: '0', color: '#10b981' },
        { label: '1 titik sudut', icon: '1', color: '#f59e0b' },
        { label: '4 titik sudut', icon: '4', color: '#3b82f6' },
      ],
      correctIndex: 0,
      explanation: 'Lingkaran tidak punya sisi lurus, jadi tidak punya titik sudut.',
    },
    {
      question: 'Bangun datar apa yang memiliki empat sisi?',
      visual: 'none',
      options: [SHAPE_OPTS.circle, SHAPE_OPTS.square, SHAPE_OPTS.tri],
      correctIndex: 1,
      explanation: 'Persegi memiliki empat sisi lurus.',
    },
    {
      question: 'Bangun datar apa yang tidak memiliki titik sudut?',
      visual: 'none',
      options: [SHAPE_OPTS.tri, SHAPE_OPTS.square, SHAPE_OPTS.circle],
      correctIndex: 2,
      explanation: 'Lingkaran tidak memiliki titik sudut karena sisinya melengkung.',
    },
  ],
};

// ==========================================================
// LEVEL 3 - Hutan Bentuk (Sulit)
// ==========================================================
const LEVEL_3: LevelConfig = {
  id: 3,
  name: 'Hutan Bentuk',
  stage: 'Penerapan',
  difficulty: 'Sulit',
  capaian: 'Siswa mampu mengidentifikasi bangun datar pada benda-benda sehari-hari.',
  goal: 'Lompati 5 pulau kecil di hutan, temukan 5 benda sehari-hari, lalu jawab 5 soal tentang bentuk benda di sekitar kita.',
  mission: 'Misi: cari objek di hutan: jam, atap rumah, ubin, pintu, dan roda sepeda dengan bentuk yang sesuai.',
  missionShort: 'Temukan 5 benda di hutan!',
  platforms: [
    { id: 'p1', from: 4, to: 16, top: 42, depth: 18 },
    { id: 'p2', from: 24, to: 36, top: 64, depth: 22 },
    { id: 'p3', from: 44, to: 56, top: 88, depth: 26 },
    { id: 'p4', from: 64, to: 76, top: 66, depth: 22 },
    { id: 'p5', from: 84, to: 96, top: 50, depth: 20 },
  ],
  collectibles: [
    { id: 'shape-clock', kind: 'clock', x: 10, y: 51, value: 5, name: 'Jam', label: '⏰ Jam Ditemukan!' },
    { id: 'coin-1', kind: 'coin', x: 20, y: 70, value: 2, label: '+2 Koin' },
    { id: 'shape-roof', kind: 'roof', x: 30, y: 73, value: 5, name: 'Atap rumah', label: '🏠 Atap Rumah Ditemukan!' },
    { id: 'coin-2', kind: 'coin', x: 40, y: 88, value: 2, label: '+2 Koin' },
    { id: 'shape-tile', kind: 'tile', x: 50, y: 97, value: 5, name: 'Ubin', label: '🟩 Ubin Ditemukan!' },
    { id: 'coin-3', kind: 'coin', x: 60, y: 116, value: 2, label: '+2 Koin' },
    { id: 'shape-door', kind: 'door', x: 70, y: 75, value: 5, name: 'Pintu', label: '🚪 Pintu Ditemukan!' },
    { id: 'shape-wheel', kind: 'wheel', x: 89, y: 59, value: 5, name: 'Roda sepeda', label: '🚲 Roda Sepeda Ditemukan!' },
  ],
  flagX: 90,
  flagMinY: 44,
  rewardXp: 150,
  rewardGems: 10,
  quiz: [
    {
      question: 'Jam dinding berbentuk bulat menyerupai bangun datar apa?',
      visual: 'clock',
      options: [SHAPE_OPTS.square, SHAPE_OPTS.circle, SHAPE_OPTS.tri],
      correctIndex: 1,
      explanation: 'Jam dinding yang bulat menyerupai lingkaran.',
    },
    {
      question: 'Atap rumah pada gambar menyerupai bentuk apa?',
      visual: 'roof',
      options: [SHAPE_OPTS.tri, SHAPE_OPTS.square, SHAPE_OPTS.circle],
      correctIndex: 0,
      explanation: 'Atap rumah ini memiliki 3 sisi lurus dan 3 sudut, yaitu segitiga.',
    },
    {
      question: 'Ubin dengan empat sisi sama panjang menyerupai apa?',
      visual: 'tile',
      options: [SHAPE_OPTS.circle, SHAPE_OPTS.tri, SHAPE_OPTS.square],
      correctIndex: 2,
      explanation: 'Ubin yang keempat sisinya sama panjang menyerupai persegi.',
    },
    {
      question: 'Pintu berbentuk persegi panjang memiliki berapa sisi?',
      visual: 'none',
      options: [
        { label: '3 sisi', icon: '3', color: '#f59e0b' },
        { label: '4 sisi', icon: '4', color: '#10b981' },
        { label: '5 sisi', icon: '5', color: '#3b82f6' },
      ],
      correctIndex: 1,
      explanation: 'Persegi panjang memiliki 4 sisi, dua sisi panjang dan dua sisi pendek.',
    },
    {
      question: 'Roda sepeda jika dilihat dari samping berbentuk apa?',
      visual: 'wheel',
      options: [SHAPE_OPTS.tri, SHAPE_OPTS.square, SHAPE_OPTS.circle],
      correctIndex: 2,
      explanation: 'Roda sepeda dilihat dari samping berbentuk lingkaran.',
    },
  ],
};

export const LEVELS: LevelConfig[] = [LEVEL_1, LEVEL_2, LEVEL_3];
export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(id: number): LevelConfig {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

/** Level terbuka jika level 1, atau level sebelumnya sudah mendapat minimal 2 bintang. */
export function isLevelUnlocked(id: number, levelStars: Record<number, number>): boolean {
  if (id <= 1) return true;
  return (levelStars[id - 1] ?? 0) >= STARS_TO_UNLOCK;
}
