import { HAND_TYPES } from "../config/doubleDoubleBonusConfig";

type HandType = (typeof HAND_TYPES)[keyof typeof HAND_TYPES];

const CARD_COUNT = 5;
const CARDS_PER_SUIT = 13;

export function evaluateDoubleDoubleBonusHand(
  cardIds: readonly number[],
): HandType {
  if (cardIds.length !== CARD_COUNT) {
    throw new RangeError(
      `A poker hand must contain exactly ${CARD_COUNT} cards.`,
    );
  }
  if (
    cardIds.some(
      (cardId) =>
        !Number.isInteger(cardId) || cardId < 0 || cardId >= 4 * CARDS_PER_SUIT,
    )
  ) {
    throw new RangeError("Card IDs must be integers from 0 through 51.");
  }
  if (new Set(cardIds).size !== CARD_COUNT) {
    throw new Error("A poker hand cannot contain duplicate cards.");
  }

  const ranks = cardIds.map((cardId) => (cardId % CARDS_PER_SUIT) + 2);
  const suits = cardIds.map((cardId) => Math.floor(cardId / CARDS_PER_SUIT));
  const rankCounts = new Map<number, number>();
  for (const rank of ranks) {
    rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
  }

  const counts = [...rankCounts.values()].sort((left, right) => left - right);
  const quadRank = [...rankCounts].find(([, count]) => count === 4)?.[0];
  const kickerRank = [...rankCounts].find(([, count]) => count === 1)?.[0];
  const isFlush = suits.every((suit) => suit === suits[0]);
  const sortedRanks = [...rankCounts.keys()].sort(
    (left, right) => left - right,
  );
  const isStraight =
    rankCounts.size === CARD_COUNT &&
    (sortedRanks.join(",") === "2,3,4,5,14" ||
      sortedRanks[CARD_COUNT - 1] - sortedRanks[0] === 4);
  const isRoyalFlush =
    isFlush && [10, 11, 12, 13, 14].every((rank) => rankCounts.has(rank));

  if (isRoyalFlush) return HAND_TYPES.ROYAL_FLUSH;
  if (isFlush && isStraight) return HAND_TYPES.STRAIGHT_FLUSH;
  if (
    quadRank === 14 &&
    kickerRank !== undefined &&
    [2, 3, 4].includes(kickerRank)
  ) {
    return HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR;
  }
  if (quadRank === 14) return HAND_TYPES.FOUR_ACES;
  if (
    quadRank !== undefined &&
    [2, 3, 4].includes(quadRank) &&
    kickerRank !== undefined
  ) {
    return [2, 3, 4, 14].includes(kickerRank)
      ? HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR
      : HAND_TYPES.FOUR_TWOS_THREE_FOURS;
  }
  if (quadRank !== undefined && quadRank >= 5 && quadRank <= 13) {
    return HAND_TYPES.FOUR_FIVES_THRU_KINGS;
  }
  if (counts.join(",") === "2,3") return HAND_TYPES.FULL_HOUSE;
  if (isFlush) return HAND_TYPES.FLUSH;
  if (isStraight) return HAND_TYPES.STRAIGHT;
  if (counts.join(",") === "1,1,3") return HAND_TYPES.THREE_OF_A_KIND;
  if (counts.filter((count) => count === 2).length === 2) {
    return HAND_TYPES.TWO_PAIR;
  }
  const pairRank = [...rankCounts].find(([, count]) => count === 2)?.[0];
  if (pairRank !== undefined && pairRank >= 11) {
    return HAND_TYPES.JACKS_OR_BETTER;
  }
  return HAND_TYPES.HIGH_CARD;
}
