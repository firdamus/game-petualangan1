// ==========================================================
// MESIN FISIK MINI GAME "PULAU BENTUK" (fungsi murni, tanpa React)
//
// Dunia berukuran 100 x 180 unit (x ke kanan, y ke ATAS dari dasar layar).
// Satu unit x = 1% lebar layar game; satu unit y = 1/1.8 % tinggi layar game.
// Posisi pemain: x = titik tengah badan, y = posisi kaki (permukaan pijakan).
// ==========================================================

export const WORLD_W = 100;
export const WORLD_H = 180;

export interface Platform {
  id: string;
  from: number; // batas kiri area pijak (x)
  to: number; // batas kanan area pijak (x)
  top: number; // tinggi permukaan (y)
  depth: number; // tebal badan batu pulau (untuk tabrakan samping & gambar)
}

export const MIN_X = 3;
export const MAX_X = 97;
export const DEATH_Y = 26; // kaki di bawah garis ini = jatuh ke air
export const WATER_Y = 22; // permukaan air (untuk gambar & efek cipratan)
export const MOVE_SPEED = 46; // unit per detik
export const GRAVITY = 900; // unit per detik^2
export const JUMP_VELOCITY = 270; // tinggi lompatan ~40 unit
export const HURT_DURATION = 0.55; // detik
export const SAFE_INSET = 3; // titik respawn digeser sedikit dari tepi pulau
/** Toleransi mendarat. HARUS >= margin dinding samping (0.5), kalau lebih kecil ada celah tempat karakter tembus ke badan pulau. */
export const LANDING_TOLERANCE = 0.5;

export const FLAG_REACH = 8;

export interface PlayerState {
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  facingRight: boolean;
  hurtTimer: number; // > 0 : sedang tercebur (input dikunci)
  lastSafeX: number;
  lastSafeY: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean; // permintaan lompat (dikonsumsi oleh loop)
}

export type StepEvent = 'jump' | 'land' | 'splash' | 'respawn';

export function createPlayer(platforms: Platform[]): PlayerState {
  const start = platforms[0];
  const startX = Math.min(start.to - 3, start.from + 7);
  return {
    x: startX,
    y: start.top,
    vy: 0,
    grounded: true,
    facingRight: true,
    hurtTimer: 0,
    lastSafeX: startX,
    lastSafeY: start.top,
  };
}

/** Pulau yang berada tepat di bawah koordinat x (atau null bila celah/air). */
export function platformAt(x: number, platforms: Platform[]): Platform | null {
  for (const p of platforms) {
    if (x >= p.from && x <= p.to) return p;
  }
  return null;
}

/**
 * Satu langkah simulasi. Mengubah `p` langsung (mutasi) dan mengembalikan
 * daftar kejadian untuk suara / efek / state HUD di sisi React.
 */
export function stepPlayer(
  p: PlayerState,
  input: InputState,
  dt: number,
  platforms: Platform[],
): StepEvent[] {
  const events: StepEvent[] = [];

  // --- Sedang tercebur: tunggu lalu respawn di titik aman terakhir ---
  if (p.hurtTimer > 0) {
    p.hurtTimer -= dt;
    input.jump = false;
    if (p.hurtTimer <= 0) {
      p.hurtTimer = 0;
      p.x = p.lastSafeX;
      p.y = p.lastSafeY;
      p.vy = 0;
      p.grounded = true;
      events.push('respawn');
    }
    return events;
  }

  // --- Gerak horizontal ---
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) p.facingRight = dir > 0;

  const prevX = p.x;
  let newX = Math.max(MIN_X, Math.min(MAX_X, prevX + dir * MOVE_SPEED * dt));

  // Tabrakan samping: tidak bisa menembus badan batu pulau
  // (juga berarti tidak bisa "berjalan naik" ke pulau yang lebih tinggi tanpa melompat).
  for (const pl of platforms) {
    const inRockBand = p.y < pl.top - 0.5 && p.y > pl.top - pl.depth;
    if (!inRockBand) continue;
    if (prevX < pl.from && newX >= pl.from) newX = pl.from - 0.01;
    else if (prevX > pl.to && newX <= pl.to) newX = pl.to + 0.01;
  }
  p.x = newX;

  // --- Lompat (hanya saat menapak) ---
  if (input.jump && p.grounded) {
    p.vy = JUMP_VELOCITY;
    p.grounded = false;
    events.push('jump');
  }
  input.jump = false;

  // --- Menapak: cek apakah masih ada pijakan di bawah kaki ---
  if (p.grounded) {
    const under = platformAt(p.x, platforms);
    if (under && Math.abs(under.top - p.y) < 0.5) {
      p.y = under.top;
      p.lastSafeX = Math.max(under.from + SAFE_INSET, Math.min(under.to - SAFE_INSET, p.x));
      p.lastSafeY = under.top;
    } else {
      p.grounded = false; // berjalan keluar tepi -> jatuh
      p.vy = 0;
    }
  }

  // --- Gravitasi / terbang ---
  if (!p.grounded) {
    const prevY = p.y;
    p.vy -= GRAVITY * dt;
    p.y += p.vy * dt;

    if (p.vy <= 0) {
      const under = platformAt(p.x, platforms);
      if (under && prevY >= under.top - LANDING_TOLERANCE && p.y <= under.top) {
        p.y = under.top;
        p.vy = 0;
        p.grounded = true;
        p.lastSafeX = Math.max(under.from + SAFE_INSET, Math.min(under.to - SAFE_INSET, p.x));
        p.lastSafeY = under.top;
        events.push('land');
      }
    }

    if (!p.grounded && p.y <= DEATH_Y) {
      p.y = DEATH_Y;
      p.vy = 0;
      p.hurtTimer = HURT_DURATION;
      events.push('splash');
    }
  }

  return events;
}

// ----------------------------------------------------------
// Benda yang bisa dikumpulkan
// ----------------------------------------------------------
export type ItemKind =
  | 'coin'
  | 'tri'
  | 'square'
  | 'circle'
  | 'rect'
  | 'clock'
  | 'roof'
  | 'tile'
  | 'door'
  | 'wheel';

export interface CollectibleItem {
  id: string;
  kind: ItemKind;
  x: number; // titik tengah
  y: number; // titik tengah
  value: number;
  label: string; // teks umpan balik saat diambil
  name?: string; // nama pendek untuk kartu misi
}

export const PLAYER_SIZE = 13; // lebar & tinggi sprite (unit dunia)
export const PICKUP_RADIUS = 9.5;

/** Benda yang bersentuhan dengan pemain dan belum diambil. */
export function findPickups(
  p: PlayerState,
  collected: ReadonlySet<string>,
  items: CollectibleItem[],
): CollectibleItem[] {
  if (p.hurtTimer > 0) return [];
  const cx = p.x;
  const cy = p.y + PLAYER_SIZE / 2;
  return items.filter(
    (it) => !collected.has(it.id) && Math.hypot(cx - it.x, cy - it.y) < PICKUP_RADIUS,
  );
}

export function isAtFlag(p: PlayerState, flagX: number, flagMinY: number): boolean {
  return p.hurtTimer <= 0 && Math.abs(p.x - flagX) <= FLAG_REACH && p.y >= flagMinY;
}
