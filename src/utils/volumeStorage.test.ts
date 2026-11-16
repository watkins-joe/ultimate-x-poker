import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SOUND_VOLUME,
  loadSoundVolume,
  saveSoundVolume,
  SOUND_VOLUME_STORAGE_KEY,
} from "./volumeStorage";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}

describe("sound volume storage", () => {
  it("defaults to maximum volume when no saved value exists", () => {
    expect(loadSoundVolume(createStorage())).toBe(DEFAULT_SOUND_VOLUME);
  });

  it("loads the muted and maximum volume endpoints", () => {
    expect(loadSoundVolume(createStorage("0"))).toBe(0);
    expect(loadSoundVolume(createStorage("10"))).toBe(10);
  });

  it("falls back to the default for invalid values", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(loadSoundVolume(createStorage("11"))).toBe(DEFAULT_SOUND_VOLUME);
    expect(loadSoundVolume(createStorage("2.5"))).toBe(DEFAULT_SOUND_VOLUME);
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });

  it("saves the chosen volume under the sound setting key", () => {
    const storage = createStorage();
    saveSoundVolume(storage, 4);
    expect(storage.setItem).toHaveBeenCalledWith(
      SOUND_VOLUME_STORAGE_KEY,
      "4",
    );
    expect(loadSoundVolume(storage)).toBe(4);
  });
});
