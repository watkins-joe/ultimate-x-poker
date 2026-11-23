import type { BaseBetAmount } from "./gameConfig";
import { HAND_TYPES } from "./doubleDoubleBonusConfig";

type WinningHand = Exclude<
  (typeof HAND_TYPES)[keyof typeof HAND_TYPES],
  typeof HAND_TYPES.HIGH_CARD
>;

export const TRIPLE_DOUBLE_BONUS_HAND_DISPLAY_NAMES: Record<
  WinningHand,
  string
> = {
  [HAND_TYPES.ROYAL_FLUSH]: "Royal Flush",
  [HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR]: "4 Aces w/ 2,3,4",
  [HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR]:
    "4 2s, 3s, 4s w/ Ace, 2, 3, 4",
  [HAND_TYPES.FOUR_ACES]: "4 Aces",
  [HAND_TYPES.FOUR_TWOS_THREE_FOURS]: "4 2s, 3s, 4s",
  [HAND_TYPES.FOUR_FIVES_THRU_KINGS]: "4 5s thru Ks",
  [HAND_TYPES.STRAIGHT_FLUSH]: "Straight Flush",
  [HAND_TYPES.FULL_HOUSE]: "Full House",
  [HAND_TYPES.FLUSH]: "Flush",
  [HAND_TYPES.STRAIGHT]: "Straight",
  [HAND_TYPES.THREE_OF_A_KIND]: "3 of a Kind",
  [HAND_TYPES.TWO_PAIR]: "2 Pair",
  [HAND_TYPES.JACKS_OR_BETTER]: "Jacks or Better",
};

const PAYOUT_ROWS = [
  {
    hand: HAND_TYPES.ROYAL_FLUSH,
    payouts: [400, 800, 1200, 1600, 4000],
  },
  {
    hand: HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR,
    payouts: [400, 800, 1200, 1600, 4000],
  },
  {
    hand: HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR,
    payouts: [400, 800, 1200, 1600, 2000],
  },
  {
    hand: HAND_TYPES.FOUR_ACES,
    payouts: [160, 320, 480, 640, 800],
  },
  {
    hand: HAND_TYPES.FOUR_TWOS_THREE_FOURS,
    payouts: [80, 160, 240, 320, 400],
  },
  {
    hand: HAND_TYPES.FOUR_FIVES_THRU_KINGS,
    payouts: [50, 100, 150, 200, 250],
  },
  {
    hand: HAND_TYPES.STRAIGHT_FLUSH,
    payouts: [50, 100, 150, 200, 250],
  },
  {
    hand: HAND_TYPES.FULL_HOUSE,
    payouts: [9, 18, 27, 36, 45],
  },
  {
    hand: HAND_TYPES.FLUSH,
    payouts: [6, 12, 18, 24, 30],
  },
  {
    hand: HAND_TYPES.STRAIGHT,
    payouts: [4, 8, 12, 16, 20],
  },
  {
    hand: HAND_TYPES.THREE_OF_A_KIND,
    payouts: [2, 4, 6, 8, 10],
  },
  {
    hand: HAND_TYPES.TWO_PAIR,
    payouts: [1, 2, 3, 4, 5],
  },
  {
    hand: HAND_TYPES.JACKS_OR_BETTER,
    payouts: [1, 2, 3, 4, 5],
  },
] as const satisfies readonly {
  hand: WinningHand;
  payouts: readonly [number, number, number, number, number];
}[];

function getPayoutsForBet(betIndex: number): Record<WinningHand, number> {
  return Object.fromEntries(
    PAYOUT_ROWS.map(({ hand, payouts }) => [hand, payouts[betIndex]]),
  ) as Record<WinningHand, number>;
}

export const TRIPLE_DOUBLE_BONUS_PAYOUTS_PER_BET: Record<
  BaseBetAmount,
  Record<WinningHand, number>
> = {
  1: getPayoutsForBet(0),
  2: getPayoutsForBet(1),
  3: getPayoutsForBet(2),
  4: getPayoutsForBet(3),
  5: getPayoutsForBet(4),
};
