import { BETTING_OPTIONS, type BetAmount } from "../../../config/gameConfig";
import type { GameDefinition, HandRank } from "../../../config/games";
import "./Paytable.scss";

interface PaytableProps {
  game: GameDefinition;
  activeBet: BetAmount | null;
  winningHand: HandRank | null;
}

function Paytable({ game, activeBet, winningHand }: PaytableProps) {
  const payoutHands = Object.keys(game.handNames);

  return (
    <div className="paytable">
      <div className="paytable-columns">
        <div className="paytable-column paytable-hands">
          {payoutHands.map((hand) => (
            <div className="paytable-hand" key={hand}>
              <span className={winningHand === hand ? "is-winning" : ""}>
                {game.handNames[hand]}
              </span>
              <span className="paytable-leader" aria-hidden="true" />
            </div>
          ))}
        </div>
        {BETTING_OPTIONS.map((bet) => (
          <div
            className={`paytable-column${activeBet === bet ? " is-active-bet" : ""}`}
            key={bet}
          >
            {payoutHands.map((hand) => (
              <div
                className={`paytable-payout${
                  winningHand === hand && activeBet === bet
                    ? " is-winning"
                    : ""
                }`}
                key={hand}
              >
                {game.payoutsPerBet[bet][hand]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Paytable;
