export const BETTING_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 100,
] as const;
export const DEFAULT_BETTING_INDEX = 0;
export type BetAmount = (typeof BETTING_OPTIONS)[number];
export type BaseBetAmount = 1 | 2 | 3 | 4 | 5;

export function getActiveHandCount(bet: BetAmount): number {
  return Math.min(bet, 10);
}

export function getPaytableBetAmount(bet: BetAmount): BaseBetAmount {
  if (bet <= 10) return 1;
  if (bet === 20) return 2;
  if (bet === 30) return 3;
  if (bet === 40) return 4;
  return 5;
}

export const GAME_STATES = {
  Game_Over: "GAME_OVER",
  Awaiting_Holds: "AWAITING_HOLDS",
} as const;

export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];

interface DenomInfo {
  valueCents: number;
  image: string;
}

export type Denomination =
  | "1c"
  | "2c"
  | "5c"
  | "10c"
  | "25c"
  | "1d"
  | "5d"
  | "10d"
  | "25d"
  | "50d"
  | "100d"
  | "250d"
  | "500d"
  | "1000d"
  | "2000d"
  | "5000d"
  | "50000d"
  | "100000d"
  | "250000d"
  | "1000000d"
  | "2000000d"
  | "5000000d";

export const DENOMINATIONS: Record<Denomination, DenomInfo> = {
  "1c": { valueCents: 1, image: "1c.png" },
  "2c": { valueCents: 2, image: "2c.png" },
  "5c": { valueCents: 5, image: "5c.png" },
  "10c": { valueCents: 10, image: "10c.png" },
  "25c": { valueCents: 25, image: "25c.png" },
  "1d": { valueCents: 100, image: "1d.png" },
  "5d": { valueCents: 500, image: "5d.png" },
  "10d": { valueCents: 1000, image: "10d.png" },
  "25d": { valueCents: 2500, image: "25d.png" },
  "50d": { valueCents: 5000, image: "50d.png" },
  "100d": { valueCents: 10000, image: "100d.png" },
  "250d": { valueCents: 25000, image: "250d.png" },
  "500d": { valueCents: 50000, image: "500d.png" },
  "1000d": { valueCents: 100000, image: "1000d.png" },
  "2000d": { valueCents: 200000, image: "2000d.png" },
  "5000d": { valueCents: 500000, image: "5000d.png" },
  "50000d": { valueCents: 5000000, image: "50000d.png" },
  "100000d": { valueCents: 10000000, image: "100000d.png" },
  "250000d": { valueCents: 25000000, image: "250000d.png" },
  "1000000d": { valueCents: 100000000, image: "1000000d.png" },
  "2000000d": { valueCents: 200000000, image: "2000000d.png" },
  "5000000d": { valueCents: 500000000, image: "5000000d.png" },
} as const;
