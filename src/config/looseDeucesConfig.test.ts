import { describe, expect, it } from "vitest";
import { GAMES } from "./games";
import {
  LOOSE_DEUCES_HAND_DISPLAY_NAMES,
  LOOSE_DEUCES_HAND_TYPES as HAND,
  LOOSE_DEUCES_MULTIPLIER_BY_HAND,
  LOOSE_DEUCES_PAYOUTS_PER_BET,
} from "./looseDeucesConfig";
import { evaluateLooseDeucesHand } from "../utils/evaluateLooseDeucesHand";

describe("Loose Deuces configuration", () => {
  it("uses the paytable values from the provided image", () => {
    expect(LOOSE_DEUCES_PAYOUTS_PER_BET[1]).toEqual({
      [HAND.ROYAL_FLUSH]: 300,
      [HAND.FOUR_DEUCES]: 500,
      [HAND.WILD_ROYAL_FLUSH]: 25,
      [HAND.FIVE_OF_A_KIND]: 15,
      [HAND.STRAIGHT_FLUSH]: 5,
      [HAND.FOUR_OF_A_KIND]: 4,
      [HAND.FULL_HOUSE]: 3,
      [HAND.FLUSH]: 2,
      [HAND.STRAIGHT]: 2,
      [HAND.THREE_OF_A_KIND]: 1,
    });
    expect(LOOSE_DEUCES_PAYOUTS_PER_BET[5]).toEqual({
      [HAND.ROYAL_FLUSH]: 4000,
      [HAND.FOUR_DEUCES]: 2500,
      [HAND.WILD_ROYAL_FLUSH]: 125,
      [HAND.FIVE_OF_A_KIND]: 75,
      [HAND.STRAIGHT_FLUSH]: 25,
      [HAND.FOUR_OF_A_KIND]: 20,
      [HAND.FULL_HOUSE]: 15,
      [HAND.FLUSH]: 10,
      [HAND.STRAIGHT]: 10,
      [HAND.THREE_OF_A_KIND]: 5,
    });
  });

  it("lists winning hands in paytable order", () => {
    expect(Object.keys(LOOSE_DEUCES_HAND_DISPLAY_NAMES)).toEqual([
      HAND.ROYAL_FLUSH,
      HAND.FOUR_DEUCES,
      HAND.WILD_ROYAL_FLUSH,
      HAND.FIVE_OF_A_KIND,
      HAND.STRAIGHT_FLUSH,
      HAND.FOUR_OF_A_KIND,
      HAND.FULL_HOUSE,
      HAND.FLUSH,
      HAND.STRAIGHT,
      HAND.THREE_OF_A_KIND,
    ]);
  });

  it("copies the Deuces Wild multiplier schedule", () => {
    expect(LOOSE_DEUCES_MULTIPLIER_BY_HAND).toEqual({
      [HAND.ROYAL_FLUSH]: 2,
      [HAND.FOUR_DEUCES]: 2,
      [HAND.WILD_ROYAL_FLUSH]: 2,
      [HAND.FIVE_OF_A_KIND]: 2,
      [HAND.STRAIGHT_FLUSH]: 12,
      [HAND.FOUR_OF_A_KIND]: 7,
      [HAND.FULL_HOUSE]: 6,
      [HAND.FLUSH]: 4,
      [HAND.STRAIGHT]: 3,
      [HAND.THREE_OF_A_KIND]: 4,
    });
  });

  it("registers the Loose Deuces game and its artwork", () => {
    expect(GAMES["loose-deuces"]).toMatchObject({
      name: "LOOSE DEUCES",
      image: "LD.png",
      handNames: LOOSE_DEUCES_HAND_DISPLAY_NAMES,
      payoutsPerBet: LOOSE_DEUCES_PAYOUTS_PER_BET,
      multiplierByHand: LOOSE_DEUCES_MULTIPLIER_BY_HAND,
      evaluateHand: evaluateLooseDeucesHand,
    });
    expect(GAMES["loose-deuces"].getCardAsset(0)).toEqual({
      src: "/assets/cards/0w.png",
      alt: "Wild Deuce",
    });
  });
});
