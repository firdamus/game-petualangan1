/**
 * Tata letak Peta Petualangan.
 * Semua koordinat memakai "ruang desain" 941 x 1672 px (ukuran gambar referensi),
 * lalu diubah ke persen agar bentuk tidak pernah melar di layar berukuran berbeda.
 */
import type { CSSProperties } from 'react';

export const DESIGN_W = 941;
export const DESIGN_H = 1672;

/** Kelompok yang menempel ke tepi layar: HUD atas, tengah (pulau), bilah bawah. */
export type Group = { y0: number; h: number };
export const TOP: Group = { y0: 0, h: 270 };
export const MID: Group = { y0: 0, h: DESIGN_H };
export const BOTTOM: Group = { y0: 1290, h: 382 };

export const box = (x: number, y: number, w: number, h: number, g: Group = MID): CSSProperties => ({
  left: `${(x / DESIGN_W) * 100}%`,
  top: `${((y - g.y0) / g.h) * 100}%`,
  width: `${(w / DESIGN_W) * 100}%`,
  height: `${(h / g.h) * 100}%`,
});

/** Kotak yang dipusatkan pada titik (cx, cy). */
export const centered = (cx: number, cy: number, w: number, h: number, g: Group = MID): CSSProperties =>
  box(cx - w / 2, cy - h / 2, w, h, g);

/** Ukuran font / jarak dalam piksel desain -> mengikuti skala layar. */
export const u = (n: number) => `calc(var(--u) * ${n})`;

/** Titik pada kelompok (untuk teks dinamis). */
export const at = (x: number, y: number, g: Group = MID): CSSProperties => ({
  left: `${(x / DESIGN_W) * 100}%`,
  top: `${((y - g.y0) / g.h) * 100}%`,
});

// ---------- Kotak aset (x, y, w, h) dalam ruang desain ----------
export const ASSET = {
  profile: [8, 6, 376, 150],
  currency: [466, 12, 384, 95],
  settings: [846, 16, 76, 84],
  back: [16, 146, 100, 100],
  title: [237, 122, 451, 142],
  mission: [662, 105, 279, 150],
  koleksi: [5, 1315, 300, 150],
  island1: [39, 217, 472, 448],
  island2: [445, 405, 477, 433],
  island3: [31, 677, 473, 476],
  island4: [520, 849, 418, 401],
  island5: [257, 1078, 442, 444],
  hero: [145, 415, 146, 146],
  navHome: [96, 1547, 76, 77],
  navPeta: [278, 1548, 49, 76],
  navPrestasi: [434, 1548, 72, 76],
  navMateri: [609, 1548, 58, 76],
  navProfil: [783, 1546, 50, 78],
} as const;

/** Posisi Si Segitiga (orang keju) di masing-masing level pulau 1 */
export interface HeroPosition {
  box: [number, number, number, number];
  hit: [number, number, number, number];
  bubble: [number, number];
}

export const HERO_POSITIONS: Record<number, HeroPosition> = {
  1: {
    box: [145, 415, 146, 146],
    hit: [178, 452, 76, 90],
    bubble: [60, 360],
  },
  2: {
    box: [210, 418, 146, 146],
    hit: [245, 452, 76, 90],
    bubble: [150, 355],
  },
  3: {
    box: [321, 436, 146, 146],
    hit: [356, 470, 76, 90],
    bubble: [250, 365],
  },
};

/** Garis putus-putus penghubung level sesuai kontur jalan pulau */
export interface MapPathSegment {
  id: string;
  fromLevel: number;
  toLevel: number;
  d: string;
}

export const MAP_PATH_SEGMENTS: MapPathSegment[] = [
  {
    id: 'entry-to-1',
    fromLevel: 0,
    toLevel: 1,
    d: 'M 152 522 C 151 500, 149 478, 147.4 456.8',
  },
  {
    id: '1-to-2',
    fromLevel: 1,
    toLevel: 2,
    d: 'M 147.4 456.8 C 192 458.5, 238 456.5, 283.4 455.9',
  },
  {
    id: '2-to-3',
    fromLevel: 2,
    toLevel: 3,
    d: 'M 283.4 455.9 C 320 457.0, 358 464.5, 394.4 473.6',
  },
  {
    id: '3-to-bridge',
    fromLevel: 3,
    toLevel: 4,
    d: 'M 394.4 473.6 C 424 479, 452 496, 478 516',
  },
];

