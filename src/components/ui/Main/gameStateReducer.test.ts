import { describe, expect, it } from "vitest";
import { GAME_STATES, type Denomination } from "../../../config/gameConfig";
import { DEFAULT_GAME_ID } from "../../../config/games";
import {
  createEmptyHand,
  MULTI_HAND_COUNT,
  type INITIAL_HAND_STATE_TYPE,
} from "../../../config/hands";
import {
  createGameDataState,
  gameDataReducer,
  type GameDataAction,
} from "./gameStateReducer";

const STARTING_BALANCE_CENTS = 100_000;
const DENOMINATION: Denomination = "25c";

function createState() {
  return createGameDataState(
    DEFAULT_GAME_ID,
    DENOMINATION,
    STARTING_BALANCE_CENTS,
  );
}

function handWithCards(...cardIds: number[]): INITIAL_HAND_STATE_TYPE {
  return cardIds.map((cardId) => ({ cardId, isHeld: false }));
}

function reduce(
  state: ReturnType<typeof createState>,
  action: GameDataAction,
) {
  return gameDataReducer(state, action);
}

describe("gameDataReducer", () => {
  it("initializes a clean game with independent hands and multiplier queues", () => {
    const state = createState();
    const anotherState = createState();

    expect(state.gameState).toBe(GAME_STATES.Game_Over);
    expect(state.balanceCents).toBe(STARTING_BALANCE_CENTS);
    expect(state.displayBalanceCents).toBe(STARTING_BALANCE_CENTS);
    expect(state.initialHand).toHaveLength(5);
    expect(state.handsState).toHaveLength(MULTI_HAND_COUNT);
    expect(state.multipliersByDenomination[DENOMINATION].queued).toEqual(
      Array(MULTI_HAND_COUNT).fill(1),
    );

    state.initialHand[0]!.cardId = 12;
    state.multipliersByDenomination[DENOMINATION].queued[0] = 4;
    expect(anotherState.initialHand[0]!.cardId).toBeNull();
    expect(anotherState.multipliersByDenomination[DENOMINATION].queued[0]).toBe(
      1,
    );
  });

  it("deducts a deal wager and records the active multipliers", () => {
    const state = createState();
    const queuedMultipliers = state.multipliersByDenomination[
      DENOMINATION
    ].queued;
    queuedMultipliers[0] = 4;
    const activeMultipliers = [...queuedMultipliers];

    const next = reduce(state, {
      type: "deal-started",
      bet: 100,
      denomination: DENOMINATION,
      wagerCostCents: 2_500,
      multipliersForDeal: activeMultipliers,
      resetQueuedMultipliers: false,
    });

    expect(next.balanceCents).toBe(STARTING_BALANCE_CENTS - 2_500);
    expect(next.displayBalanceCents).toBe(STARTING_BALANCE_CENTS - 2_500);
    expect(next.currentBet).toBe(100);
    expect(next.isBetting).toBe(true);
    expect(next.initialHand.every((card) => card.cardId === null)).toBe(true);
    expect(next.multipliersByDenomination[DENOMINATION].active).toEqual(
      activeMultipliers,
    );
    expect(next.multipliersByDenomination[DENOMINATION].queued[0]).toBe(4);
  });

  it("resets queued multipliers after a max-bet deal when requested", () => {
    const state = createState();
    state.multipliersByDenomination[DENOMINATION].queued[3] = 12;

    const next = reduce(state, {
      type: "deal-started",
      bet: 100,
      denomination: DENOMINATION,
      wagerCostCents: 2_500,
      multipliersForDeal: [...state.multipliersByDenomination[DENOMINATION].queued],
      resetQueuedMultipliers: true,
    });

    expect(next.multipliersByDenomination[DENOMINATION].active[3]).toBe(12);
    expect(next.multipliersByDenomination[DENOMINATION].queued).toEqual(
      Array(MULTI_HAND_COUNT).fill(1),
    );
  });

  it("reveals the initial hand and enters hold selection with its winning result", () => {
    const dealtHand = handWithCards(1, 2, 3, 4, 5);
    const result = {
      rank: "PAIR",
      title: "PAIR",
      basePayoutCredits: 2,
      payoutCredits: 8,
      multiplierApplied: 4,
    };
    const started = reduce(createState(), {
      type: "initial-deal-started",
      cards: dealtHand,
    });

    expect(started.isInitialDeal).toBe(true);
    expect(started.isDrawing).toBe(true);
    expect(started.initialHand.every((card) => card.cardId === null)).toBe(
      true,
    );

    const revealed = reduce(started, {
      type: "initial-card-revealed",
      cardIndex: 2,
      card: dealtHand[2]!,
    });
    expect(revealed.initialHand[2]!.cardId).toBe(3);
    expect(revealed.initialHand[1]!.cardId).toBeNull();

    const finished = reduce(revealed, {
      type: "initial-deal-finished",
      result,
    });
    expect(finished.gameState).toBe(GAME_STATES.Awaiting_Holds);
    expect(finished.isInitialDeal).toBe(false);
    expect(finished.isDrawing).toBe(false);
    expect(finished.initialHandResult).toEqual(result);
  });

  it("toggles a held card and clears the initial-hand result", () => {
    const state = createState();
    state.initialHand = handWithCards(1, 2, 3, 4, 5);
    state.initialHandResult = {
      rank: "PAIR",
      title: "PAIR",
      basePayoutCredits: 1,
      payoutCredits: 1,
      multiplierApplied: 1,
    };

    const held = reduce(state, { type: "card-held", cardIndex: 2 });
    expect(held.initialHand[2]!.isHeld).toBe(true);
    expect(held.initialHandResult).toBeNull();
    expect(state.initialHand[2]!.isHeld).toBe(false);

    const unheld = reduce(held, { type: "card-held", cardIndex: 2 });
    expect(unheld.initialHand[2]!.isHeld).toBe(false);
  });

  it("reveals a drawn card and updates only that hand's result and multiplier", () => {
    const state = createState();
    const hiddenHands = Array.from({ length: MULTI_HAND_COUNT }, createEmptyHand);
    const drawnHand = handWithCards(10, 11, 12, 13, 14);
    const started = reduce(state, {
      type: "draw-hands-started",
      hands: hiddenHands,
    });

    const revealed = reduce(started, {
      type: "draw-card-revealed",
      handIndex: 4,
      cardIndex: 1,
      card: drawnHand[1]!,
    });
    expect(revealed.isDrawing).toBe(true);
    expect(revealed.isResolvingDraw).toBe(true);
    expect(revealed.handsState[4]![1]!.cardId).toBe(11);
    expect(revealed.handsState[3]![1]!.cardId).toBeNull();

    const result = {
      rank: "STRAIGHT",
      title: "STRAIGHT",
      basePayoutCredits: 3,
      payoutCredits: 36,
      multiplierApplied: 12,
    };
    const resolved = reduce(revealed, {
      type: "hand-resolved",
      denomination: DENOMINATION,
      handIndex: 4,
      result,
      updateMultiplier: true,
      nextMultiplier: 8,
    });
    expect(resolved.handResults[4]).toEqual(result);
    expect(resolved.multipliersByDenomination[DENOMINATION].queued[4]).toBe(8);
    expect(resolved.multipliersByDenomination[DENOMINATION].queued[3]).toBe(1);
  });

  it("clears a losing hand's queued multiplier without changing other hands", () => {
    const state = createState();
    state.multipliersByDenomination[DENOMINATION].queued[2] = 4;
    state.multipliersByDenomination[DENOMINATION].queued[3] = 7;

    const next = reduce(state, {
      type: "hand-resolved",
      denomination: DENOMINATION,
      handIndex: 2,
      result: {
        rank: "NO_WIN",
        title: "NO WIN",
        basePayoutCredits: 0,
        payoutCredits: 0,
        multiplierApplied: 4,
      },
      updateMultiplier: true,
      nextMultiplier: 12,
    });

    expect(next.multipliersByDenomination[DENOMINATION].queued[2]).toBe(1);
    expect(next.multipliersByDenomination[DENOMINATION].queued[3]).toBe(7);
  });

  it("adds the payout to the bank and tracks payout animation state", () => {
    const drawFinished = reduce(createState(), {
      type: "draw-finished",
      payoutCents: 500,
    });
    expect(drawFinished.hasResolvedAllHands).toBe(true);
    expect(drawFinished.balanceCents).toBe(STARTING_BALANCE_CENTS + 500);
    expect(drawFinished.isResolvingDraw).toBe(false);
    expect(drawFinished.isCountingPayout).toBe(true);

    const progressed = reduce(drawFinished, {
      type: "payout-progressed",
      displayBalanceCents: STARTING_BALANCE_CENTS + 250,
      winCredits: 10,
    });
    expect(progressed.displayBalanceCents).toBe(STARTING_BALANCE_CENTS + 250);
    expect(progressed.winCredits).toBe(10);
    expect(progressed.isCountingPayout).toBe(true);

    const finished = reduce(progressed, {
      type: "payout-finished",
      displayBalanceCents: STARTING_BALANCE_CENTS + 500,
      winCredits: 20,
    });
    expect(finished.displayBalanceCents).toBe(STARTING_BALANCE_CENTS + 500);
    expect(finished.winCredits).toBe(20);
    expect(finished.isCountingPayout).toBe(false);
  });

  it("does not start payout counting when a draw has no payout", () => {
    const next = reduce(createState(), {
      type: "draw-finished",
      payoutCents: 0,
    });

    expect(next.hasResolvedAllHands).toBe(true);
    expect(next.isCountingPayout).toBe(false);
    expect(next.balanceCents).toBe(STARTING_BALANCE_CENTS);
  });

  it("resets hands, results, and multipliers when switching games", () => {
    const state = createState();
    state.initialHand = handWithCards(1, 2, 3, 4, 5);
    state.handsState[0] = handWithCards(5, 6, 7, 8, 9);
    state.multipliersByDenomination[DENOMINATION].queued[0] = 12;
    state.handResults[0] = {
      rank: "PAIR",
      title: "PAIR",
      basePayoutCredits: 1,
      payoutCredits: 12,
      multiplierApplied: 12,
    };
    state.hasResolvedAllHands = true;

    const next = reduce(state, {
      type: "game-selected",
      gameId: "deuces-wild-double-bonus",
    });

    expect(next.selectedGameId).toBe("deuces-wild-double-bonus");
    expect(next.initialHand.every((card) => card.cardId === null)).toBe(true);
    expect(next.handsState[0]!.every((card) => card.cardId === null)).toBe(true);
    expect(next.handResults.every((result) => result === null)).toBe(true);
    expect(next.multipliersByDenomination[DENOMINATION].queued).toEqual(
      Array(MULTI_HAND_COUNT).fill(1),
    );
    expect(next.hasResolvedAllHands).toBe(false);
    expect(next.gameState).toBe(GAME_STATES.Game_Over);
  });
});
