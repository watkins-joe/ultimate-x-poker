import { useState } from "react";
import {
  getPaytableBetAmount,
  type BaseBetAmount,
  type BetAmount,
} from "../../../config/gameConfig";
import type { GameDefinition, HandRank } from "../../../config/games";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";
import Paytable from "./Paytable";

const PAYTABLE_COINS = [
  1, 2, 3, 4, 5,
] as const satisfies readonly BaseBetAmount[];

interface PaytableModalProps {
  game: GameDefinition;
  bet: BetAmount;
  winningHands: readonly HandRank[];
  onClose: () => void;
}

function PaytableModal({
  game,
  bet,
  winningHands,
  onClose,
}: PaytableModalProps) {
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [coin, setCoin] = useState<BaseBetAmount>(() =>
    getPaytableBetAmount(bet),
  );
  const title = showMultipliers ? "MULTIPLIERS" : `PAY TABLE`;
  const coinIndex = PAYTABLE_COINS.indexOf(coin);

  function changeCoin(direction: -1 | 1) {
    const nextCoin = PAYTABLE_COINS[coinIndex + direction];
    if (nextCoin !== undefined) setCoin(nextCoin);
  }

  return (
    <Modal
      className="paytable-modal"
      onClose={onClose}
      showCloseButton
      title={title}
    >
      <div className="paytable-modal-content">
        <Paytable
          coin={coin}
          game={game}
          showMultipliers={showMultipliers}
          winningHands={winningHands}
        />
        <div className="paytable-rules">
          <p>Bet max credits per hand to activate the Ultimate X feature.</p>
          <p>A multiplier is awarded for a winning hand.</p>
        </div>
        <div className="paytable-modal-controls">
          <Button
            disabled={coin === 1}
            text="BET DOWN"
            onButtonClick={() => changeCoin(-1)}
          />
          <Button
            disabled={false}
            text={showMultipliers ? "SEE PAYS" : "MULTIPLIERS"}
            onButtonClick={() => setShowMultipliers((current) => !current)}
          />
          <Button
            disabled={coin === 5}
            text="BET UP"
            onButtonClick={() => changeCoin(1)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default PaytableModal;
