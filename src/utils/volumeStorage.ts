export const SOUND_VOLUME_STORAGE_KEY = "ultimate-x-poker.soundVolume";
export const DEFAULT_SOUND_VOLUME = 10;

type VolumeStorage = Pick<Storage, "getItem" | "setItem">;

export function loadSoundVolume(storage: VolumeStorage): number {
  const storedVolume = storage.getItem(SOUND_VOLUME_STORAGE_KEY);
  if (storedVolume === null) return DEFAULT_SOUND_VOLUME;

  const volume = Number(storedVolume);
  if (
    storedVolume.trim() === "" ||
    !Number.isInteger(volume) ||
    volume < 0 ||
    volume > 10
  ) {
    console.error("Stored sound volume is invalid; using the default.");
    return DEFAULT_SOUND_VOLUME;
  }

  return volume;
}

export function saveSoundVolume(
  storage: VolumeStorage,
  volume: number,
): void {
  storage.setItem(SOUND_VOLUME_STORAGE_KEY, String(volume));
}
