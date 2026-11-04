import { useEffect, useId, type MouseEvent } from "react";
import "./Modal.scss";

interface ModalProps {
  title: string;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, className = "", onClose, children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal-content ${className}`.trim()}
        role="dialog"
      >
        <h2 className="modal-title" id={titleId}>
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}

export default Modal;
