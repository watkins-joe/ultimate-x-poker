import { DEUCES_WILD_HAND_TYPES } from "../config/deucesWildConfig";
import { LOOSE_DEUCES_HAND_TYPES } from "../config/looseDeucesConfig";
import { evaluateDeucesWildHand } from "./evaluateDeucesWildHand";

type LooseDeucesHand =
  | (typeof LOOSE_DEUCES_HAND_TYPES)[keyof typeof LOOSE_DEUCES_HAND_TYPES]
  | "high_card";

export function evaluateLooseDeucesHand(
  cardIds: readonly number[],
): LooseDeucesHand {
  const hand = evaluateDeucesWildHand(cardIds);

  switch (hand) {
    case DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_NO_DEUCES:
      return LOOSE_DEUCES_HAND_TYPES.ROYAL_FLUSH;
    case DEUCES_WILD_HAND_TYPES.FOUR_DEUCES_WITH_ACE:
    case DEUCES_WILD_HAND_TYPES.FOUR_DEUCES:
      return LOOSE_DEUCES_HAND_TYPES.FOUR_DEUCES;
    case DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_WITH_DEUCES:
      return LOOSE_DEUCES_HAND_TYPES.WILD_ROYAL_FLUSH;
    case DEUCES_WILD_HAND_TYPES.FIVE_ACES:
    case DEUCES_WILD_HAND_TYPES.FIVE_THREES_FOURS_FIVES:
    case DEUCES_WILD_HAND_TYPES.FIVE_SIXES_THRU_KINGS:
      return LOOSE_DEUCES_HAND_TYPES.FIVE_OF_A_KIND;
    case DEUCES_WILD_HAND_TYPES.STRAIGHT_FLUSH:
      return LOOSE_DEUCES_HAND_TYPES.STRAIGHT_FLUSH;
    case DEUCES_WILD_HAND_TYPES.FOUR_OF_A_KIND:
      return LOOSE_DEUCES_HAND_TYPES.FOUR_OF_A_KIND;
    case DEUCES_WILD_HAND_TYPES.FULL_HOUSE:
      return LOOSE_DEUCES_HAND_TYPES.FULL_HOUSE;
    case DEUCES_WILD_HAND_TYPES.FLUSH:
      return LOOSE_DEUCES_HAND_TYPES.FLUSH;
    case DEUCES_WILD_HAND_TYPES.STRAIGHT:
      return LOOSE_DEUCES_HAND_TYPES.STRAIGHT;
    case DEUCES_WILD_HAND_TYPES.THREE_OF_A_KIND:
      return LOOSE_DEUCES_HAND_TYPES.THREE_OF_A_KIND;
    case "high_card":
      return "high_card";
  }
}
