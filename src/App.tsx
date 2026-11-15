import { useEffect } from "react";
import Main from "./components/ui/Main/Main";
import { soundManager } from "./utils/soundManager";

function App() {
  useEffect(() => {
    void soundManager.preloadAll();

    const unlockAudio = () => {
      soundManager.unlock();
      window.removeEventListener("pointerdown", unlockAudio, true);
      window.removeEventListener("keydown", unlockAudio, true);
    };

    window.addEventListener("pointerdown", unlockAudio, {
      capture: true,
      once: true,
    });
    window.addEventListener("keydown", unlockAudio, {
      capture: true,
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio, true);
      window.removeEventListener("keydown", unlockAudio, true);
    };
  }, []);

  return <Main />;
}

export default App;
