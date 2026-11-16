import Modal from "../Modal/Modal";
import "./VolumeModal.scss";

interface VolumeModalProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

function VolumeModal({
  volume,
  onVolumeChange,
  onClose,
}: VolumeModalProps) {
  return (
    <Modal
      className="volume-modal"
      onClose={onClose}
      showCloseButton
      title="SOUND VOLUME"
    >
      <label className="volume-control" htmlFor="sound-volume">
        <span className="volume-control__value">
          {volume === 0 ? "MUTED" : `${volume} / 10`}
        </span>
        <input
          id="sound-volume"
          max={10}
          min={0}
          onChange={(event) => onVolumeChange(Number(event.currentTarget.value))}
          step={1}
          type="range"
          value={volume}
        />
        <span className="volume-control__limits">
          <span>0 · MUTED</span>
          <span>10 · MAX</span>
        </span>
      </label>
    </Modal>
  );
}

export default VolumeModal;
