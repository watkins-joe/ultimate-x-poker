interface CardState {
  cardId: number | null;
  isHeld: boolean;
}

export type INITIAL_HAND_STATE_TYPE = CardState[];

export const INITIAL_HAND_STATE: CardState[] = [
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
  { cardId: null, isHeld: false },
];
