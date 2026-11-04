import { GAMES, type GameId } from "../../../config/games";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";
import "./GameMenu.scss";

interface GameMenuProps {
  selectedGameId: GameId;
  onClose: () => void;
  onGameSelect: (gameId: GameId) => void;
}

function GameMenu({ selectedGameId, onClose, onGameSelect }: GameMenuProps) {
  return (
    <Modal className="game-menu-modal" onClose={onClose} title="CHOOSE A GAME">
      <div className="game-menu-options">
        {Object.values(GAMES).map((game) => (
          <button
            aria-label={`Select ${game.name}`}
            aria-pressed={selectedGameId === game.id}
            className={`game-menu-option${
              selectedGameId === game.id ? " is-selected" : ""
            }`}
            key={game.id}
            onClick={() => onGameSelect(game.id)}
            type="button"
          >
            <img alt={game.name} src={`/assets/ui/games/${game.image}`} />
          </button>
        ))}
      </div>
      <Button disabled={false} onButtonClick={onClose} text="CLOSE" />
    </Modal>
  );
}

export default GameMenu;
