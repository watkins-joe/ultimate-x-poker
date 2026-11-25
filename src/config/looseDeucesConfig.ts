import type { BaseBetAmount } from "./gameConfig";

export const LOOSE_DEUCES_HAND_TYPES = {
  ROYAL_FLUSH: "loose_deuces_royal_flush",
  FOUR_DEUCES: "loose_deuces_four_deuces",
  WILD_ROYAL_FLUSH: "loose_deuces_wild_royal_flush",
  FIVE_OF_A_KIND: "loose_deuces_five_of_a_kind",
  STRAIGHT_FLUSH: "loose_deuces_straight_flush",
  FOUR_OF_A_KIND: "loose_deuces_four_of_a_kind",
  FULL_HOUSE: "loose_deuces_full_house",
  FLUSH: "loose_deuces_flush",
  STRAIGHT: "loose_deuces_straight",
  THREE_OF_A_KIND: "loose_deuces_three_of_a_kind",
} as const;

type LooseDeucesHand =
  (typeof LOOSE_DEUCES_HAND_TYPES)[keyof typeof LOOSE_DEUCES_HAND_TYPES];

export const LOOSE_DEUCES_HAND_DISPLAY_NAMES: Record<
  LooseDeucesHand,
  string
> = {
  [LOOSE_DEUCES_HAND_TYPES.ROYAL_FLUSH]: "Royal Flush",
  [LOOSE_DEUCES_HAND_TYPES.FOUR_DEUCES]: "4 Deuces",
  [LOOSE_DEUCES_HAND_TYPES.WILD_ROYAL_FLUSH]: "Wild Royal w/ 2s",
  [LOOSE_DEUCES_HAND_TYPES.FIVE_OF_A_KIND]: "5 of a Kind",
  [LOOSE_DEUCES_HAND_TYPES.STRAIGHT_FLUSH]: "Straight Flush",
  [LOOSE_DEUCES_HAND_TYPES.FOUR_OF_A_KIND]: "4 of a Kind",
  [LOOSE_DEUCES_HAND_TYPES.FULL_HOUSE]: "Full House",
  [LOOSE_DEUCES_HAND_TYPES.FLUSH]: "Flush",
  [LOOSE_DEUCES_HAND_TYPES.STRAIGHT]: "Straight",
  [LOOSE_DEUCES_HAND_TYPES.THREE_OF_A_KIND]: "3 of a Kind",
};

const PAYOUT_ROWS = [
  {
    hand: LOOSE_DEUCES_HAND_TYPES.ROYAL_FLUSH,
    payouts: [300, 600, 900, 1200, 4000],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.FOUR_DEUCES,
    payouts: [500, 1000, 1500, 2000, 2500],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.WILD_ROYAL_FLUSH,
    payouts: [25, 50, 75, 100, 125],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.FIVE_OF_A_KIND,
    payouts: [15, 30, 45, 60, 75],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.STRAIGHT_FLUSH,
    payouts: [5, 10, 15, 20, 25],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.FOUR_OF_A_KIND,
    payouts: [4, 8, 12, 16, 20],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.FULL_HOUSE,
    payouts: [3, 6, 9, 12, 15],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.FLUSH,
    payouts: [2, 4, 6, 8, 10],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.STRAIGHT,
    payouts: [2, 4, 6, 8, 10],
  },
  {
    hand: LOOSE_DEUCES_HAND_TYPES.THREE_OF_A_KIND,
    payouts: [1, 2, 3, 4, 5],
  },
] as const satisfies readonly {
  hand: LooseDeucesHand;
  payouts: readonly [number, number, number, number, number];
}[];

function getPayoutsForBet(betIndex: number): Record<LooseDeucesHand, number> {
  return Object.fromEntries(
    PAYOUT_ROWS.map(({ hand, payouts }) => [hand, payouts[betIndex]]),
  ) as Record<LooseDeucesHand, number>;
}

export const LOOSE_DEUCES_PAYOUTS_PER_BET: Record<
  BaseBetAmount,
  Record<LooseDeucesHand, number>
> = {
  1: getPayoutsForBet(0),
  2: getPayoutsForBet(1),
  3: getPayoutsForBet(2),
  4: getPayoutsForBet(3),
  5: getPayoutsForBet(4),
};

export const LOOSE_DEUCES_MULTIPLIER_BY_HAND: Readonly<
  Partial<Record<LooseDeucesHand, number>>
> = {
  [LOOSE_DEUCES_HAND_TYPES.ROYAL_FLUSH]: 2,
  [LOOSE_DEUCES_HAND_TYPES.FOUR_DEUCES]: 2,
  [LOOSE_DEUCES_HAND_TYPES.WILD_ROYAL_FLUSH]: 2,
  [LOOSE_DEUCES_HAND_TYPES.FIVE_OF_A_KIND]: 2,
  [LOOSE_DEUCES_HAND_TYPES.STRAIGHT_FLUSH]: 12,
  [LOOSE_DEUCES_HAND_TYPES.FOUR_OF_A_KIND]: 7,
  [LOOSE_DEUCES_HAND_TYPES.FULL_HOUSE]: 6,
  [LOOSE_DEUCES_HAND_TYPES.FLUSH]: 4,
  [LOOSE_DEUCES_HAND_TYPES.STRAIGHT]: 3,
  [LOOSE_DEUCES_HAND_TYPES.THREE_OF_A_KIND]: 4,
};
