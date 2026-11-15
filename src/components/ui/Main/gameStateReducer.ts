import {
  BETTING_OPTIONS,
  DEFAULT_BETTING_INDEX,
  DENOMINATIONS,
  GAME_STATES,
  type BetAmount,
  type Denomination,
  type GameState,
} from "../../../config/gameConfig";
import type { GameId } from "../../../config/games";
import {
  createEmptyHand,
  createEmptyMultiHand,
  MULTI_HAND_COUNT,
  type INITIAL_HAND_STATE_TYPE,
} from "../../../config/hands";
import type { HandResult } from "../InteractiveHand/HandRow";

export interface DenominationMultipliers {
  queued: number[];
  active: number[];
}

export interface GameDataState {
  selectedGameId: GameId;
  denomination: Denomination;
  currentBet: BetAmount;
  balanceCents: number;
  displayBalanceCents: number;
  winCredits: number;
  gameState: GameState;
  initialHand: INITIAL_HAND_STATE_TYPE;
  handsState: INITIAL_HAND_STATE_TYPE[];
  multipliersByDenomination: Record<Denomination, DenominationMultipliers>;
  handResults: (HandResult | null)[];
  initialHandResult: HandResult | null;
  hasResolvedAllHands: boolean;
  isInitialDeal: boolean;
  isDrawing: boolean;
  isResolvingDraw: boolean;
  isBetting: boolean;
  isCountingPayout: boolean;
}

export type GameDataAction =
  | { type: "bet-changed"; bet: BetAmount }
  | {
      type: "deal-started";
      bet: BetAmount;
      denomination: Denomination;
      wagerCostCents: number;
      multipliersForDeal: number[];
      resetQueuedMultipliers: boolean;
    }
  | { type: "deal-betting-finished" }
  | { type: "initial-deal-started"; cards: INITIAL_HAND_STATE_TYPE }
  | { type: "initial-card-revealed"; cardIndex: number; card: INITIAL_HAND_STATE_TYPE[number] }
  | { type: "initial-deal-finished"; result: HandResult | null }
  | { type: "draw-started" }
  | { type: "draw-hands-started"; hands: INITIAL_HAND_STATE_TYPE[] }
  | {
      type: "draw-card-revealed";
      handIndex: number;
      cardIndex: number;
      card: INITIAL_HAND_STATE_TYPE[number];
    }
  | {
      type: "hand-resolved";
      denomination: Denomination;
      handIndex: number;
      result: HandResult;
      updateMultiplier: boolean;
      nextMultiplier: number;
    }
  | {
      type: "draw-finished";
      payoutCents: number;
    }
  | {
      type: "payout-progressed";
      displayBalanceCents: number;
      winCredits: number;
    }
  | {
      type: "payout-finished";
      displayBalanceCents: number;
      winCredits: number;
    }
  | { type: "card-held"; cardIndex: number }
  | { type: "game-selected"; gameId: GameId }
  | { type: "denomination-changed"; denomination: Denomination }
  | { type: "balance-reset"; balanceCents: number };

export function createDenominationMultipliers(): Record<
  Denomination,
  DenominationMultipliers
> {
  return Object.fromEntries(
    (Object.keys(DENOMINATIONS) as Denomination[]).map((denomination) => [
      denomination,
      {
        queued: Array(MULTI_HAND_COUNT).fill(1),
        active: Array(MULTI_HAND_COUNT).fill(1),
      },
    ]),
  ) as Record<Denomination, DenominationMultipliers>;
}

export function createGameDataState(
  initialGameId: GameId,
  initialDenomination: Denomination,
  initialBalanceCents: number,
): GameDataState {
  return {
    selectedGameId: initialGameId,
    denomination: initialDenomination,
    currentBet: BETTING_OPTIONS[DEFAULT_BETTING_INDEX] ?? 1,
    balanceCents: initialBalanceCents,
    displayBalanceCents: initialBalanceCents,
    winCredits: 0,
    gameState: GAME_STATES.Game_Over,
    initialHand: createEmptyHand(),
    handsState: createEmptyMultiHand(),
    multipliersByDenomination: createDenominationMultipliers(),
    handResults: Array(MULTI_HAND_COUNT).fill(null),
    initialHandResult: null,
    hasResolvedAllHands: false,
    isInitialDeal: false,
    isDrawing: false,
    isResolvingDraw: false,
    isBetting: false,
    isCountingPayout: false,
  };
}