/** Banner pulau (area ketuk). */
export const BANNERS: { id: number; name: string; rect: [number, number, number, number] }[] = [
  { id: 1, name: 'Pulau Bentuk - Mengenal bentuk dasar', rect: [57, 263, 326, 116] },
  { id: 2, name: 'Hutan Segi Empat', rect: [532, 387, 334, 108] },
  { id: 3, name: 'Pegunungan Segitiga', rect: [76, 698, 328, 115] },
  { id: 4, name: 'Danau Lingkaran', rect: [555, 827, 326, 113] },
  { id: 5, name: 'Kastil Geometri', rect: [267, 1145, 307, 117] },
];

/** Pusat node level 1-3 (pulau 1) = pusat sprite node. */
export const PLAYABLE_NODES: { id: number; x: number; y: number }[] = [
  { id: 1, x: 147.4, y: 456.8 },
  { id: 2, x: 283.4, y: 455.9 },
  { id: 3, x: 394.4, y: 473.6 },
];
/** Posisi bintang relatif terhadap pusat node: kiri, tengah, kanan. */
export const STAR_OFFSETS: [number, number][] = [
  [-32, -49],
  [2.5, -57.5],
  [37.5, -48],
];
export const STAR_ROT = [-9, 0, 9];
/** Posisi angka relatif pusat node tiap status. */
export const DIGIT_OFFSET = { active: [1.8, -0.6], normal: [0.8, -0.2], locked: [1.5, 4.9] } as const;

/** Node terkunci di pulau 2-5 (gambar aslinya sudah menyatu di pulau). Pusat lingkaran luar. */
export interface LockedNode {
  n: number;
  x: number;
  y: number;
  hint?: string;
}
export const LOCKED_NODES: LockedNode[] = [
  { n: 7, x: 619.5, y: 561.5, hint: '🔒 Hutan Segi Empat terbuka setelah menyelesaikan Pulau Bentuk!' },
  { n: 8, x: 695.5, y: 596.5, hint: '🔒 Selesaikan level sebelumnya untuk membuka Level 8!' },
  { n: 9, x: 790.5, y: 601.5, hint: '🔒 Level 9 masih terkunci!' },
  { n: 10, x: 586.5, y: 653.5 },
  { n: 11, x: 706.5, y: 685.5 },
  { n: 12, x: 829.5, y: 676.5 },
  { n: 13, x: 162.5, y: 897.5, hint: '🔒 Pegunungan Segitiga terbuka setelah Hutan Segi Empat!' },
  { n: 14, x: 284.5, y: 882.5 },
  { n: 15, x: 394.5, y: 895.5 },
  { n: 16, x: 175.5, y: 980.5 },
  { n: 17, x: 274.5, y: 976.5 },
  { n: 18, x: 372.5, y: 981.5 },
  { n: 19, x: 628.5, y: 1018.5, hint: '🔒 Danau Lingkaran terbuka mulai Level 19!' },
  { n: 20, x: 727.5, y: 1043.5 },
  { n: 21, x: 835.5, y: 1016.5 },
  { n: 22, x: 651.5, y: 1092.5 },
  { n: 23, x: 757.5, y: 1107.5 },
  { n: 24, x: 851.5, y: 1087.5 },
  { n: 25, x: 384.5, y: 1333.5, hint: '🔒 Kastil Geometri adalah tantangan pamungkas!' },
  { n: 26, x: 475, y: 1337 },
  { n: 27, x: 566.5, y: 1332.5 },
  { n: 28, x: 391.5, y: 1390.5 },
  { n: 29, x: 474.5, y: 1405.5 },
  { n: 30, x: 566, y: 1403 },
];

/**
 * Perbaikan bug angka ganda pada gambar referensi Pulau 2
 * (tertulis 7, 8, 9, 8, 12, 12 -> seharusnya 7, 8, 9, 10, 11, 12).
 * Angka lama ditutup tambalan sewarna badan node lalu angka benar digambar di atasnya.
 */
export const NUMBER_FIXES: { n: number; x: number; y: number }[] = [
  { n: 10, x: 588, y: 663.5 },
  { n: 11, x: 708, y: 695.5 },
];

/** Bilah navigasi bawah. */
export const NAV = {
  bar: [37, 1523, 867, 149],
  highlight: [234, 1526, 137, 112],
  tabs: [130, 302.5, 464, 626, 793],
  tabW: 150,
  tabY: 1526,
  tabH: 136,
} as const;

/** Teks dan bar dinamis pada kartu HUD. */
export const HUD = {
  name: { x: 156, y: 68, size: 25.5 },
  level: { x: 156, y: 119.5, size: 21 },
  xpTrack: { x: 155, y: 89, w: 187, h: 16 },
  stars: { x: 599, y: 56, size: 25 },
  gems: { x: 781, y: 56, size: 25 },
  missionText: { x: 889, y: 214.5, size: 15 },
  missionTrack: { x: 757, y: 209, w: 112, h: 12 },
};
