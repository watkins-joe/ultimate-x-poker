import { useEffect } from "react";
import Main from "./components/ui/Main/Main";
import { soundManager } from "./utils/soundManager";

function App() {
  useEffect(() => {
    void soundManager.preloadAll();

    const playButtonClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("button:not(:disabled)")
      ) {
        soundManager.play("click");
      }
    };

    const unlockAudio = () => {
      soundManager.unlock();
      window.removeEventListener("pointerdown", unlockAudio, true);
      window.removeEventListener("keydown", unlockAudio, true);
    };

    window.addEventListener("click", playButtonClick, true);
    window.addEventListener("pointerdown", unlockAudio, {
      capture: true,
      once: true,
    });
    window.addEventListener("keydown", unlockAudio, {
      capture: true,
      once: true,
    });

    return () => {
      window.removeEventListener("click", playButtonClick, true);
      window.removeEventListener("pointerdown", unlockAudio, true);
      window.removeEventListener("keydown", unlockAudio, true);
    };
  }, []);

  return <Main />;
}

export default App;
