import type { BetAmount } from "./gameConfig";

export const DEUCES_WILD_HAND_TYPES = {
  ROYAL_FLUSH_NO_DEUCES: "royal_flush_no_deuces",
  FOUR_DEUCES_WITH_ACE: "four_deuces_with_ace",
  FOUR_DEUCES: "four_deuces",
  ROYAL_FLUSH_WITH_DEUCES: "royal_flush_with_deuces",
  FIVE_ACES: "five_aces",
  FIVE_THREES_FOURS_FIVES: "five_threes_fours_fives",
  FIVE_SIXES_THRU_KINGS: "five_sixes_thru_kings",
  STRAIGHT_FLUSH: "straight_flush",
  FOUR_OF_A_KIND: "four_of_a_kind",
  FULL_HOUSE: "full_house",
  FLUSH: "flush",
  STRAIGHT: "straight",
  THREE_OF_A_KIND: "three_of_a_kind",
} as const;

type DeucesWildHand =
  (typeof DEUCES_WILD_HAND_TYPES)[keyof typeof DEUCES_WILD_HAND_TYPES];

export const DEUCES_WILD_HAND_DISPLAY_NAMES: Record<DeucesWildHand, string> = {
  [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_NO_DEUCES]: "ROYAL FLUSH NO DEUCES",
  [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES_WITH_ACE]: "4 DEUCES PLUS ACE",
  [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES]: "4 DEUCES",
  [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_WITH_DEUCES]: "ROYAL FLUSH W/ DEUCES",
  [DEUCES_WILD_HAND_TYPES.FIVE_ACES]: "5 ACES",
  [DEUCES_WILD_HAND_TYPES.FIVE_THREES_FOURS_FIVES]: "5 3s 4s 5s",
  [DEUCES_WILD_HAND_TYPES.FIVE_SIXES_THRU_KINGS]: "5 6s THRU Ks",
  [DEUCES_WILD_HAND_TYPES.STRAIGHT_FLUSH]: "STRAIGHT FLUSH",
  [DEUCES_WILD_HAND_TYPES.FOUR_OF_A_KIND]: "4 OF A KIND",
  [DEUCES_WILD_HAND_TYPES.FULL_HOUSE]: "FULL HOUSE",
  [DEUCES_WILD_HAND_TYPES.FLUSH]: "FLUSH",
  [DEUCES_WILD_HAND_TYPES.STRAIGHT]: "STRAIGHT",
  [DEUCES_WILD_HAND_TYPES.THREE_OF_A_KIND]: "3 OF A KIND",
};

const PAYOUT_ROWS = [
  {
    hand: DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_NO_DEUCES,
    payouts: [250, 500, 750, 1000, 4000],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FOUR_DEUCES_WITH_ACE,
    payouts: [400, 800, 1200, 1600, 2000],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FOUR_DEUCES,
    payouts: [200, 400, 600, 800, 1000],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_WITH_DEUCES,
    payouts: [25, 50, 75, 100, 125],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FIVE_ACES,
    payouts: [160, 320, 480, 640, 800],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FIVE_THREES_FOURS_FIVES,
    payouts: [50, 100, 150, 200, 250],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FIVE_SIXES_THRU_KINGS,
    payouts: [20, 40, 60, 80, 100],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.STRAIGHT_FLUSH,
    payouts: [9, 18, 27, 36, 45],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FOUR_OF_A_KIND,
    payouts: [4, 8, 12, 16, 20],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FULL_HOUSE,
    payouts: [3, 6, 9, 12, 15],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.FLUSH,
    payouts: [2, 4, 6, 8, 10],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.STRAIGHT,
    payouts: [1, 2, 3, 4, 5],
  },
  {
    hand: DEUCES_WILD_HAND_TYPES.THREE_OF_A_KIND,
    payouts: [1, 2, 3, 4, 5],
  },
] as const satisfies readonly {
  hand: DeucesWildHand;
  payouts: readonly [number, number, number, number, number];
}[];

function getPayoutsForBet(betIndex: number): Record<DeucesWildHand, number> {
  return Object.fromEntries(
    PAYOUT_ROWS.map(({ hand, payouts }) => [hand, payouts[betIndex]]),
  ) as Record<DeucesWildHand, number>;
}

export const DEUCES_WILD_PAYOUTS_PER_BET: Record<
  BetAmount,
  Record<DeucesWildHand, number>
> = {
  1: getPayoutsForBet(0),
  2: getPayoutsForBet(1),
  3: getPayoutsForBet(2),
  4: getPayoutsForBet(3),
  5: getPayoutsForBet(4),
};
