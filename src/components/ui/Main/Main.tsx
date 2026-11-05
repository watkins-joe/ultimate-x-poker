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
import DenomModal from "../DenomModal/DenomModal";
import GameBottomArea from "../GameBottomArea/GameBottomArea";
import GameFooter from "../GameFooter/GameFooter";
import GameMenu from "../GameMenu/GameMenu";
import GameTable from "../InteractiveHand/GameTable";
import InteractiveHand, {
  type HandResult,
} from "../InteractiveHand/InteractiveHand";
import PaytableModal from "../Paytable/PaytableModal";
import "./Main.scss";

const DEFAULT_DENOMINATION: Denomination = "25c";
const STARTING_BALANCE_CENTS = 100_000;
const DEAL_CARD_DELAY_MS = 120;
const DRAW_CARD_DELAY_MS = 35;
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
  const [activeMultipliers, setActiveMultipliers] = useState<number[]>(() =>
    Array(MULTI_HAND_COUNT).fill(1),
  );
  const [handResults, setHandResults] = useState<(HandResult | null)[]>(() =>
    Array(MULTI_HAND_COUNT).fill(null),
  );
  const [initialHandResult, setInitialHandResult] = useState<HandResult | null>(
    null,
  );
  const [hasResolvedAllHands, setHasResolvedAllHands] = useState(false);
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

    setHandsState(hiddenHands);
    setIsDrawing(true);
    remainingCardsByHand.forEach((remainingCards, handIndex) => {
      if (remainingCards === 0) resolveHand(handIndex);
    });
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
      remainingCardsByHand[nextCard.handIndex] -= 1;
      if (remainingCardsByHand[nextCard.handIndex] === 0) {
        resolveHand(nextCard.handIndex);
      }
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

    setCurrentBet(bet);
    setBalanceCents((balance) => balance - wagerCostCents);
    setDisplayBalanceCents((balance) => balance - wagerCostCents);
    setWinCredits(0);
    setHandResults(Array(MULTI_HAND_COUNT).fill(null));
    setInitialHandResult(null);
    setHasResolvedAllHands(false);
    const bonusIsActive = bet === MAX_BET;
    const multipliersForDeal = bonusIsActive
      ? [...multipliers]
      : Array(MULTI_HAND_COUNT).fill(1);
    setActiveMultipliers(multipliersForDeal);
    if (bonusIsActive) {
      setMultipliers(Array(MULTI_HAND_COUNT).fill(1));
    }
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
        const initialResult = getHandResult(
          dealtHand,
          bet,
          selectedGame,
          multipliersForDeal[MULTI_HAND_COUNT - 1] ?? 1,
        );
        setInitialHandResult(
          initialResult && initialResult.payoutCredits > 0
            ? initialResult
            : null,
        );
        setGameState(GAME_STATES.Awaiting_Holds);
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
    setInitialHandResult(null);
    setHasResolvedAllHands(false);
    setWinCredits(0);
    setGameState(GAME_STATES.Game_Over);

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

        setHandResults((current) =>
          current.map((existing, index) =>
            index === handIndex ? result : existing,
          ),
        );
        if (bonusIsActive) {
          setMultipliers((current) =>
            current.map((multiplier, index) =>
              index === handIndex && result.payoutCredits > 0
                ? (selectedGame.multiplierByHand[result.rank] ?? 1)
                : index === handIndex
                  ? 1
                  : multiplier,
            ),
          );
        }
      },
      () => {
        setHasResolvedAllHands(true);
        const totalWinCredits = results.reduce(
          (total, result) => total + (result?.payoutCredits ?? 0),
          0,
        );

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
          setWinCredits(Math.floor(totalWinCredits * progress));
          setDisplayBalanceCents(
            Math.round(startingBalanceCents + payoutCents * progress),
          );

          if (progress < 1) {
            payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
          } else {
            payoutAnimationFrameRef.current = null;
            setWinCredits(totalWinCredits);
            setDisplayBalanceCents(startingBalanceCents + payoutCents);
            setIsCountingPayout(false);
          }
        };

        payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
      },
    );
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
    setInitialHandResult(null);
    setHasResolvedAllHands(false);
    setInitialHand(createEmptyHand());
    setHandsState(createEmptyMultiHand());
    setMultipliers(Array(MULTI_HAND_COUNT).fill(1));
    setActiveMultipliers(Array(MULTI_HAND_COUNT).fill(1));
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
  const isRoundResolved = hasResolvedAllHands;

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
        }
        isUltimateXActive={isUltimateXActive}
        isRoundActive={isRoundActive}
        onActivateUltimateX={() => changeBet(MAX_BET)}
      />
    </div>
  );
}

export default Main;
