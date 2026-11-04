interface CardState {
  cardId: number | null;
  isHeld: boolean;
}

export type INITIAL_HAND_STATE_TYPE = CardState[];

export const MULTI_HAND_COUNT = 10;

export const INITIAL_HAND_STATE: CardState[] = [
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
];

export function createEmptyHand(): INITIAL_HAND_STATE_TYPE {
  return INITIAL_HAND_STATE.map((card) => ({ ...card }));
}

export function createEmptyMultiHand(): INITIAL_HAND_STATE_TYPE[] {
  return Array.from({ length: MULTI_HAND_COUNT }, createEmptyHand);
}
