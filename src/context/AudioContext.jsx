import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useMetadata } from "../hooks/useMetadata";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useWebAudioEqualizer } from "../hooks/useWebAudioEqualizer";
import songQueue from "../utils/songQueue";
import { isAudioFile, getCleanTitle } from "../utils/audioFormats";
import {
  loadMusixState,
  saveMusixState,
  isAbsolutePath,
} from "../utils/storage";
import {
  fetchOnlineCoverArt,
  getCachedCoverArt,
} from "../utils/onlineCoverArt";

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const savedState = useRef(loadMusixState()).current;

  const [audioFile, setAudioFile] = useState(
    savedState.currentTrack?.path || "",
  );
  const activeAudioPathRef = useRef(savedState.currentTrack?.path || "");
  const [queue, setQueue] = useState(savedState.queue || []);
  const [currentIndex, setCurrentIndex] = useState(
    typeof savedState.currentIndex === "number" ? savedState.currentIndex : -1,
  );
  const audioRef = useRef(null);

  const { metadata, extractMetadata, setMetadata } = useMetadata();

  const equalizer = useWebAudioEqualizer(audioRef);
  const [isSeeking, setIsSeeking] = useState(false);

  const handleResumeAudio = useCallback(() => {
    equalizer.initAudioGraph();
    equalizer.resumeAudioContext();
  }, [equalizer]);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    togglePlay,
    handleSeek,
    loadAudio,
    resetAudio,
    setIsPlaying,
    setCurrentTime,
    seekTrigger,
  } = useAudioPlayer(audioRef, handleResumeAudio);

  const pauseAndReset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    saveMusixState({ currentTime: 0 });
  }, [audioRef, setIsPlaying, setCurrentTime]);

  const loadFile = useCallback(
    async (path, autoPlay = true, resumeTime = 0) => {
      if (!isAudioFile(path) || !isAbsolutePath(path)) return;

      activeAudioPathRef.current = path;
      setAudioFile(path);
      const fileName = path.split(/[/\\]/).pop();

      let meta = await extractMetadata(path);

      const queueSong = songQueue.getAllSongs().find((s) => s.path === path);
      if (!meta?.cover_art && queueSong?.metadata?.cover_art) {
        meta = { ...(meta || {}), cover_art: queueSong.metadata.cover_art };
        setMetadata(meta);
      }

      if (!meta?.cover_art) {
        const cachedCover = await getCachedCoverArt(meta, fileName, path);
        if (cachedCover) {
          meta = { ...(meta || {}), cover_art: cachedCover };
          setMetadata(meta);
          songQueue.updateSongMetadata(path, { cover_art: cachedCover });
          setQueue(songQueue.getAllSongs());
        } else {
          fetchOnlineCoverArt(meta, fileName, path)
            .then((onlineCover) => {
              if (onlineCover) {
                songQueue.updateSongMetadata(path, { cover_art: onlineCover });
                setQueue(songQueue.getAllSongs());
                if (activeAudioPathRef.current === path) {
                  setMetadata((prev) => ({
                    ...(prev || meta || {}),
                    cover_art: onlineCover,
                  }));
                  saveMusixState({
                    currentTrack: {
                      path,
                      fileName,
                      metadata: { ...(meta || {}), cover_art: onlineCover },
                    },
                    queue: songQueue.getAllSongs(),
                  });
                }
              }
            })
            .catch(() => {});
        }
      }

      await loadAudio(path, resumeTime);
      setCurrentIndex(songQueue.getCurrentIndex());

      saveMusixState({
        currentTrack: {
          path,
          fileName,
          metadata: meta,
        },
        currentIndex: songQueue.getCurrentIndex(),
        currentTime: 0,
      });

      if (autoPlay && audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        }
      }

      return meta;
    },
    [extractMetadata, loadAudio, setIsPlaying, setMetadata],
  );

  const processSongs = useCallback(
    async (paths, playFirstImmediately = false) => {
      if (!paths || !Array.isArray(paths) || paths.length === 0) return;

      try {
        const validPaths = paths.filter(
          (p) => typeof p === "string" && isAudioFile(p) && isAbsolutePath(p),
        );

        if (validPaths.length === 0) return;

        const songsWithMetadata = await Promise.all(
          validPaths.map(async (path) => {
            const fileName = path.split(/[/\\]/).pop();
            let meta = null;
            try {
              meta = await extractMetadata(path);
            } catch (e) {
              meta = null;
            }

            if (!meta?.cover_art) {
              try {
                const cachedCover = await getCachedCoverArt(
                  meta,
                  fileName,
                  path,
                );
                if (cachedCover) {
                  meta = { ...(meta || {}), cover_art: cachedCover };
                }
              } catch (e) {}
            }

            return {
              path,
              metadata: meta,
              fileName,
            };
          }),
        );

        if (songsWithMetadata.length > 0) {
          const wasEmpty =
            songQueue.getAllSongs().length === 0 || !activeAudioPathRef.current;
          songQueue.appendSongs(songsWithMetadata);
          const newQueue = songQueue.getAllSongs();
          setQueue(newQueue);

          if (playFirstImmediately || wasEmpty) {
            const firstSong = songsWithMetadata[0];
            const songIdx = newQueue.findIndex(
              (s) => s.path === firstSong.path,
            );
            const targetIdx = songIdx !== -1 ? songIdx : 0;
            songQueue.setCurrentIndex(targetIdx);
            setCurrentIndex(targetIdx);

            saveMusixState({
              queue: newQueue,
              currentIndex: targetIdx,
            });

            await loadFile(firstSong.path, true, 0);
          } else {
            const currentIdx = songQueue.getCurrentIndex();
            setCurrentIndex(currentIdx);
            saveMusixState({
              queue: newQueue,
              currentIndex: currentIdx,
            });
          }
        }
      } catch (error) {}
    },
    [loadFile, extractMetadata],
  );

  useEffect(() => {
    const initFromStorage = async () => {
      try {
        const state = loadMusixState();

        try {
          const cliArgs = await invoke("get_cli_args");
          if (Array.isArray(cliArgs) && cliArgs.length > 0) {
            const fileArgs = cliArgs.filter(isAudioFile);
            if (fileArgs.length > 0) {
              await processSongs(fileArgs, true);
              return;
            }
          }
        } catch (e) {}

        if (
          state.windowPosition &&
          typeof state.windowPosition.x === "number" &&
          typeof state.windowPosition.y === "number"
        ) {
          try {
            await invoke("set_window_position", {
              x: state.windowPosition.x,
              y: state.windowPosition.y,
            });
          } catch (e) {}
        }

        if (state.queue && state.queue.length > 0) {
          const validIndex =
            typeof state.currentIndex === "number" &&
            state.currentIndex >= 0 &&
            state.currentIndex < state.queue.length
              ? state.currentIndex
              : 0;
          songQueue.initializeQueue(state.queue, validIndex);
          const initialQueue = songQueue.getAllSongs();
          setQueue(initialQueue);
          setCurrentIndex(songQueue.getCurrentIndex());

          const targetSong =
            songQueue.getCurrentSong() || state.currentTrack || state.queue[0];

          if (targetSong && targetSong.path) {
            activeAudioPathRef.current = targetSong.path;
            setAudioFile(targetSong.path);
            if (targetSong?.metadata) {
              setMetadata(targetSong.metadata);
            }

            await loadAudio(targetSong.path, 0);
            saveMusixState({ currentTime: 0 });

            const meta = await extractMetadata(targetSong.path);
            const fileName =
              targetSong.fileName || targetSong.path.split(/[/\\]/).pop();
            const currentMeta = meta || targetSong.metadata;
            if (!currentMeta?.cover_art) {
              const cached = await getCachedCoverArt(
                currentMeta,
                fileName,
                targetSong.path,
              );
              if (cached) {
                setMetadata((prev) => ({
                  ...(prev || currentMeta || {}),
                  cover_art: cached,
                }));
                songQueue.updateSongMetadata(targetSong.path, {
                  cover_art: cached,
                });
                setQueue(songQueue.getAllSongs());
              } else {
                fetchOnlineCoverArt(
                  currentMeta,
                  fileName,
                  targetSong.path,
                ).then((onlineCover) => {
                  if (
                    onlineCover &&
                    activeAudioPathRef.current === targetSong.path
                  ) {
                    setMetadata((prev) => ({
                      ...(prev || currentMeta || {}),
                      cover_art: onlineCover,
                    }));
                    songQueue.updateSongMetadata(targetSong.path, {
                      cover_art: onlineCover,
                    });
                    setQueue(songQueue.getAllSongs());
                  }
                });
              }
            }
          }
        } else if (state.currentTrack && state.currentTrack.path) {
          const targetSong = state.currentTrack;
          activeAudioPathRef.current = targetSong.path;
          setAudioFile(targetSong.path);
          if (targetSong?.metadata) {
            setMetadata(targetSong.metadata);
          }

          await loadAudio(targetSong.path, 0);
          saveMusixState({ currentTime: 0 });

          const meta = await extractMetadata(targetSong.path);
          const fileName =
            targetSong.fileName || targetSong.path.split(/[/\\]/).pop();
          const currentMeta = meta || targetSong.metadata;
          if (!currentMeta?.cover_art) {
            const cached = await getCachedCoverArt(
              currentMeta,
              fileName,
              targetSong.path,
            );
            if (cached) {
              setMetadata((prev) => ({
                ...(prev || currentMeta || {}),
                cover_art: cached,
              }));
            } else {
              fetchOnlineCoverArt(currentMeta, fileName, targetSong.path).then(
                (onlineCover) => {
                  if (
                    onlineCover &&
                    activeAudioPathRef.current === targetSong.path
                  ) {
                    setMetadata((prev) => ({
                      ...(prev || currentMeta || {}),
                      cover_art: onlineCover,
                    }));
                  }
                },
              );
            }
          }
        }
      } catch (err) {}
    };

    initFromStorage();
  }, [extractMetadata, loadAudio, processSongs, setMetadata]);

  useEffect(() => {
    const handleReconnect = () => {
      const currentPath = activeAudioPathRef.current;
      if (!currentPath) return;

      const currentSong = songQueue
        .getAllSongs()
        .find((s) => s.path === currentPath);
      const fileName =
        currentSong?.fileName || currentPath.split(/[/\\]/).pop();

      if (!metadata?.cover_art) {
        fetchOnlineCoverArt(metadata, fileName, currentPath).then(
          (onlineCover) => {
            if (onlineCover && activeAudioPathRef.current === currentPath) {
              setMetadata((prev) => ({
                ...(prev || {}),
                cover_art: onlineCover,
              }));
              songQueue.updateSongMetadata(currentPath, {
                cover_art: onlineCover,
              });
              setQueue(songQueue.getAllSongs());
              saveMusixState({
                currentTrack: {
                  path,
                  fileName,
                  metadata: { ...(metadata || {}), cover_art: onlineCover },
                },
              });
            }
          },
        );
      }
    };

    window.addEventListener("online", handleReconnect);
    return () => window.removeEventListener("online", handleReconnect);
  }, [metadata, setMetadata]);

  const handleNextSong = useCallback(() => {
    const nextSong = songQueue.nextSong();
    if (nextSong) {
      setCurrentIndex(songQueue.getCurrentIndex());
      loadFile(nextSong.path, true, 0);
      setQueue(songQueue.getAllSongs());
    }
  }, [loadFile]);

  const handlePreviousSong = useCallback(() => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    const prevSong = songQueue.previousSong();
    if (prevSong) {
      setCurrentIndex(songQueue.getCurrentIndex());
      loadFile(prevSong.path, true, 0);
      setQueue(songQueue.getAllSongs());
    }
  }, [currentTime, handleSeek, loadFile]);

  useEffect(() => {
    const handleSongEnd = () => {
      const nextSong = songQueue.nextSong();
      if (nextSong) {
        setCurrentIndex(songQueue.getCurrentIndex());
        loadFile(nextSong.path, true, 0);
        setQueue(songQueue.getAllSongs());
      } else {
        setIsPlaying(false);
      }
    };

    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("ended", handleSongEnd);
      return () => audio.removeEventListener("ended", handleSongEnd);
    }
  }, [loadFile, setIsPlaying]);

  const removeSong = useCallback(
    (index) => {
      const currentIdx = songQueue.getCurrentIndex();
      const isRemovingCurrent = index === currentIdx;

      songQueue.removeSong(index);
      const newQueue = songQueue.getAllSongs();
      const newCurrentIdx = songQueue.getCurrentIndex();

      setQueue(newQueue);
      setCurrentIndex(newCurrentIdx);

      saveMusixState({
        queue: newQueue,
        currentIndex: newCurrentIdx,
      });

      if (newQueue.length === 0) {
        resetAudio();
        setAudioFile("");
        setMetadata(null);
        saveMusixState({
          currentTrack: null,
          currentTime: 0,
          currentIndex: -1,
        });
      } else if (isRemovingCurrent) {
        const nextSong = songQueue.getCurrentSong();
        if (nextSong) {
          loadFile(nextSong.path, true, 0);
        }
      }
    },
    [loadFile, resetAudio, setMetadata],
  );

  const clearQueue = useCallback(() => {
    activeAudioPathRef.current = "";
    songQueue.clearQueue();
    setQueue([]);
    setCurrentIndex(-1);
    resetAudio();
    setAudioFile("");
    setMetadata(null);
    saveMusixState({
      queue: [],
      currentTrack: null,
      currentIndex: -1,
      currentTime: 0,
    });
  }, [resetAudio, setMetadata]);

  const shuffleQueue = useCallback(() => {
    const shuffled = songQueue.shuffleQueue();
    setQueue(shuffled);
    setCurrentIndex(songQueue.getCurrentIndex());
    saveMusixState({
      queue: songQueue.getAllSongs(),
      currentIndex: songQueue.getCurrentIndex(),
    });
  }, []);

  const handleTogglePlay = useCallback(() => {
    equalizer.initAudioGraph();
    equalizer.resumeAudioContext();
    if (
      audioRef.current &&
      (!audioRef.current.src ||
        audioRef.current.src === window.location.href ||
        audioRef.current.src.endsWith("/"))
    ) {
      const current = songQueue.getCurrentSong();
      if (current && current.path) {
        loadFile(current.path, true, 0);
        return;
      } else if (queue.length > 0) {
        loadFile(queue[0].path, true, 0);
        return;
      }
    }
    togglePlay();
  }, [togglePlay, loadFile, queue, equalizer]);

  const playSongAtIndex = useCallback(
    (index) => {
      const all = songQueue.getAllSongs();
      if (index >= 0 && index < all.length) {
        const target = all[index];
        if (
          index === currentIndex &&
          activeAudioPathRef.current === target.path
        ) {
          handleTogglePlay();
          return;
        }
        songQueue.setCurrentIndex(index);
        setCurrentIndex(index);
        setQueue(songQueue.getAllSongs());
        loadFile(target.path, true, 0);
      }
    },
    [loadFile, currentIndex, handleTogglePlay],
  );

  const reorderSongs = useCallback((fromIndex, toIndex) => {
    const newQueue = songQueue.reorderSongs(fromIndex, toIndex);
    const newCurrentIdx = songQueue.getCurrentIndex();
    setQueue(newQueue);
    setCurrentIndex(newCurrentIdx);
    saveMusixState({
      queue: newQueue,
      currentIndex: newCurrentIdx,
    });
  }, []);

  useEffect(() => {
    let unlistenPlayPause;
    let unlistenNext;
    let unlistenPrev;
    let unlistenSingleInstance;
    let unlistenClose;
    let unlistenQuit;

    try {
      listen("shortcut-play-pause", () => {
        handleTogglePlay();
      })
        .then((fn) => (unlistenPlayPause = fn))
        .catch(() => {});

      listen("shortcut-next", () => {
        handleNextSong();
      })
        .then((fn) => (unlistenNext = fn))
        .catch(() => {});

      listen("shortcut-prev", () => {
        handlePreviousSong();
      })
        .then((fn) => (unlistenPrev = fn))
        .catch(() => {});

      listen("single-instance-args", (event) => {
        const args = event?.payload;
        if (Array.isArray(args) && args.length > 0) {
          const fileArgs = args.filter(isAudioFile);
          if (fileArgs.length > 0) {
            processSongs(fileArgs, true);
          }
        }
      })
        .then((fn) => (unlistenSingleInstance = fn))
        .catch(() => {});

      listen("window-close-requested", () => {
        pauseAndReset();
      })
        .then((fn) => (unlistenClose = fn))
        .catch(() => {});

      listen("app-quit", () => {
        pauseAndReset();
      })
        .then((fn) => (unlistenQuit = fn))
        .catch(() => {});
    } catch (e) {}

    return () => {
      if (unlistenPlayPause) unlistenPlayPause();
      if (unlistenNext) unlistenNext();
      if (unlistenPrev) unlistenPrev();
      if (unlistenSingleInstance) unlistenSingleInstance();
      if (unlistenClose) unlistenClose();
      if (unlistenQuit) unlistenQuit();
    };
  }, [
    handleTogglePlay,
    handleNextSong,
    handlePreviousSong,
    processSongs,
    pauseAndReset,
  ]);

  useEffect(() => {
    let unlistenMove;
    let moveTimer = null;
    try {
      const win = getCurrentWindow();
      if (win && typeof win.onMoved === "function") {
        win
          .onMoved(({ payload: pos }) => {
            if (moveTimer) clearTimeout(moveTimer);
            moveTimer = setTimeout(async () => {
              try {
                const size = await win.outerSize();
                const scale = (await win.scaleFactor().catch(() => 1.0)) || 1.0;
                const logicalWidth = size ? size.width / scale : 0;
                if (logicalWidth > 200) {
                  saveMusixState({ windowPosition: { x: pos.x, y: pos.y } });
                }
              } catch (e) {}
            }, 800);
          })
          .then((fn) => (unlistenMove = fn))
          .catch(() => {});
      }
    } catch (e) {}

    return () => {
      if (moveTimer) clearTimeout(moveTimer);
      if (unlistenMove) unlistenMove();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handleTogglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(duration || 0, currentTime + 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;
        case "KeyN":
          e.preventDefault();
          handleNextSong();
          break;
        case "KeyP":
          e.preventDefault();
          handlePreviousSong();
          break;
        case "KeyM":
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 0.7);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleTogglePlay,
    handleSeek,
    currentTime,
    duration,
    volume,
    setVolume,
    handleNextSong,
    handlePreviousSong,
  ]);

  const value = {
    audioRef,
    audioFile,
    metadata,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    loadFile,
    processSongs,
    playSongAtIndex,
    togglePlay: handleTogglePlay,
    handleSeek,
    handlePrevious: handlePreviousSong,
    handleNext: handleNextSong,
    fileName: audioFile ? audioFile.split(/[/\\]/).pop() : null,
    displayTitle: getCleanTitle(audioFile, metadata?.title),
    queue,
    currentIndex,
    equalizer,
    clearQueue,
    shuffleQueue,
    removeSong,
    reorderSongs,
    isSeeking,
    setIsSeeking,
    seekTrigger,
    pauseAndReset,
  };

  return (
    <AudioContext.Provider value={value}>
      <audio ref={audioRef} />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
