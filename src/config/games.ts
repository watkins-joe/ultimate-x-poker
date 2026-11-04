import { evaluateDeucesWildHand } from "../utils/evaluateDeucesWildHand";
import { evaluateDoubleDoubleBonusHand } from "../utils/evaluateDoubleDoubleBonusHand";
import {
  DEUCES_WILD_HAND_DISPLAY_NAMES,
  DEUCES_WILD_HAND_TYPES,
  DEUCES_WILD_PAYOUTS_PER_BET,
} from "./deucesWildConfig";
import {
  HAND_DISPLAY_NAMES,
  HAND_TYPES,
  PAYOUTS_PER_BET,
} from "./doubleDoubleBonusConfig";
import { BETTING_OPTIONS, type BaseBetAmount, type BetAmount } from "./gameConfig";

export type GameId = "double-double-bonus" | "deuces-wild-double-bonus";
export type HandRank = string;
export type GamePayoutTable = Record<
  BetAmount,
  Readonly<Record<HandRank, number>>
>;
type BaseGamePayoutTable = Record<
  BaseBetAmount,
  Readonly<Record<HandRank, number>>
>;

function extendPayoutsToTenCredits(
  payouts: BaseGamePayoutTable,
): GamePayoutTable {
  const extended = { ...payouts } as GamePayoutTable;

  for (const bet of BETTING_OPTIONS) {
    if (bet <= 5) continue;

    extended[bet] = Object.fromEntries(
      Object.entries(payouts[5]).map(([hand, payout]) => [
        hand,
        Math.round((payout * bet) / 5),
      ]),
    );
  }

  return extended;
}

export interface CardAsset {
  src: string;
  alt: string;
}

export interface GameDefinition {
  id: GameId;
  name: string;
  image: string;
  handNames: Readonly<Record<HandRank, string>>;
  payoutsPerBet: GamePayoutTable;
  multiplierByHand: Readonly<Partial<Record<HandRank, number>>>;
  evaluateHand: (cardIds: readonly number[]) => HandRank;
  getCardAsset: (cardId: number) => CardAsset;
}

function getStandardCardAsset(cardId: number): CardAsset {
  const filename = `${String(cardId).padStart(2, "0")}.png`;
  return { src: `/assets/cards/${filename}`, alt: "Card Face" };
}

function getDeucesWildCardAsset(cardId: number): CardAsset {
  const isDeuce = cardId % 13 === 0;
  const filename = isDeuce
    ? `${cardId}w.png`
    : `${String(cardId).padStart(2, "0")}.png`;
  return {
    src: `/assets/cards/${filename}`,
    alt: isDeuce ? "Wild Deuce" : "Card Face",
  };
}

export const DEFAULT_GAME_ID: GameId = "double-double-bonus";

export const GAMES: Record<GameId, GameDefinition> = {
  "double-double-bonus": {
    id: "double-double-bonus",
    name: "DOUBLE DBL BONUS",
    image: "DDB.png",
    handNames: HAND_DISPLAY_NAMES,
    payoutsPerBet: extendPayoutsToTenCredits(PAYOUTS_PER_BET),
    multiplierByHand: {
      [HAND_TYPES.ROYAL_FLUSH]: 2,
      [HAND_TYPES.STRAIGHT_FLUSH]: 2,
      [HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR]: 2,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR]: 2,
      [HAND_TYPES.FOUR_ACES]: 2,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS]: 2,
      [HAND_TYPES.FOUR_FIVES_THRU_KINGS]: 2,
      [HAND_TYPES.FULL_HOUSE]: 7,
      [HAND_TYPES.FLUSH]: 6,
      [HAND_TYPES.STRAIGHT]: 5,
      [HAND_TYPES.THREE_OF_A_KIND]: 4,
      [HAND_TYPES.TWO_PAIR]: 3,
      [HAND_TYPES.JACKS_OR_BETTER]: 2,
    },
    evaluateHand: evaluateDoubleDoubleBonusHand,
    getCardAsset: getStandardCardAsset,
  },
  "deuces-wild-double-bonus": {
    id: "deuces-wild-double-bonus",
    name: "DEUCES WILD DOUBLE BONUS",
    image: "DWDB.png",
    handNames: DEUCES_WILD_HAND_DISPLAY_NAMES,
    payoutsPerBet: extendPayoutsToTenCredits(DEUCES_WILD_PAYOUTS_PER_BET),
    multiplierByHand: {
      [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_NO_DEUCES]: 2,
      [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES_WITH_ACE]: 2,
      [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES]: 2,
      [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_WITH_DEUCES]: 2,
      [DEUCES_WILD_HAND_TYPES.FIVE_ACES]: 2,
      [DEUCES_WILD_HAND_TYPES.FIVE_THREES_FOURS_FIVES]: 2,
      [DEUCES_WILD_HAND_TYPES.FIVE_SIXES_THRU_KINGS]: 2,
      [DEUCES_WILD_HAND_TYPES.STRAIGHT_FLUSH]: 2,
      [DEUCES_WILD_HAND_TYPES.FOUR_OF_A_KIND]: 2,
      [DEUCES_WILD_HAND_TYPES.FULL_HOUSE]: 7,
      [DEUCES_WILD_HAND_TYPES.FLUSH]: 6,
      [DEUCES_WILD_HAND_TYPES.STRAIGHT]: 5,
      [DEUCES_WILD_HAND_TYPES.THREE_OF_A_KIND]: 4,
    },
    evaluateHand: evaluateDeucesWildHand,
    getCardAsset: getDeucesWildCardAsset,
  },
};
