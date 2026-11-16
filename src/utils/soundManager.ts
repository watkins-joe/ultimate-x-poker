const SOUND_URLS = {
  click: "/assets/sounds/click.ogg",
  carddealt: "/assets/sounds/carddealt.ogg",
  hold: "/assets/sounds/hold1r.ogg",
  loser: "/assets/sounds/loser1.ogg",
  win: "/assets/sounds/win.ogg",
  cate1: "/assets/sounds/cate1r.ogg",
  cate2: "/assets/sounds/cate2r.ogg",
  cate5: "/assets/sounds/cate5r.ogg",
  cate6: "/assets/sounds/cate6r.ogg",
  cate9: "/assets/sounds/cate9r.ogg",
  cate13: "/assets/sounds/cate13r.ogg",
  multLow: "/assets/sounds/mult_low.ogg",
  multMid: "/assets/sounds/mult_mid.ogg",
  multHigh: "/assets/sounds/mult_high.ogg",
  speedUpDraw: "/assets/sounds/evltrb25r.ogg",
  creditCount: "/assets/sounds/crdtlp2r.ogg",
  creditCountEnd: "/assets/sounds/lstone2r.ogg",
  maxBet: "/assets/sounds/mxbet2r.ogg",
} as const;

type SoundKey = keyof typeof SOUND_URLS;

class SoundManager {
  private context: AudioContext | null = null;
  private readonly buffers = new Map<SoundKey, AudioBuffer>();
  private readonly pendingLoads = new Map<SoundKey, Promise<void>>();
  private readonly loopingSources = new Map<SoundKey, AudioBufferSourceNode>();
  private masterGain: GainNode | null = null;
  private volume = 10;
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

  setVolume(volume: number): void {
    this.volume = Math.min(10, Math.max(0, Math.round(volume)));
    if (this.context) {
      this.getMasterGain(this.context).gain.value = this.volume / 10;
    }
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
      gain.connect(this.getMasterGain(context));
      source.start();
    } catch (error) {
      console.error(`Unable to play sound "${key}".`, error);
    }
  }

  playLoop(key: SoundKey, volume = 0.5): void {
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

      this.stopLoop(key);
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(this.getMasterGain(context));
      source.start();
      this.loopingSources.set(key, source);
    } catch (error) {
      console.error(`Unable to loop sound "${key}".`, error);
    }
  }

  stopLoop(key: SoundKey): void {
    const source = this.loopingSources.get(key);
    if (!source) return;

    this.loopingSources.delete(key);
    source.stop();
    source.disconnect();
  }

  private getMasterGain(context: AudioContext): GainNode {
    if (this.masterGain) return this.masterGain;

    this.masterGain = context.createGain();
    this.masterGain.gain.value = this.volume / 10;
    this.masterGain.connect(context.destination);
    return this.masterGain;
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
