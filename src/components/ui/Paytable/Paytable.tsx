import type { BaseBetAmount } from "../../../config/gameConfig";
import type { GameDefinition } from "../../../config/games";
import "./Paytable.scss";

interface PaytableProps {
  game: GameDefinition;
  coin: BaseBetAmount;
  showMultipliers: boolean;
}

function Paytable({ game, coin, showMultipliers }: PaytableProps) {
  const payoutHands = Object.keys(game.handNames);

  return (
    <div className={`paytable${showMultipliers ? " is-multiplier-table" : ""}`}>
      <div className="paytable-columns">
        <div className="paytable-column paytable-hands">
          {payoutHands.map((hand) => (
            <div className="paytable-hand" key={hand}>
              <span>{game.handNames[hand].toUpperCase()}</span>
              <span className="paytable-leader" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="paytable-column paytable-values">
          {payoutHands.map((hand) => (
            <div className="paytable-payout" key={hand}>
              {showMultipliers
                ? game.multiplierByHand[hand] === undefined
                  ? "-"
                  : `${game.multiplierByHand[hand]}X`
                : game.payoutsPerBet[coin][hand]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Paytable;
