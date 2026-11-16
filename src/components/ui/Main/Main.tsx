import { useEffect, useReducer, useRef, useState } from "react";
import {
  BETTING_OPTIONS,
  DENOMINATIONS,
  GAME_STATES,
  getActiveHandCount,
  getPaytableBetAmount,
  type BetAmount,
  type Denomination,
} from "../../../config/gameConfig";
import {
  DEFAULT_GAME_ID,
  GAMES,
  type GameDefinition,
  type GameId,
} from "../../../config/games";
import {
  createEmptyHand,
  INITIAL_HAND_STATE,
  MULTI_HAND_COUNT,
  type INITIAL_HAND_STATE_TYPE,
} from "../../../config/hands";
import {
  loadBalanceCents,
  loadDenomination,
  loadSelectedGame,
  saveBalanceCents,
  saveDenomination,
  saveSelectedGame,
} from "../../../utils/balanceStorage";
import {
  DEFAULT_SOUND_VOLUME,
  loadSoundVolume,
  saveSoundVolume,
} from "../../../utils/volumeStorage";
import { CARDS, shuffle } from "../../../utils/cards";
import { DEUCES_WILD_DEBUG_HAND_BATCHES } from "../../../utils/deucesWildDebugHands";
import { soundManager } from "../../../utils/soundManager";
import {
  createGameDataState,
  gameDataReducer,
} from "./gameStateReducer";
import DenomModal from "../DenomModal/DenomModal";
import GameBottomArea from "../GameBottomArea/GameBottomArea";
import GameFooter from "../GameFooter/GameFooter";
import GameMenu from "../GameMenu/GameMenu";
import GameTable from "../InteractiveHand/GameTable";
import InteractiveHand, {
  type HandResult,
} from "../InteractiveHand/InteractiveHand";
import PaytableModal from "../Paytable/PaytableModal";
import VolumeModal from "../VolumeModal/VolumeModal";
import "./Main.scss";

const DEFAULT_DENOMINATION: Denomination = "25c";
const STARTING_BALANCE_CENTS = 100_000;
const DEAL_CARD_DELAY_MS = 85;
const DRAW_CARD_DELAY_MS = 85;
const FAST_DRAW_CARD_DELAY_MS = 25;
const RESET_CONFIRMATION_TIMEOUT_MS = 5000;
const BASE_PAYOUT_COUNT_UP_MS = 500;
const PAYOUT_COUNT_UP_PER_CREDIT_MS = 8;
const MAX_PAYOUT_COUNT_UP_MS = 4000;
const MAX_BET = BETTING_OPTIONS[BETTING_OPTIONS.length - 1];

function getInitialBalanceCents(): number {
  try {
    return loadBalanceCents(window.localStorage, STARTING_BALANCE_CENTS);
  } catch (error) {
    console.error("Unable to load the saved bank balance.", error);
    return STARTING_BALANCE_CENTS;
  }
}

function getInitialDenomination(): Denomination {
  try {
    return loadDenomination(window.localStorage, DEFAULT_DENOMINATION);
  } catch (error) {
    console.error("Unable to load the saved denomination.", error);
    return DEFAULT_DENOMINATION;
  }
}

function getInitialGame(): GameId {
  try {
    return loadSelectedGame(window.localStorage, DEFAULT_GAME_ID);
  } catch (error) {
    console.error("Unable to load the saved game.", error);
    return DEFAULT_GAME_ID;
  }
}

function getInitialSoundVolume(): number {
  try {
    return loadSoundVolume(window.localStorage);
  } catch (error) {
    console.error("Unable to load the saved sound volume.", error);
    return DEFAULT_SOUND_VOLUME;
  }
}