export function gameDataReducer(
  state: GameDataState,
  action: GameDataAction,
): GameDataState {
  switch (action.type) {
    case "bet-changed":
      return { ...state, currentBet: action.bet };
    case "deal-started": {
      const currentMultipliers =
        state.multipliersByDenomination[action.denomination];
      return {
        ...state,
        currentBet: action.bet,
        balanceCents: state.balanceCents - action.wagerCostCents,
        displayBalanceCents:
          state.displayBalanceCents - action.wagerCostCents,
        winCredits: 0,
        handResults: Array(MULTI_HAND_COUNT).fill(null),
        initialHandResult: null,
        hasResolvedAllHands: false,
        multipliersByDenomination: {
          ...state.multipliersByDenomination,
          [action.denomination]: {
            queued: action.resetQueuedMultipliers
              ? Array(MULTI_HAND_COUNT).fill(1)
              : currentMultipliers.queued,
            active: action.multipliersForDeal,
          },
        },
        initialHand: createEmptyHand(),
        handsState: createEmptyMultiHand(),
        gameState: GAME_STATES.Game_Over,
        isBetting: true,
      };
    }
    case "deal-betting-finished":
      return { ...state, isBetting: false };
    case "initial-deal-started":
      return {
        ...state,
        initialHand: action.cards.map((card) =>
          card.isHeld ? { ...card } : { cardId: null, isHeld: false },
        ),
        isInitialDeal: true,
        isDrawing: true,
      };
    case "initial-card-revealed":
      return {
        ...state,
        initialHand: state.initialHand.map((card, index) =>
          index === action.cardIndex ? { ...action.card } : card,
        ),
      };
    case "initial-deal-finished":
      return {
        ...state,
        initialHandResult: action.result,
        gameState: GAME_STATES.Awaiting_Holds,
        isInitialDeal: false,
        isDrawing: false,
      };
    case "draw-started":
      return {
        ...state,
        handResults: Array(MULTI_HAND_COUNT).fill(null),
        initialHandResult: null,
        hasResolvedAllHands: false,
        winCredits: 0,
        gameState: GAME_STATES.Game_Over,
      };
    case "draw-hands-started":
      return {
        ...state,
        handsState: action.hands,
        isDrawing: true,
        isResolvingDraw: true,
      };
    case "draw-card-revealed":
      return {
        ...state,
        handsState: state.handsState.map((hand, handIndex) =>
          handIndex !== action.handIndex
            ? hand
            : hand.map((card, cardIndex) =>
                cardIndex === action.cardIndex ? { ...action.card } : card,
              ),
        ),
      };
    case "hand-resolved":
      return {
        ...state,
        handResults: state.handResults.map((existing, index) =>
          index === action.handIndex ? action.result : existing,
        ),
        multipliersByDenomination: action.updateMultiplier
          ? {
              ...state.multipliersByDenomination,
              [action.denomination]: {
                ...state.multipliersByDenomination[action.denomination],
                queued:
                  state.multipliersByDenomination[
                    action.denomination
                  ].queued.map((multiplier, index) =>
                    index === action.handIndex
                      ? action.result.payoutCredits > 0
                        ? action.nextMultiplier
                        : 1
                      : multiplier,
                  ),
              },
            }
          : state.multipliersByDenomination,
      };
    case "draw-finished":
      return {
        ...state,
        hasResolvedAllHands: true,
        balanceCents: state.balanceCents + action.payoutCents,
        winCredits: 0,
        isDrawing: false,
        isResolvingDraw: false,
        isCountingPayout: action.payoutCents > 0,
      };
    case "payout-progressed":
      return {
        ...state,
        displayBalanceCents: action.displayBalanceCents,
        winCredits: action.winCredits,
      };
    case "payout-finished":
      return {
        ...state,
        displayBalanceCents: action.displayBalanceCents,
        winCredits: action.winCredits,
        isCountingPayout: false,
      };
    case "card-held":
      return {
        ...state,
        initialHandResult: null,
        initialHand: state.initialHand.map((card, index) =>
          index === action.cardIndex ? { ...card, isHeld: !card.isHeld } : card,
        ),
      };
    case "game-selected":
      return {
        ...state,
        selectedGameId: action.gameId,
        handResults: Array(MULTI_HAND_COUNT).fill(null),
        initialHandResult: null,
        hasResolvedAllHands: false,
        initialHand: createEmptyHand(),
        handsState: createEmptyMultiHand(),
        multipliersByDenomination: createDenominationMultipliers(),
        winCredits: 0,
        gameState: GAME_STATES.Game_Over,
      };
    case "denomination-changed":
      return { ...state, denomination: action.denomination };
    case "balance-reset":
      return {
        ...state,
        balanceCents: action.balanceCents,
        displayBalanceCents: action.balanceCents,
      };
  }
}
