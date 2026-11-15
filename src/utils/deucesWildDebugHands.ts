import { DEUCES_WILD_HAND_TYPES } from "../config/deucesWildConfig";

type DeucesWildHand =
  (typeof DEUCES_WILD_HAND_TYPES)[keyof typeof DEUCES_WILD_HAND_TYPES];

const DEBUG_HANDS_BY_RANK: Readonly<Record<DeucesWildHand, readonly number[]>> =
  {
    [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_NO_DEUCES]: [8, 9, 10, 11, 12],
    [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES_WITH_ACE]: [0, 13, 26, 39, 12],
    [DEUCES_WILD_HAND_TYPES.FOUR_DEUCES]: [0, 13, 26, 39, 1],
    [DEUCES_WILD_HAND_TYPES.ROYAL_FLUSH_WITH_DEUCES]: [0, 8, 9, 10, 11],
    [DEUCES_WILD_HAND_TYPES.FIVE_ACES]: [0, 12, 25, 38, 51],
    [DEUCES_WILD_HAND_TYPES.FIVE_THREES_FOURS_FIVES]: [0, 1, 14, 27, 40],
    [DEUCES_WILD_HAND_TYPES.FIVE_SIXES_THRU_KINGS]: [0, 4, 17, 30, 43],
    [DEUCES_WILD_HAND_TYPES.STRAIGHT_FLUSH]: [3, 4, 5, 6, 7],
    [DEUCES_WILD_HAND_TYPES.FOUR_OF_A_KIND]: [1, 5, 18, 31, 44],
    [DEUCES_WILD_HAND_TYPES.FULL_HOUSE]: [1, 14, 27, 2, 15],
    [DEUCES_WILD_HAND_TYPES.FLUSH]: [1, 3, 5, 7, 9],
    [DEUCES_WILD_HAND_TYPES.STRAIGHT]: [1, 15, 29, 43, 5],
    [DEUCES_WILD_HAND_TYPES.THREE_OF_A_KIND]: [1, 14, 27, 3, 5],
  };

const DEBUG_RANK_ORDER = Object.values(DEUCES_WILD_HAND_TYPES);
const DEBUG_BATCH_SIZE = 10;

export const DEUCES_WILD_DEBUG_HAND_BATCHES: readonly (readonly (readonly number[])[])[] =
  Array.from(
    { length: Math.ceil(DEBUG_RANK_ORDER.length / DEBUG_BATCH_SIZE) },
    (_, batchIndex) =>
      DEBUG_RANK_ORDER.slice(
        batchIndex * DEBUG_BATCH_SIZE,
        (batchIndex + 1) * DEBUG_BATCH_SIZE,
      ).map((rank) => DEBUG_HANDS_BY_RANK[rank]),
  );
