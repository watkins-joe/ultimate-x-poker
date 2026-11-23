import { describe, expect, it } from "vitest";
import { HAND_TYPES } from "./doubleDoubleBonusConfig";
import { GAMES } from "./games";
import {
  TRIPLE_DOUBLE_BONUS_HAND_DISPLAY_NAMES,
  TRIPLE_DOUBLE_BONUS_PAYOUTS_PER_BET,
} from "./tripleDoubleBonusConfig";

describe("Triple Double Bonus configuration", () => {
  it("matches the paytable payout values for each coin bet", () => {
    expect(TRIPLE_DOUBLE_BONUS_PAYOUTS_PER_BET[1]).toEqual({
      [HAND_TYPES.ROYAL_FLUSH]: 400,
      [HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR]: 400,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR]: 400,
      [HAND_TYPES.FOUR_ACES]: 160,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS]: 80,
      [HAND_TYPES.FOUR_FIVES_THRU_KINGS]: 50,
      [HAND_TYPES.STRAIGHT_FLUSH]: 50,
      [HAND_TYPES.FULL_HOUSE]: 9,
      [HAND_TYPES.FLUSH]: 6,
      [HAND_TYPES.STRAIGHT]: 4,
      [HAND_TYPES.THREE_OF_A_KIND]: 2,
      [HAND_TYPES.TWO_PAIR]: 1,
      [HAND_TYPES.JACKS_OR_BETTER]: 1,
    });
    expect(TRIPLE_DOUBLE_BONUS_PAYOUTS_PER_BET[5]).toEqual({
      [HAND_TYPES.ROYAL_FLUSH]: 4000,
      [HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR]: 4000,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR]: 2000,
      [HAND_TYPES.FOUR_ACES]: 800,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS]: 400,
      [HAND_TYPES.FOUR_FIVES_THRU_KINGS]: 250,
      [HAND_TYPES.STRAIGHT_FLUSH]: 250,
      [HAND_TYPES.FULL_HOUSE]: 45,
      [HAND_TYPES.FLUSH]: 30,
      [HAND_TYPES.STRAIGHT]: 20,
      [HAND_TYPES.THREE_OF_A_KIND]: 10,
      [HAND_TYPES.TWO_PAIR]: 5,
      [HAND_TYPES.JACKS_OR_BETTER]: 5,
    });
  });

  it("lists hands in the screenshot's paytable order", () => {
    expect(Object.keys(TRIPLE_DOUBLE_BONUS_HAND_DISPLAY_NAMES)).toEqual([
      HAND_TYPES.ROYAL_FLUSH,
      HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR,
      HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR,
      HAND_TYPES.FOUR_ACES,
      HAND_TYPES.FOUR_TWOS_THREE_FOURS,
      HAND_TYPES.FOUR_FIVES_THRU_KINGS,
      HAND_TYPES.STRAIGHT_FLUSH,
      HAND_TYPES.FULL_HOUSE,
      HAND_TYPES.FLUSH,
      HAND_TYPES.STRAIGHT,
      HAND_TYPES.THREE_OF_A_KIND,
      HAND_TYPES.TWO_PAIR,
      HAND_TYPES.JACKS_OR_BETTER,
    ]);
  });

  it("registers the new game artwork, hand evaluator, and multipliers", () => {
    const game = GAMES["triple-double-bonus"];

    expect(game.name).toBe("TRIPLE DBL BONUS");
    expect(game.image).toBe("TDB.png");
    expect(game.evaluateHand).toBe(GAMES["double-double-bonus"].evaluateHand);
    expect(game.multiplierByHand).toEqual({
      [HAND_TYPES.ROYAL_FLUSH]: 2,
      [HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR]: 2,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS_WITH_ACE_TWO_THREE_FOUR]: 2,
      [HAND_TYPES.FOUR_ACES]: 2,
      [HAND_TYPES.FOUR_TWOS_THREE_FOURS]: 2,
      [HAND_TYPES.FOUR_FIVES_THRU_KINGS]: 2,
      [HAND_TYPES.STRAIGHT_FLUSH]: 2,
      [HAND_TYPES.FULL_HOUSE]: 12,
      [HAND_TYPES.FLUSH]: 10,
      [HAND_TYPES.STRAIGHT]: 8,
      [HAND_TYPES.THREE_OF_A_KIND]: 4,
      [HAND_TYPES.TWO_PAIR]: 3,
      [HAND_TYPES.JACKS_OR_BETTER]: 2,
    });
  });
});
