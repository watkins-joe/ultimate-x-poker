import { describe, expect, it } from "vitest";
import { HAND_TYPES } from "../config/doubleDoubleBonusConfig";
import { evaluateDoubleDoubleBonusHand } from "./evaluateDoubleDoubleBonusHand";
import { FOUR_ACES_WITH_ANY_TWO_THREE_FOUR_DEBUG_HAND } from "./doubleDoubleBonusDebugHands";

describe("Double Double Bonus debug hands", () => {
  it("deals four aces with a deuce to the initial hand rank", () => {
    expect(
      evaluateDoubleDoubleBonusHand(
        FOUR_ACES_WITH_ANY_TWO_THREE_FOUR_DEBUG_HAND,
      ),
    ).toBe(HAND_TYPES.FOUR_ACES_WITH_ANY_TWO_THREE_FOUR);
  });
});
