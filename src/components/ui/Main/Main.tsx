import { useEffect, useRef, useState } from "react";
import {
  BETTING_OPTIONS,
  DEFAULT_BETTING_INDEX,
  DENOMINATIONS,
  GAME_STATES,
  getActiveHandCount,
  getPaytableBetAmount,
  type BetAmount,
  type Denomination,
  type GameState,
} from "../../../config/gameConfig";
import {
  DEFAULT_GAME_ID,
  GAMES,
  type GameDefinition,
  type GameId,
} from "../../../config/games";
import {
  createEmptyHand,
  createEmptyMultiHand,
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
import { CARDS, shuffle } from "../../../utils/cards";
import Controls from "../Controls/Controls";
import { CreditMeter } from "../CreditsCounter/CreditsCounter";
import DenomModal from "../DenomModal/DenomModal";
import GameMenu from "../GameMenu/GameMenu";
import InteractiveHand, {
  type HandResult,
} from "../InteractiveHand/InteractiveHand";
import PaytableModal from "../Paytable/PaytableModal";
import WinMeter from "../WinMeter/WinMeter";
import "./Main.scss";

const DEFAULT_DENOMINATION: Denomination = "25c";
const STARTING_BALANCE_CENTS = 100_000;
const DEAL_CARD_DELAY_MS = 120;
const DRAW_CARD_DELAY_MS = 35;
const BET_COLUMN_DELAY_MS = 120;
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

function Main() {
  const [isCreditsMode, setIsCreditsMode] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<GameId>(getInitialGame);
  const [denomination, setDenomination] = useState<Denomination>(
    getInitialDenomination,
  );
  const [currentBet, setCurrentBet] = useState<BetAmount>(
    BETTING_OPTIONS[DEFAULT_BETTING_INDEX],
  );
  const [balanceCents, setBalanceCents] = useState(getInitialBalanceCents);
  const [displayBalanceCents, setDisplayBalanceCents] = useState(balanceCents);
  const [winCredits, setWinCredits] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GAME_STATES.Game_Over);
  const [initialHand, setInitialHand] = useState<INITIAL_HAND_STATE_TYPE>(() =>
    createEmptyHand(),
  );
  const [handsState, setHandsState] =
    useState<INITIAL_HAND_STATE_TYPE[]>(createEmptyMultiHand);
  const [multipliers, setMultipliers] = useState<number[]>(() =>
    Array(MULTI_HAND_COUNT).fill(1),
  );
  const [handResults, setHandResults] = useState<(HandResult | null)[]>(() =>
    Array(MULTI_HAND_COUNT).fill(null),
  );
  const [isInitialDeal, setIsInitialDeal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isBetting, setIsBetting] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "denomination" | "game-selection" | "paytable" | null
  >(null);
  const dealTimeoutRef = useRef<number | null>(null);
  const payoutAnimationFrameRef = useRef<number | null>(null);
  const resetConfirmationTimeoutRef = useRef<number | null>(null);
  const [isResetConfirmationActive, setIsResetConfirmationActive] =
    useState(false);
  const [isCountingPayout, setIsCountingPayout] = useState(false);

  const denominationValueCents = DENOMINATIONS[denomination].valueCents;
  const selectedGame = GAMES[selectedGameId];
  const totalBetCostCents = currentBet * denominationValueCents;
  const canAffordBet = balanceCents >= totalBetCostCents;
  const maxBetCostCents = MAX_BET * denominationValueCents;
  const canAffordMaxBet = balanceCents >= maxBetCostCents;
  const isUltimateXActive = currentBet === MAX_BET;
  const activeHandCount = getActiveHandCount(currentBet);

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

  function changeBet(amount: BetAmount) {
    if (isRoundActive) return;
    setCurrentBet(amount);
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
    setBalanceCents(STARTING_BALANCE_CENTS);
    setDisplayBalanceCents(STARTING_BALANCE_CENTS);
  }

  function showInitialCards(
    cards: INITIAL_HAND_STATE_TYPE,
    onComplete: () => void,
  ) {
    setInitialHand(
      cards.map((card) =>
        card.isHeld ? { ...card } : { cardId: null, isHeld: false },
      ),
    );
    setIsInitialDeal(true);
    setIsDrawing(true);

    const cardsToReveal = cards.flatMap((card, index) =>
      card.isHeld ? [] : [index],
    );
    let revealIndex = 0;
    const revealNext = () => {
      const cardIndex = cardsToReveal[revealIndex];
      if (cardIndex === undefined) {
        dealTimeoutRef.current = null;
        setIsDrawing(false);
        setIsInitialDeal(false);
        onComplete();
        return;
      }

      setInitialHand((current) =>
        current.map((card, index) =>
          index === cardIndex ? { ...cards[cardIndex] } : card,
        ),
      );
      revealIndex += 1;
      dealTimeoutRef.current = window.setTimeout(
        revealNext,
        DEAL_CARD_DELAY_MS,
      );
    };

    revealNext();
  }

  function showHands(hands: INITIAL_HAND_STATE_TYPE[], onComplete: () => void) {
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

    setHandsState(hiddenHands);
    setIsDrawing(true);
    let revealIndex = 0;
    const revealNext = () => {
      const nextCard = cardsToReveal[revealIndex];
      if (nextCard === undefined) {
        dealTimeoutRef.current = null;
        setIsDrawing(false);
        onComplete();
        return;
      }

      setHandsState((current) =>
        current.map((hand, handIndex) =>
          handIndex !== nextCard.handIndex
            ? hand
            : hand.map((card, cardIndex) =>
                cardIndex === nextCard.cardIndex
                  ? { ...hands[handIndex][cardIndex] }
                  : card,
              ),
        ),
      );
      revealIndex += 1;
      dealTimeoutRef.current = window.setTimeout(
        revealNext,
        DRAW_CARD_DELAY_MS,
      );
    };

    revealNext();
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

    setCurrentBet(bet);
    setBalanceCents((balance) => balance - wagerCostCents);
    setDisplayBalanceCents((balance) => balance - wagerCostCents);
    setWinCredits(0);
    setHandResults(Array(MULTI_HAND_COUNT).fill(null));
    setInitialHand(createEmptyHand());
    setHandsState(createEmptyMultiHand());
    setGameState(GAME_STATES.Game_Over);
    setIsBetting(true);

    const dealCards = () => {
      setIsBetting(false);
      const dealtHand = shuffle(CARDS)
        .slice(0, INITIAL_HAND_STATE.length)
        .map((cardId) => ({ cardId, isHeld: false }));

      showInitialCards(dealtHand, () => {
        setGameState(GAME_STATES.Awaiting_Holds);
      });
    };

    const highlightBetColumn = (highlightedBet: BetAmount) => {
      dealTimeoutRef.current = window.setTimeout(() => {
        if (highlightedBet === bet) {
          dealCards();
          return;
        }

        const nextBet =
          BETTING_OPTIONS[BETTING_OPTIONS.indexOf(highlightedBet) + 1];
        if (nextBet === undefined) {
          dealCards();
        } else {
          highlightBetColumn(nextBet);
        }
      }, BET_COLUMN_DELAY_MS);
    };

    highlightBetColumn(BETTING_OPTIONS[0]);
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
    const firstActiveHandIndex = MULTI_HAND_COUNT - activeHandCount;
    const finalHands = Array.from(
      { length: MULTI_HAND_COUNT },
      (_, handIndex) => {
        if (handIndex < firstActiveHandIndex) return createEmptyHand();

        const replacementCards = shuffle(
          CARDS.filter((cardId) => !initialCardIds.has(cardId)),
        );
        return initialHand.map((card) =>
          card.isHeld
            ? { ...card }
            : { cardId: replacementCards.pop() ?? null, isHeld: false },
        );
      },
    );

    setHandResults(Array(MULTI_HAND_COUNT).fill(null));
    setWinCredits(0);
    setGameState(GAME_STATES.Game_Over);

    showHands(finalHands, () => {
      const bonusIsActive = currentBet === MAX_BET;
      const results = finalHands.map((hand, handIndex) =>
        handIndex < firstActiveHandIndex
          ? null
          : getHandResult(
              hand,
              currentBet,
              selectedGame,
              bonusIsActive ? (multipliers[handIndex] ?? 1) : 1,
            ),
      );
      const totalWinCredits = results.reduce(
        (total, result) => total + (result?.payoutCredits ?? 0),
        0,
      );

      setHandResults(results);
      if (bonusIsActive) {
        setMultipliers(
          results.map((result) =>
            result?.payoutCredits
              ? (selectedGame.multiplierByHand[result.rank] ?? 1)
              : 1,
          ),
        );
      }

      const payoutCents = totalWinCredits * denominationValueCents;
      setBalanceCents((balance) => balance + payoutCents);
      if (payoutCents === 0) {
        setWinCredits(0);
        setIsCountingPayout(false);
        return;
      }

      const startingBalanceCents = displayBalanceCents;
      const startTime = performance.now();
      const duration = Math.min(
        MAX_PAYOUT_COUNT_UP_MS,
        BASE_PAYOUT_COUNT_UP_MS +
          totalWinCredits * PAYOUT_COUNT_UP_PER_CREDIT_MS,
      );
      setIsCountingPayout(true);

      const countUp = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setDisplayBalanceCents(
          Math.round(startingBalanceCents + payoutCents * progress),
        );
        setWinCredits(Math.round(totalWinCredits * progress));

        if (progress < 1) {
          payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
        } else {
          payoutAnimationFrameRef.current = null;
          setDisplayBalanceCents(startingBalanceCents + payoutCents);
          setWinCredits(totalWinCredits);
          setIsCountingPayout(false);
        }
      };

      payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
    });
  }

  function handleCardClick(positionIndex: number) {
    if (gameState !== GAME_STATES.Awaiting_Holds || isDrawing) return;
    setInitialHand((cards) =>
      cards.map((card, index) =>
        index === positionIndex ? { ...card, isHeld: !card.isHeld } : card,
      ),
    );
  }

  function handleGameSelect(gameId: GameId) {
    if (isRoundActive) return;

    setSelectedGameId(gameId);
    setHandResults(Array(MULTI_HAND_COUNT).fill(null));
    setInitialHand(createEmptyHand());
    setHandsState(createEmptyMultiHand());
    setMultipliers(Array(MULTI_HAND_COUNT).fill(1));
    setWinCredits(0);
    setGameState(GAME_STATES.Game_Over);
    setActiveModal(null);
  }

  function handleDenominationChange(nextDenomination: Denomination) {
    if (isRoundActive) return;
    setDenomination(nextDenomination);
  }

  const isRoundActive =
    gameState === GAME_STATES.Awaiting_Holds ||
    isDrawing ||
    isBetting ||
    isCountingPayout;
  const winningHands = handResults.flatMap((result) =>
    result && result.payoutCredits > 0 ? [result.rank] : [],
  );
  const winningHandCount = winningHands.length;
  const roundTitle =
    gameState === GAME_STATES.Awaiting_Holds ? "SELECT CARDS TO HOLD" : "";
  const isRoundResolved = handResults.some((result) => result !== null);
  const isReadyToPlay =
    !isRoundActive &&
    initialHand.every((card) => card.cardId === null) &&
    handResults.every((result) => result === null);

  return (
    <div className="main-container">
      <header className="app-version">v{__APP_VERSION__}</header>
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
          canChangeBet={!isRoundActive}
          game={selectedGame}
          winningHands={winningHands}
          onBetChange={changeBet}
          onClose={() => setActiveModal(null)}
        />
      )}
      <section className="game-shell" aria-label="Ultimate X Poker table">
        <InteractiveHand
          gameState={gameState}
          hands={handsState}
          initialHand={initialHand}
          isDrawing={isDrawing}
          isInitialDeal={isInitialDeal}
          game={selectedGame}
          multipliers={multipliers}
          results={handResults}
          activeHandCount={activeHandCount}
          onCardClick={handleCardClick}
        />
        {isReadyToPlay && (
          <button
            className="play-overlay"
            disabled={!canAffordBet}
            onClick={() => handleDeal()}
            type="button"
          >
            PLAY {currentBet} CREDITS
          </button>
        )}
        <button
          aria-label={
            isUltimateXActive
              ? "Ultimate X bonus active"
              : "Set bet to 100 credits to activate Ultimate X"
          }
          className="ultimate-x-indicator"
          disabled={isUltimateXActive || isRoundActive}
          onClick={() => changeBet(MAX_BET)}
          type="button"
        >
          <img
            alt={
              isUltimateXActive
                ? "Ultimate X active"
                : "Bet max credits to activate the Ultimate X feature"
            }
            src={`/assets/ui/${isUltimateXActive ? "bonusActive" : "betMax"}.gif`}
          />
        </button>
      </section>
      <div id="meters">
        <WinMeter
          isResolved={isRoundResolved}
          winCredits={winCredits}
          winningHandCount={winningHandCount}
        />
        <CreditMeter
          creditsMode={isCreditsMode}
          balanceCents={displayBalanceCents}
          denominationValueCents={denominationValueCents}
          onModeChange={toggleCreditsMode}
        />
      </div>
      <Controls
        currentBet={currentBet}
        denomination={denomination}
        canDeal={canAffordBet}
        canBetMax={canAffordMaxBet}
        isRoundActive={isRoundActive}
        isBetting={isBetting}
        isResetConfirmationActive={isResetConfirmationActive}
        isUltimateXActive={isUltimateXActive}
        gameName={selectedGame.name}
        canDraw={gameState === GAME_STATES.Awaiting_Holds}
        isDrawing={isDrawing}
        onBetChange={changeBet}
        onDeal={handleDeal}
        onDenomClick={() => setActiveModal("denomination")}
        onMenuClick={() => setActiveModal("game-selection")}
        onPaytableClick={() => setActiveModal("paytable")}
        onDraw={handleDraw}
        onResetBalance={handleResetBalance}
      />
    </div>
  );
}

export default Main;
