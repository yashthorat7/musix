const STORAGE_KEY = "musix_state_v1";

const DEFAULT_STATE = {
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  currentTime: 0,
  volume: 0.7,
  isMuted: false,
  equalizer: {
    bass: 50,
    mids: 50,
    treble: 50,
    air: 50,
  },
  isMiniview: false,
  windowPosition: null,
  settings: {
    globalShortcut: "Alt+Shift+M",
    resumePosition: false,
    closeToTray: true,
  },
};

let cachedState = null;

export function isAbsolutePath(path) {
  if (!path || typeof path !== "string") return false;
  return /^[a-zA-Z]:[/\\]|^\\\\|^\//.test(path);
}

function sanitizeSongForStorage(song) {
  if (!song) return null;
  const songPath = typeof song === "string" ? song : song.path || "";
  if (!songPath || !isAbsolutePath(songPath)) return null;
  const fileName =
    song.fileName || songPath.split(/[/\\]/).pop() || "Unknown Track";
  const meta = song && typeof song === "object" ? song.metadata : null;
  return {
    path: songPath,
    fileName,
    metadata: meta
      ? {
          title: meta.title || null,
          artist: meta.artist || null,
          album: meta.album || null,
          duration:
            typeof meta.duration === "number" && Number.isFinite(meta.duration)
              ? meta.duration
              : null,
          year: meta.year || null,
          genre: meta.genre || null,
          cover_art:
            typeof meta.cover_art === "string" && meta.cover_art.length < 80000
              ? meta.cover_art
              : null,
        }
      : null,
  };
}

export function loadMusixState() {
  if (cachedState) return cachedState;

  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (!raw) {
      cachedState = { ...DEFAULT_STATE };
      return cachedState;
    }

    const parsed = JSON.parse(raw);
    const parsedEq = parsed.equalizer || {};
    const sanitizedEq = {
      bass: typeof parsedEq.bass === "number" ? parsedEq.bass : 50,
      mids: typeof parsedEq.mids === "number" ? parsedEq.mids : 50,
      treble: typeof parsedEq.treble === "number" ? parsedEq.treble : 50,
      air: typeof parsedEq.air === "number" ? parsedEq.air : 50,
    };

    const validQueue = Array.isArray(parsed.queue)
      ? parsed.queue.map(sanitizeSongForStorage).filter(Boolean)
      : [];

    let validTrack = sanitizeSongForStorage(parsed.currentTrack);
    let validIndex =
      typeof parsed.currentIndex === "number" ? parsed.currentIndex : -1;

    if (validTrack && !validQueue.some((s) => s.path === validTrack.path)) {
      if (validQueue.length > 0) {
        validTrack = validQueue[0];
        validIndex = 0;
      } else {
        validTrack = null;
        validIndex = -1;
      }
    }

    if (validIndex < 0 || validIndex >= validQueue.length) {
      validIndex = validQueue.length > 0 ? 0 : -1;
      validTrack = validIndex >= 0 ? validQueue[validIndex] : null;
    }

    const validVolume =
      typeof parsed.volume === "number" && Number.isFinite(parsed.volume)
        ? Math.max(0, Math.min(1, parsed.volume))
        : 0.7;

    cachedState = {
      ...DEFAULT_STATE,
      ...parsed,
      volume: validVolume,
      queue: validQueue,
      currentTrack: validTrack,
      currentIndex: validIndex,
      equalizer: sanitizedEq,
      settings: {
        ...DEFAULT_STATE.settings,
        ...(parsed.settings || {}),
      },
    };

    return cachedState;
  } catch (err) {
    cachedState = { ...DEFAULT_STATE };
    return cachedState;
  }
}

export function saveMusixState(partialState) {
  try {
    const currentState = loadMusixState();
    const updatedState = { ...currentState, ...partialState };

    const sanitizedQueue = Array.isArray(updatedState.queue)
      ? updatedState.queue.map(sanitizeSongForStorage).filter(Boolean)
      : [];

    const sanitizedTrack = sanitizeSongForStorage(updatedState.currentTrack);

    const safeToSave = {
      ...updatedState,
      queue: sanitizedQueue,
      currentTrack: sanitizedTrack,
    };

    cachedState = safeToSave;

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeToSave));
      } catch (quotaError) {
        try {
          const strippedQueue = sanitizedQueue.map((s) => ({
            ...s,
            metadata: s.metadata ? { ...s.metadata, cover_art: null } : null,
          }));
          const strippedTrack = sanitizedTrack
            ? {
                ...sanitizedTrack,
                metadata: sanitizedTrack.metadata
                  ? { ...sanitizedTrack.metadata, cover_art: null }
                  : null,
              }
            : null;
          const minimalState = {
            ...safeToSave,
            queue: strippedQueue,
            currentTrack: strippedTrack,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
        } catch (e) {}
      }
    }
  } catch (err) {}
}