function Main() {
  const [isCreditsMode, setIsCreditsMode] = useState(true);
  const [soundVolume, setSoundVolume] = useState(getInitialSoundVolume);
  const [gameData, dispatch] = useReducer(
    gameDataReducer,
    null,
    () =>
      createGameDataState(
        getInitialGame(),
        getInitialDenomination(),
        getInitialBalanceCents(),
      ),
  );
  const {
    selectedGameId,
    denomination,
    currentBet,
    balanceCents,
    displayBalanceCents,
    winCredits,
    gameState,
    initialHand,
    handsState,
    multipliersByDenomination,
    handResults,
    initialHandResult,
    hasResolvedAllHands,
    isInitialDeal,
    isDrawing,
    isResolvingDraw,
    isBetting,
    isCountingPayout,
  } = gameData;
  const [activeModal, setActiveModal] = useState<
    "denomination" | "game-selection" | "paytable" | "volume" | null
  >(null);
  const dealTimeoutRef = useRef<number | null>(null);
  const drawRevealNextRef = useRef<(() => void) | null>(null);
  const drawRevealDelayRef = useRef(DRAW_CARD_DELAY_MS);
  const payoutAnimationFrameRef = useRef<number | null>(null);
  const resetConfirmationTimeoutRef = useRef<number | null>(null);
  const [isResetConfirmationActive, setIsResetConfirmationActive] =
    useState(false);
  const debugDealBatchRef = useRef(0);
  const previousCategorySoundRef = useRef<number | null>(null);
  const debugHandsForDrawRef = useRef<readonly (readonly number[])[] | null>(
    null,
  );

  const denominationValueCents = DENOMINATIONS[denomination].valueCents;
  const selectedGame = GAMES[selectedGameId];
  const totalBetCostCents = currentBet * denominationValueCents;
  const canAffordBet = balanceCents >= totalBetCostCents;
  const maxBetCostCents = MAX_BET * denominationValueCents;
  const canAffordMaxBet = balanceCents >= maxBetCostCents;
  const multipliers = multipliersByDenomination[denomination].queued;
  const activeMultipliers = multipliersByDenomination[denomination].active;
  const isUltimateXActive = currentBet === MAX_BET;
  const categorySounds = [
    "cate1",
    "cate2",
    "cate5",
    "cate6",
    "cate9",
    "cate13",
  ] as const;
  const isDeucesWildRankDebug =
    new URLSearchParams(window.location.search).get("debug") ===
      "deuces-wild-ranks" && selectedGameId === "deuces-wild-double-bonus";
  const activeHandCount = isDeucesWildRankDebug
    ? MULTI_HAND_COUNT
    : getActiveHandCount(currentBet);

  function playRandomHandCategorySound() {
    const previousIndex = previousCategorySoundRef.current;
    const availableIndices = categorySounds.flatMap((_, index) =>
      index === previousIndex ? [] : [index],
    );
    const selectedIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    if (selectedIndex === undefined) return;

    previousCategorySoundRef.current = selectedIndex;
    soundManager.play(categorySounds[selectedIndex]);
  }

  function playBoardMultiplierSound() {
    const boardMultipliers = [...multipliers, ...activeMultipliers];
    if (selectedGameId === "deuces-wild-double-bonus") {
      const highestMultiplier = Math.max(...boardMultipliers);
      if (highestMultiplier >= 7) {
        soundManager.play("multHigh");
      } else if (highestMultiplier >= 4) {
        soundManager.play("multMid");
      } else if (highestMultiplier > 1) {
        soundManager.play("multLow");
      }
      return;
    }

    if (
      boardMultipliers.some(
        (multiplier) => multiplier === 7 || multiplier === 12,
      )
    ) {
      soundManager.play("multHigh");
    } else if (boardMultipliers.some((multiplier) => multiplier > 1)) {
      soundManager.play("multLow");
    }
  }

  useEffect(
    () => () => {
      if (dealTimeoutRef.current !== null) {
        window.clearTimeout(dealTimeoutRef.current);
      }
      if (payoutAnimationFrameRef.current !== null) {
        cancelAnimationFrame(payoutAnimationFrameRef.current);
      }
      if (resetConfirmationTimeoutRef.current !== null) {
        window.clearTimeout(resetConfirmationTimeoutRef.current);
      }
      soundManager.stopLoop("creditCount");
    },
    [],
  );

  useEffect(() => {
    try {
      saveBalanceCents(window.localStorage, balanceCents);
    } catch (error) {
      console.error("Unable to save the bank balance.", error);
    }
  }, [balanceCents]);

  useEffect(() => {
    try {
      saveDenomination(window.localStorage, denomination);
    } catch (error) {
      console.error("Unable to save the selected denomination.", error);
    }
  }, [denomination]);

  useEffect(() => {
    try {
      saveSelectedGame(window.localStorage, selectedGameId);
    } catch (error) {
      console.error("Unable to save the selected game.", error);
    }
  }, [selectedGameId]);

  useEffect(() => {
    soundManager.setVolume(soundVolume);
    try {
      saveSoundVolume(window.localStorage, soundVolume);
    } catch (error) {
      console.error("Unable to save the sound volume.", error);
    }
  }, [soundVolume]);

  function handleSoundVolumeChange(volume: number) {
    setSoundVolume(volume);
    soundManager.setVolume(volume);
    soundManager.play("click");
  }

  function changeBet(amount: BetAmount) {
    if (isRoundActive) return;
    dispatch({ type: "bet-changed", bet: amount });
  }

  function toggleCreditsMode() {
    setIsCreditsMode((previous) => !previous);
  }

  function handleResetBalance() {
    if (isRoundActive) return;

    if (!isResetConfirmationActive) {
      setIsResetConfirmationActive(true);
      resetConfirmationTimeoutRef.current = window.setTimeout(() => {
        setIsResetConfirmationActive(false);
        resetConfirmationTimeoutRef.current = null;
      }, RESET_CONFIRMATION_TIMEOUT_MS);
      return;
    }

    if (resetConfirmationTimeoutRef.current !== null) {
      window.clearTimeout(resetConfirmationTimeoutRef.current);
      resetConfirmationTimeoutRef.current = null;
    }
    setIsResetConfirmationActive(false);
    dispatch({
      type: "balance-reset",
      balanceCents: STARTING_BALANCE_CENTS,
    });
  }

  function showInitialCards(
    cards: INITIAL_HAND_STATE_TYPE,
    onComplete: () => void,
  ) {
    dispatch({ type: "initial-deal-started", cards });

    const cardsToReveal = cards.flatMap((card, index) =>
      card.isHeld ? [] : [index],
    );
    let revealIndex = 0;
    const revealNext = () => {
      const cardIndex = cardsToReveal[revealIndex];
      if (cardIndex === undefined) {
        dealTimeoutRef.current = null;
        onComplete();
        return;
      }

      soundManager.play("carddealt");
      dispatch({
        type: "initial-card-revealed",
        cardIndex,
        card: cards[cardIndex],
      });
      revealIndex += 1;
      dealTimeoutRef.current = window.setTimeout(
        revealNext,
        DEAL_CARD_DELAY_MS,
      );
    };

    revealNext();
  }

  function showHands(
    hands: INITIAL_HAND_STATE_TYPE[],
    onHandResolved: (handIndex: number) => void,
    onComplete: () => void,
  ) {
    const hiddenHands = hands.map((hand) =>
      hand.map((card) =>
        card.isHeld ? { ...card } : { cardId: null, isHeld: false },
      ),
    );
    const cardsToReveal = Array.from(
      { length: hands.length },
      (_, handIndex) => hands.length - handIndex - 1,
    ).flatMap((handIndex) =>
      hands[handIndex].flatMap((card, cardIndex) =>
        card.isHeld || card.cardId === null ? [] : [{ handIndex, cardIndex }],
      ),
    );
    const remainingCardsByHand = hands.map(
      (hand) =>
        hand.filter((card) => !card.isHeld && card.cardId !== null).length,
    );
    const resolvedHands = new Set<number>();
    const resolveHand = (handIndex: number) => {
      if (resolvedHands.has(handIndex)) return;
      resolvedHands.add(handIndex);
      onHandResolved(handIndex);
    };

    dispatch({ type: "draw-hands-started", hands: hiddenHands });
    drawRevealDelayRef.current = DRAW_CARD_DELAY_MS;
    remainingCardsByHand.forEach((remainingCards, handIndex) => {
      if (remainingCards === 0) resolveHand(handIndex);
    });
    let revealIndex = 0;
    const revealNext = () => {
      const nextCard = cardsToReveal[revealIndex];
      if (nextCard === undefined) {
        dealTimeoutRef.current = null;
        drawRevealNextRef.current = null;
        onComplete();
        return;
      }

      dispatch({
        type: "draw-card-revealed",
        handIndex: nextCard.handIndex,
        cardIndex: nextCard.cardIndex,
        card: hands[nextCard.handIndex][nextCard.cardIndex],
      });
      remainingCardsByHand[nextCard.handIndex] -= 1;
      if (remainingCardsByHand[nextCard.handIndex] === 0) {
        resolveHand(nextCard.handIndex);
      }
      revealIndex += 1;
      dealTimeoutRef.current = window.setTimeout(
        revealNext,
        drawRevealDelayRef.current,
      );
    };

    drawRevealNextRef.current = revealNext;
    revealNext();
  }

  function handleSpeedUpDraw() {
    if (
      !isResolvingDraw ||
      drawRevealDelayRef.current <= FAST_DRAW_CARD_DELAY_MS
    ) {
      return;
    }

    drawRevealDelayRef.current = FAST_DRAW_CARD_DELAY_MS;
    if (dealTimeoutRef.current !== null && drawRevealNextRef.current) {
      window.clearTimeout(dealTimeoutRef.current);
      dealTimeoutRef.current = window.setTimeout(
        drawRevealNextRef.current,
        FAST_DRAW_CARD_DELAY_MS,
      );
    }
    soundManager.play("speedUpDraw");
  }

  function getHandResult(
    cards: INITIAL_HAND_STATE_TYPE,
    bet: BetAmount,
    game: GameDefinition,
    multiplier: number,
  ): HandResult | null {
    const cardIds = cards.flatMap((card) =>
      card.cardId === null ? [] : [card.cardId],
    );
    if (cardIds.length !== INITIAL_HAND_STATE.length) return null;

    const rank = game.evaluateHand(cardIds);
    const basePayout = game.payoutsPerBet[getPaytableBetAmount(bet)][rank] ?? 0;
    return {
      rank,
      title: game.handNames[rank] ?? "NO WIN",
      basePayoutCredits: basePayout,
      payoutCredits: basePayout * multiplier,
      multiplierApplied: multiplier,
    };
  }

  function handleDeal(bet: BetAmount = currentBet) {
    const wagerCostCents = bet * denominationValueCents;
    if (
      gameState !== GAME_STATES.Game_Over ||
      isDrawing ||
      isBetting ||
      isCountingPayout ||
      balanceCents < wagerCostCents
    ) {
      return;
    }

    playBoardMultiplierSound();
    const bonusIsActive = bet === MAX_BET;
    const multipliersForDeal = bonusIsActive
      ? [...multipliers]
      : Array(MULTI_HAND_COUNT).fill(1);
    dispatch({
      type: "deal-started",
      bet,
      denomination,
      wagerCostCents,
      multipliersForDeal,
      resetQueuedMultipliers: bonusIsActive,
    });
    if (isDeucesWildRankDebug) {
      debugHandsForDrawRef.current =
        DEUCES_WILD_DEBUG_HAND_BATCHES[
          debugDealBatchRef.current % DEUCES_WILD_DEBUG_HAND_BATCHES.length
        ] ?? null;
      debugDealBatchRef.current += 1;
    } else {
      debugHandsForDrawRef.current = null;
    }

    const dealCards = () => {
      dispatch({ type: "deal-betting-finished" });
      const dealtCardIds = isDeucesWildRankDebug
        ? [1, 16, 31, 46, 11]
        : shuffle(CARDS).slice(0, INITIAL_HAND_STATE.length);
      const dealtHand = dealtCardIds.map((cardId) => ({
        cardId,
        isHeld: false,
      }));

      showInitialCards(dealtHand, () => {
        const initialResult = getHandResult(
          dealtHand,
          bet,
          selectedGame,
          multipliersForDeal[MULTI_HAND_COUNT - 1] ?? 1,
        );
        if (initialResult && initialResult.payoutCredits > 0) {
          soundManager.play("win");
        }
        dispatch({
          type: "initial-deal-finished",
          result:
            initialResult && initialResult.payoutCredits > 0
              ? initialResult
              : null,
        });
      });
    };

    dealCards();
  }

  function handleDraw() {
    if (
      gameState !== GAME_STATES.Awaiting_Holds ||
      isDrawing ||
      isCountingPayout
    ) {
      return;
    }

    const initialCardIds = new Set(
      initialHand.flatMap((card) =>
        card.cardId === null ? [] : [card.cardId],
      ),
    );
    const debugHands = debugHandsForDrawRef.current;
    const firstActiveHandIndex = isDeucesWildRankDebug
      ? 0
      : MULTI_HAND_COUNT - activeHandCount;
    const finalHands = debugHands
      ? Array.from({ length: MULTI_HAND_COUNT }, (_, handIndex) => {
          const debugHandIndex = MULTI_HAND_COUNT - handIndex - 1;
          const cardIds = debugHands[debugHandIndex];
          return cardIds
            ? cardIds.map((cardId) => ({ cardId, isHeld: false }))
            : createEmptyHand();
        })
      : Array.from({ length: MULTI_HAND_COUNT }, (_, handIndex) => {
          if (handIndex < firstActiveHandIndex) return createEmptyHand();

          const replacementCards = shuffle(
            CARDS.filter((cardId) => !initialCardIds.has(cardId)),
          );
          return initialHand.map((card) =>
            card.isHeld
              ? { ...card }
              : { cardId: replacementCards.pop() ?? null, isHeld: false },
          );
        });
    debugHandsForDrawRef.current = null;

    dispatch({ type: "draw-started" });

    const bonusIsActive = currentBet === MAX_BET;
    const multipliersForThisDraw = bonusIsActive
      ? activeMultipliers
      : Array(MULTI_HAND_COUNT).fill(1);

    const results = finalHands.map((hand, handIndex) =>
      handIndex < firstActiveHandIndex
        ? null
        : getHandResult(
            hand,
            currentBet,
            selectedGame,
            multipliersForThisDraw[handIndex] ?? 1,
          ),
    );

    showHands(
      finalHands,
      (handIndex) => {
        const result = results[handIndex];
        if (result === null || result === undefined) return;
        if (result.payoutCredits === 0) {
          soundManager.play("loser");
        } else {
          playRandomHandCategorySound();
        }

        dispatch({
          type: "hand-resolved",
          denomination,
          handIndex,
          result,
          updateMultiplier: bonusIsActive,
          nextMultiplier: selectedGame.multiplierByHand[result.rank] ?? 1,
        });
      },
      () => {
        const totalWinCredits = results.reduce(
          (total, result) => total + (result?.payoutCredits ?? 0),
          0,
        );

        const payoutCents = totalWinCredits * denominationValueCents;
        dispatch({
          type: "draw-finished",
          payoutCents,
        });
        if (payoutCents === 0) {
          return;
        }

        const startingBalanceCents = displayBalanceCents;
        const startTime = performance.now();
        const duration = Math.min(
          MAX_PAYOUT_COUNT_UP_MS,
          BASE_PAYOUT_COUNT_UP_MS +
            totalWinCredits * PAYOUT_COUNT_UP_PER_CREDIT_MS,
        );
        soundManager.playLoop("creditCount");

        const countUp = (currentTime: number) => {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          dispatch({
            type: "payout-progressed",
            winCredits: Math.floor(totalWinCredits * progress),
            displayBalanceCents: Math.round(
              startingBalanceCents + payoutCents * progress,
            ),
          });

          if (progress < 1) {
            payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
          } else {
            payoutAnimationFrameRef.current = null;
            soundManager.stopLoop("creditCount");
            soundManager.play("creditCountEnd");
            dispatch({
              type: "payout-finished",
              winCredits: totalWinCredits,
              displayBalanceCents: startingBalanceCents + payoutCents,
            });
          }
        };

        payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
      },
    );
  }

  function handleCardClick(positionIndex: number) {
    if (gameState !== GAME_STATES.Awaiting_Holds || isDrawing) return;
    soundManager.play("hold");
    dispatch({ type: "card-held", cardIndex: positionIndex });
  }

  function handleGameSelect(gameId: GameId) {
    if (isRoundActive) return;

    dispatch({ type: "game-selected", gameId });
    setActiveModal(null);
  }

  function handleDenominationChange(nextDenomination: Denomination) {
    if (isRoundActive) return;
    dispatch({
      type: "denomination-changed",
      denomination: nextDenomination,
    });
  }

  const isRoundActive =
    gameState === GAME_STATES.Awaiting_Holds ||
    isDrawing ||
    isBetting ||
    isCountingPayout;
  const winningHands = handResults.flatMap((result) =>
    result && result.payoutCredits > 0 ? [result.rank] : [],
  );
  const isRoundResolved = hasResolvedAllHands;

  return (
    <div className="main-container">
      <header className="app-version">v{__APP_VERSION__}</header>
      {activeModal === "volume" && (
        <VolumeModal
          volume={soundVolume}
          onClose={() => setActiveModal(null)}
          onVolumeChange={handleSoundVolumeChange}
        />
      )}
      {activeModal === "denomination" && (
        <DenomModal
          selectedDenomination={denomination}
          onClose={() => setActiveModal(null)}
          onDenominationChange={handleDenominationChange}
        />
      )}
      {activeModal === "game-selection" && (
        <GameMenu
          selectedGameId={selectedGameId}
          onClose={() => setActiveModal(null)}
          onGameSelect={handleGameSelect}
        />
      )}
      {activeModal === "paytable" && (
        <PaytableModal
          bet={currentBet}
          game={selectedGame}
          winningHands={winningHands}
          onClose={() => setActiveModal(null)}
        />
      )}
      <GameTable
        gameState={gameState}
        initialHand={initialHand}
        hands={handsState}
        game={selectedGame}
        multipliers={multipliers}
        activeMultipliers={activeMultipliers}
        results={handResults}
        activeHandCount={activeHandCount}
      />
      <GameBottomArea
        interactiveHand={
          <InteractiveHand
            gameState={gameState}
            hands={handsState}
            initialHand={initialHand}
            isDrawing={isDrawing}
            isInitialDeal={isInitialDeal}
            game={selectedGame}
            multipliers={multipliers}
            activeMultipliers={activeMultipliers}
            results={handResults}
            activeHandCount={activeHandCount}
            initialHandResult={initialHandResult}
            onCardClick={handleCardClick}
          />
        }
        footer={
          <GameFooter
            winCredits={winCredits}
            isRoundResolved={isRoundResolved}
            creditsMode={isCreditsMode}
            balanceCents={displayBalanceCents}
            denominationValueCents={denominationValueCents}
            onModeChange={toggleCreditsMode}
            currentBet={currentBet}
            denomination={denomination}
            canDeal={canAffordBet}
            canBetMax={canAffordMaxBet}
            isRoundActive={isRoundActive}
            isBetting={isBetting}
            isResetConfirmationActive={isResetConfirmationActive}
            gameName={selectedGame.name}
            canDraw={gameState === GAME_STATES.Awaiting_Holds}
            isDrawing={isDrawing}
            canSpeedUpDraw={isResolvingDraw}
            onBetChange={changeBet}
            onDeal={handleDeal}
            onDenomClick={() => setActiveModal("denomination")}
            onMenuClick={() => setActiveModal("game-selection")}
            onPaytableClick={() => setActiveModal("paytable")}
            onVolumeClick={() => setActiveModal("volume")}
            onDraw={handleDraw}
            onSpeedUpDraw={handleSpeedUpDraw}
            onResetBalance={handleResetBalance}
          />
        }
        isUltimateXActive={isUltimateXActive}
        isRoundActive={isRoundActive}
        onActivateUltimateX={() => changeBet(MAX_BET)}
      />
    </div>
  );
}

export default Main;
