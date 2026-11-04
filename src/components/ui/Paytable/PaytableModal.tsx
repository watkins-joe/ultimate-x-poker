import { useState } from "react";
import {
  BETTING_OPTIONS,
  type BetAmount,
} from "../../../config/gameConfig";
import type { GameDefinition, HandRank } from "../../../config/games";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";
import Paytable from "./Paytable";

interface PaytableModalProps {
  game: GameDefinition;
  bet: BetAmount;
  canChangeBet: boolean;
  winningHands: readonly HandRank[];
  onBetChange: (bet: BetAmount) => void;
  onClose: () => void;
}

function PaytableModal({
  game,
  bet,
  canChangeBet,
  winningHands,
  onBetChange,
  onClose,
}: PaytableModalProps) {
  const [showMultipliers, setShowMultipliers] = useState(false);
  const betIndex = BETTING_OPTIONS.indexOf(bet);
  const title = showMultipliers ? "MULTIPLIERS" : "PAY TABLE";

  return (
    <Modal
      className="paytable-modal"
      onClose={onClose}
      showCloseButton
      title={title}
    >
      <div className="paytable-modal-content">
        <Paytable
          bet={bet}
          game={game}
          showMultipliers={showMultipliers}
          winningHands={winningHands}
        />
        <div className="paytable-rules">
          <p>
            Bets 1–9 play that many hands; bets 10 and higher play all ten.
          </p>
          <p>
            Payouts use 1 coin for bets 1–10, 2 for 20–40, 3 for 50, and 4 for
            100 credits.
          </p>
          <p>Bet 100 credits to activate the Ultimate X feature.</p>
          <p>
            Winning hands award a multiplier to the same row. It applies and
            resets after your next max-bet deal; lower bets leave it queued.
          </p>
        </div>
        <div className="paytable-modal-controls">
          <Button
            disabled={!canChangeBet || betIndex === 0}
            text="BET DOWN"
            onButtonClick={() => {
              const nextBet = BETTING_OPTIONS[betIndex - 1];
              if (nextBet !== undefined) onBetChange(nextBet);
            }}
          />
          <Button
            disabled={false}
            text={showMultipliers ? "SEE PAYS" : "MULTIPLIERS"}
            onButtonClick={() => setShowMultipliers((current) => !current)}
          />
          <Button
            disabled={!canChangeBet}
            text="BET UP"
            onButtonClick={() => {
              const nextBet =
                BETTING_OPTIONS[(betIndex + 1) % BETTING_OPTIONS.length];
              onBetChange(nextBet);
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

export default PaytableModal;
