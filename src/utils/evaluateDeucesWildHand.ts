import { DEUCES_WILD_HAND_TYPES as HAND } from "../config/deucesWildConfig";

type DeucesWildHand =
  (typeof HAND)[keyof typeof HAND] | "high_card";

const CARD_COUNT = 5;
const SUIT_COUNT = 4;
const RANKS_PER_SUIT = 13;
const ACE = 14;
const STRAIGHT_SEQUENCES: readonly (readonly number[])[] = [
  [2, 3, 4, 5, 6],
  [3, 4, 5, 6, 7],
  [4, 5, 6, 7, 8],
  [5, 6, 7, 8, 9],
  [6, 7, 8, 9, 10],
  [7, 8, 9, 10, 11],
  [8, 9, 10, 11, 12],
  [9, 10, 11, 12, 13],
  [10, 11, 12, 13, 14],
  [14, 2, 3, 4, 5],
];

export function evaluateDeucesWildHand(
  cardIds: readonly number[],
): DeucesWildHand {
  if (cardIds.length !== CARD_COUNT) {
    throw new RangeError(`A poker hand must contain exactly ${CARD_COUNT} cards.`);
  }
  if (
    cardIds.some(
      (cardId) =>
        !Number.isInteger(cardId) ||
        cardId < 0 ||
        cardId >= SUIT_COUNT * RANKS_PER_SUIT,
    )
  ) {
    throw new RangeError("Card IDs must be integers from 0 through 51.");
  }
  if (new Set(cardIds).size !== CARD_COUNT) {
    throw new Error("A poker hand cannot contain duplicate cards.");
  }

  const cards = cardIds.map((cardId) => ({
    rank: (cardId % RANKS_PER_SUIT) + 2,
    suit: Math.floor(cardId / RANKS_PER_SUIT),
  }));
  const wildCount = cards.filter(({ rank }) => rank === 2).length;
  const naturalCards = cards.filter(({ rank }) => rank !== 2);
  const naturalRanks = naturalCards.map(({ rank }) => rank);
  const naturalSuits = naturalCards.map(({ suit }) => suit);
  const rankCounts = new Map<number, number>();
  for (const rank of naturalRanks) {
    rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
  }

  const isNaturalRoyalFlush =
    wildCount === 0 &&
    isStraightFlush(naturalRanks, naturalSuits, [[10, 11, 12, 13, 14]]);
  if (isNaturalRoyalFlush) return HAND.ROYAL_FLUSH_NO_DEUCES;

  if (wildCount === 4) {
    return naturalRanks[0] === ACE
      ? HAND.FOUR_DEUCES_WITH_ACE
      : HAND.FOUR_DEUCES;
  }

  if (wildCount > 0 && canCompleteRoyalFlush(naturalRanks, naturalSuits)) {
    return HAND.ROYAL_FLUSH_WITH_DEUCES;
  }

  if (wildCount > 0 && canMakeFiveOfAKind(rankCounts, wildCount, [ACE])) {
    return HAND.FIVE_ACES;
  }
  if (
    wildCount > 0 &&
    canMakeFiveOfAKind(rankCounts, wildCount, [3, 4, 5])
  ) {
    return HAND.FIVE_THREES_FOURS_FIVES;
  }
  if (
    wildCount > 0 &&
    canMakeFiveOfAKind(
      rankCounts,
      wildCount,
      Array.from({ length: 8 }, (_, index) => index + 6),
    )
  ) {
    return HAND.FIVE_SIXES_THRU_KINGS;
  }

  if (isStraightFlush(naturalRanks, naturalSuits)) {
    return HAND.STRAIGHT_FLUSH;
  }

  if (canMakeFourOfAKind(rankCounts, wildCount)) {
    return HAND.FOUR_OF_A_KIND;
  }
  if (canMakeFullHouse(rankCounts, wildCount)) return HAND.FULL_HOUSE;
  if (canMakeFlush(naturalSuits)) return HAND.FLUSH;
  if (canMakeStraight(naturalRanks, wildCount)) return HAND.STRAIGHT;
  if (canMakeThreeOfAKind(rankCounts, wildCount)) {
    return HAND.THREE_OF_A_KIND;
  }

  return "high_card";
}

function canMakeFiveOfAKind(
  rankCounts: ReadonlyMap<number, number>,
  wildCount: number,
  targetRanks: readonly number[],
): boolean {
  return targetRanks.some(
    (rank) =>
      (rankCounts.get(rank) ?? 0) + wildCount === CARD_COUNT &&
      [...rankCounts.keys()].every((naturalRank) => naturalRank === rank),
  );
}

function canMakeFourOfAKind(
  rankCounts: ReadonlyMap<number, number>,
  wildCount: number,
): boolean {
  for (let rank = 2; rank <= ACE; rank += 1) {
    if ((rankCounts.get(rank) ?? 0) + wildCount >= 4) return true;
  }
  return false;
}

function canMakeFullHouse(
  rankCounts: ReadonlyMap<number, number>,
  wildCount: number,
): boolean {
  for (let tripleRank = 2; tripleRank <= ACE; tripleRank += 1) {
    for (let pairRank = 2; pairRank <= ACE; pairRank += 1) {
      if (tripleRank === pairRank) continue;

      const tripleCount = rankCounts.get(tripleRank) ?? 0;
      const pairCount = rankCounts.get(pairRank) ?? 0;
      if (tripleCount > 3 || pairCount > 2) continue;

      const wildsNeeded = 3 - tripleCount + 2 - pairCount;
      if (
        wildsNeeded === wildCount &&
        [...rankCounts.keys()].every(
          (rank) => rank === tripleRank || rank === pairRank,
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function canMakeFlush(naturalSuits: readonly number[]): boolean {
  return naturalSuits.every((suit) => suit === naturalSuits[0]);
}

function canMakeStraight(
  naturalRanks: readonly number[],
  wildCount: number,
): boolean {
  return STRAIGHT_SEQUENCES.some(
    (sequence) =>
      naturalRanks.length + wildCount === CARD_COUNT &&
      new Set(naturalRanks).size === naturalRanks.length &&
      naturalRanks.every((rank) => sequence.includes(rank)),
  );
}

function isStraightFlush(
  naturalRanks: readonly number[],
  naturalSuits: readonly number[],
  sequences: readonly (readonly number[])[] = STRAIGHT_SEQUENCES,
): boolean {
  return (
    naturalSuits.every((suit) => suit === naturalSuits[0]) &&
    sequences.some(
      (sequence) =>
        new Set(naturalRanks).size === naturalRanks.length &&
        naturalRanks.every((rank) => sequence.includes(rank)),
    )
  );
}

function canCompleteRoyalFlush(
  naturalRanks: readonly number[],
  naturalSuits: readonly number[],
): boolean {
  return (
    naturalRanks.length < CARD_COUNT &&
    naturalSuits.every((suit) => suit === naturalSuits[0]) &&
    naturalRanks.every((rank) => rank >= 10 && rank <= ACE) &&
    new Set(naturalRanks).size === naturalRanks.length
  );
}

function canMakeThreeOfAKind(
  rankCounts: ReadonlyMap<number, number>,
  wildCount: number,
): boolean {
  for (let rank = 2; rank <= ACE; rank += 1) {
    if ((rankCounts.get(rank) ?? 0) + wildCount >= 3) return true;
  }
  return false;
}
