import { describe, expect, it } from "vitest";
import { LOOSE_DEUCES_HAND_TYPES as HAND } from "../config/looseDeucesConfig";
import { evaluateLooseDeucesHand } from "./evaluateLooseDeucesHand";

describe("evaluateLooseDeucesHand", () => {
  it.each([
    [[8, 9, 10, 11, 12], HAND.ROYAL_FLUSH],
    [[0, 13, 26, 39, 12], HAND.FOUR_DEUCES],
    [[0, 8, 9, 10, 11], HAND.WILD_ROYAL_FLUSH],
    [[7, 20, 33, 0, 13], HAND.FIVE_OF_A_KIND],
    [[13, 14, 15, 16, 17], HAND.STRAIGHT_FLUSH],
    [[1, 14, 27, 40, 5], HAND.FOUR_OF_A_KIND],
    [[1, 14, 27, 2, 15], HAND.FULL_HOUSE],
    [[1, 3, 5, 7, 9], HAND.FLUSH],
    [[0, 14, 2, 16, 4], HAND.STRAIGHT],
    [[1, 14, 27, 4, 7], HAND.THREE_OF_A_KIND],
    [[1, 5, 9, 13, 17], "high_card"],
  ] as const)("evaluates %j as %s", (cards, expectedHand) => {
    expect(evaluateLooseDeucesHand(cards)).toBe(expectedHand);
  });

  it("preserves the wild-deuce evaluator's input validation", () => {
    expect(() => evaluateLooseDeucesHand([0, 1, 2, 3])).toThrow(RangeError);
  });
});
