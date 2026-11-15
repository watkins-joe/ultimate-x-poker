const SOUND_URLS = {
  carddealt: "/assets/sounds/carddealt.ogg",
  hold: "/assets/sounds/hold1r.ogg",
  loser: "/assets/sounds/loser1.ogg",
} as const;

type SoundKey = keyof typeof SOUND_URLS;

class SoundManager {
  private context: AudioContext | null = null;
  private readonly buffers = new Map<SoundKey, AudioBuffer>();
  private readonly pendingLoads = new Map<SoundKey, Promise<void>>();
  private isUnlocked = false;

  private getContext(): AudioContext {
    if (this.context) return this.context;

    const audioWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor =
      window.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error("Web Audio is not supported by this browser.");
    }

    this.context = new AudioContextConstructor();
    return this.context;
  }

  unlock(): void {
    try {
      const context = this.getContext();
      if (context.state === "suspended") {
        void context.resume().catch((error: unknown) => {
          console.error("Unable to resume the audio context.", error);
        });
      }

      if (this.isUnlocked) return;

      const silentBuffer = context.createBuffer(1, 1, 22050);
      const source = context.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(context.destination);
      source.start();
      this.isUnlocked = true;
    } catch (error) {
      console.error("Unable to unlock audio playback.", error);
    }
  }

  async preloadAll(): Promise<void> {
    await Promise.all(
      (Object.keys(SOUND_URLS) as SoundKey[]).map((key) => this.preload(key)),
    );
  }

  play(key: SoundKey, volume = 0.5): void {
    try {
      const buffer = this.buffers.get(key);
      if (!buffer) {
        console.warn(`Sound "${key}" is not preloaded yet.`);
        return;
      }

      const context = this.getContext();
      if (context.state === "suspended") {
        console.warn(`Sound "${key}" cannot play before audio is unlocked.`);
        return;
      }

      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(context.destination);
      source.start();
    } catch (error) {
      console.error(`Unable to play sound "${key}".`, error);
    }
  }

  private async preload(key: SoundKey): Promise<void> {
    if (this.buffers.has(key)) return;

    const pendingLoad = this.pendingLoads.get(key);
    if (pendingLoad) {
      await pendingLoad;
      return;
    }

    const load = (async () => {
      try {
        const context = this.getContext();
        const response = await fetch(SOUND_URLS[key]);
        if (!response.ok) {
          throw new Error(
            `Request failed with status ${response.status} ${response.statusText}`,
          );
        }
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(key, buffer);
      } catch (error) {
        console.error(`Failed to preload sound "${key}".`, error);
      } finally {
        this.pendingLoads.delete(key);
      }
    })();

    this.pendingLoads.set(key, load);
    await load;
  }
}

export const soundManager = new SoundManager();
