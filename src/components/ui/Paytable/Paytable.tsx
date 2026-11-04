import type { BetAmount } from "../../../config/gameConfig";
import type { GameDefinition, HandRank } from "../../../config/games";
import "./Paytable.scss";

interface PaytableProps {
  game: GameDefinition;
  bet: BetAmount;
  winningHands: readonly HandRank[];
  showMultipliers: boolean;
}

function Paytable({ game, bet, winningHands, showMultipliers }: PaytableProps) {
  const payoutHands = Object.keys(game.handNames);

  return (
    <div className={`paytable${showMultipliers ? " is-multiplier-table" : ""}`}>
      <div className="paytable-columns">
        <div className="paytable-column paytable-hands">
          {payoutHands.map((hand) => (
            <div className="paytable-hand" key={hand}>
              <span className={winningHands.includes(hand) ? "is-winning" : ""}>
                {game.handNames[hand]}
              </span>
              <span className="paytable-leader" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="paytable-column paytable-values">
          {payoutHands.map((hand) => (
            <div
              className={`paytable-payout${
                winningHands.includes(hand) ? " is-winning" : ""
              }`}
              key={hand}
            >
              {showMultipliers
                ? game.multiplierByHand[hand] === undefined
                  ? "-"
                  : `${game.multiplierByHand[hand]}X`
                : game.payoutsPerBet[bet][hand]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Paytable;
