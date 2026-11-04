import { evaluateDeucesWildHand } from "../utils/evaluateDeucesWildHand";
import { evaluateDoubleDoubleBonusHand } from "../utils/evaluateDoubleDoubleBonusHand";
import {
  DEUCES_WILD_HAND_DISPLAY_NAMES,
  DEUCES_WILD_PAYOUTS_PER_BET,
} from "./deucesWildConfig";
import {
  HAND_DISPLAY_NAMES,
  PAYOUTS_PER_BET,
} from "./doubleDoubleBonusConfig";
import {
  type BetAmount,
} from "./gameConfig";

export type GameId = "double-double-bonus" | "deuces-wild-double-bonus";
export type HandRank = string;
export type GamePayoutTable = Record<
  BetAmount,
  Readonly<Record<HandRank, number>>
>;

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
    payoutsPerBet: PAYOUTS_PER_BET,
    evaluateHand: evaluateDoubleDoubleBonusHand,
    getCardAsset: getStandardCardAsset,
  },
  "deuces-wild-double-bonus": {
    id: "deuces-wild-double-bonus",
    name: "DEUCES WILD DOUBLE BONUS",
    image: "DWDB.png",
    handNames: DEUCES_WILD_HAND_DISPLAY_NAMES,
    payoutsPerBet: DEUCES_WILD_PAYOUTS_PER_BET,
    evaluateHand: evaluateDeucesWildHand,
    getCardAsset: getDeucesWildCardAsset,
  },
};
