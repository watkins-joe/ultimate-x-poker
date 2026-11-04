import { useEffect, useRef, useState } from "react";
import {
  BETTING_OPTIONS,
  DEFAULT_BETTING_INDEX,
  DENOMINATIONS,
  GAME_STATES,
  type BetAmount,
  type Denomination,
  type GameState,
} from "../../../config/gameConfig";
import {
  DEFAULT_GAME_ID,
  GAMES,
  type GameDefinition,
  type GameId,
  type HandRank,
} from "../../../config/games";
import {
  INITIAL_HAND_STATE,
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
import HandTitle from "../HandTitle/HandTitle";
import InteractiveHand from "../InteractiveHand/InteractiveHand";
import Paytable from "../Paytable/Paytable";
import WinMeter from "../WinMeter/WinMeter";
import "./Main.scss";
const DEFAULT_DENOMINATION: Denomination = "25c";
const STARTING_BALANCE_CENTS = 100_000;
const DEAL_CARD_DELAY_MS = 120;
const BET_COLUMN_DELAY_MS = 180;
const RESET_CONFIRMATION_TIMEOUT_MS = 5000;
const BASE_PAYOUT_COUNT_UP_MS = 500;
const PAYOUT_COUNT_UP_PER_CREDIT_MS = 8;
const MAX_PAYOUT_COUNT_UP_MS = 4000;

interface HandResult {
  rank: HandRank;
  title: string;
  payoutCredits: number;
}

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
  const [isCreditsMode, setIsCreditsMode] = useState(false);
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
  const [handState, setHandState] = useState<INITIAL_HAND_STATE_TYPE>(() =>
    INITIAL_HAND_STATE.map((card) => ({ ...card })),
  );
  const [handResult, setHandResult] = useState<HandResult | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isBetting, setIsBetting] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "denomination" | "game-selection" | null
  >(null);
  const [activeBetColumn, setActiveBetColumn] = useState<BetAmount | null>(
    BETTING_OPTIONS[DEFAULT_BETTING_INDEX],
  );
  const dealTimeoutRef = useRef<number | null>(null);
  const payoutAnimationFrameRef = useRef<number | null>(null);
  const resetConfirmationTimeoutRef = useRef<number | null>(null);
  const [isResetConfirmationActive, setIsResetConfirmationActive] =
    useState(false);
  const [isCountingPayout, setIsCountingPayout] = useState(false);

  const denominationValueCents = DENOMINATIONS[denomination].valueCents;
  const selectedGame = GAMES[selectedGameId];
  const betCostCents = currentBet * denominationValueCents;
  const canAffordBet = balanceCents >= betCostCents;
  const maxBet = BETTING_OPTIONS[BETTING_OPTIONS.length - 1];
  const canAffordMaxBet = balanceCents >= maxBet * denominationValueCents;

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
    if (
      gameState !== GAME_STATES.Game_Over ||
      isDrawing ||
      isBetting ||
      isCountingPayout
    ) {
      return;
    }
    setCurrentBet(amount);
    setActiveBetColumn(amount);
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

  function showCards(
    cards: INITIAL_HAND_STATE_TYPE,
    onComplete: (finalCards: INITIAL_HAND_STATE_TYPE) => void,
  ) {
    const hiddenCards = cards.map((card) =>
      card.isHeld ? { ...card } : { cardId: null, isHeld: false },
    );
    const cardsToReveal = cards.flatMap((card, index) =>
      card.isHeld ? [] : [index],
    );

    setHandState(hiddenCards);
    setIsDrawing(true);

    let revealIndex = 0;
    const revealNext = () => {
      const cardIndex = cardsToReveal[revealIndex];
      if (cardIndex === undefined) {
        dealTimeoutRef.current = null;
        setIsDrawing(false);
        onComplete(cards);
        return;
      }

      setHandState((current) =>
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

  function getHandResult(
    cards: INITIAL_HAND_STATE_TYPE,
    bet: BetAmount = currentBet,
    game: GameDefinition = selectedGame,
  ): HandResult | null {
    const cardIds = cards.flatMap((card) =>
      card.cardId === null ? [] : [card.cardId],
    );
    if (cardIds.length !== INITIAL_HAND_STATE.length) return null;

    const rank = game.evaluateHand(cardIds);
    const payoutCredits = game.payoutsPerBet[bet][rank];
    return payoutCredits === undefined
      ? null
      : {
          rank,
          title: game.handNames[rank],
          payoutCredits,
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
    setHandResult(null);
    setGameState(GAME_STATES.Game_Over);
    setHandState(INITIAL_HAND_STATE.map((card) => ({ ...card })));

    setActiveBetColumn(null);
    setIsBetting(true);

    const dealCards = () => {
      setIsBetting(false);
      const dealtCards = shuffle(CARDS)
        .slice(0, INITIAL_HAND_STATE.length)
        .map((cardId) => ({
          cardId,
          isHeld: false,
        }));

      showCards(dealtCards, () => {
        setHandResult(getHandResult(dealtCards, bet, selectedGame));
        setGameState(GAME_STATES.Awaiting_Holds);
      });
    };

    const highlightBetColumn = (highlightedBet: BetAmount) => {
      setActiveBetColumn(highlightedBet);
      dealTimeoutRef.current = window.setTimeout(() => {
        if (highlightedBet === bet) {
          dealCards();
        } else {
          const nextBet =
            BETTING_OPTIONS[BETTING_OPTIONS.indexOf(highlightedBet) + 1];
          if (nextBet === undefined) {
            dealCards();
          } else {
            highlightBetColumn(nextBet);
          }
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

    const dealtCardIds = new Set(
      handState.flatMap((card) => (card.cardId === null ? [] : [card.cardId])),
    );
    const replacementCards = shuffle(
      CARDS.filter((cardId) => !dealtCardIds.has(cardId)),
    );
    const finalHand = handState.map((card) =>
      card.isHeld
        ? { ...card }
        : { cardId: replacementCards.pop() ?? null, isHeld: false },
    );

    setHandResult(null);
    setWinCredits(0);
    showCards(finalHand, (drawnCards) => {
      const result = getHandResult(drawnCards);
      const payoutCents = (result?.payoutCredits ?? 0) * denominationValueCents;

      setHandResult(result);
      setBalanceCents((balance) => balance + payoutCents);
      setGameState(GAME_STATES.Game_Over);

      if (!result || payoutCents === 0) {
        setWinCredits(0);
        setIsCountingPayout(false);
        return;
      }

      const startingBalanceCents = displayBalanceCents;
      const startTime = performance.now();
      const duration = Math.min(
        MAX_PAYOUT_COUNT_UP_MS,
        BASE_PAYOUT_COUNT_UP_MS +
          result.payoutCredits * PAYOUT_COUNT_UP_PER_CREDIT_MS,
      );
      setIsCountingPayout(true);

      const countUp = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setDisplayBalanceCents(
          Math.round(startingBalanceCents + payoutCents * progress),
        );
        setWinCredits(Math.round(result.payoutCredits * progress));

        if (progress < 1) {
          payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
        } else {
          payoutAnimationFrameRef.current = null;
          setDisplayBalanceCents(startingBalanceCents + payoutCents);
          setWinCredits(result.payoutCredits);
          setIsCountingPayout(false);
        }
      };

      payoutAnimationFrameRef.current = requestAnimationFrame(countUp);
    });
  }

  function handleCardClick(positionIndex: number) {
    if (gameState !== GAME_STATES.Awaiting_Holds || isDrawing) return;
    setHandState((cards) =>
      cards.map((card, index) =>
        index === positionIndex ? { ...card, isHeld: !card.isHeld } : card,
      ),
    );
  }

  function handleDenomClick() {
    setActiveModal("denomination");
  }

  function handleGameMenuClick() {
    setActiveModal("game-selection");
  }

  function handleGameSelect(gameId: GameId) {
    if (isRoundActive) return;

    setSelectedGameId(gameId);
    setHandResult(null);
    setWinCredits(0);
    setGameState(GAME_STATES.Game_Over);
    setHandState(INITIAL_HAND_STATE.map((card) => ({ ...card })));
    setActiveBetColumn(currentBet);
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
      <Paytable
        game={selectedGame}
        activeBet={activeBetColumn}
        winningHand={handResult?.rank ?? null}
      />
      <HandTitle gameState={gameState} title={handResult?.title ?? ""} />
      <InteractiveHand
        gameState={gameState}
        handState={[handState]}
        isDrawing={isDrawing}
        game={selectedGame}
        onCardClick={handleCardClick}
      />
      <div id="meters">
        <WinMeter winCredits={winCredits} />
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
        gameName={selectedGame.name}
        canDraw={gameState === GAME_STATES.Awaiting_Holds}
        isDrawing={isDrawing}
        onBetChange={changeBet}
        onDeal={handleDeal}
        onDenomClick={handleDenomClick}
        onMenuClick={handleGameMenuClick}
        onDraw={handleDraw}
        onResetBalance={handleResetBalance}
      />
    </div>
  );
}

export default Main;
