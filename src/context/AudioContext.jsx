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
import { loadMusixState, saveMusixState } from "../utils/storage";
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
  const [seekingDirection, setSeekingDirection] = useState(0);
  const [queue, setQueue] = useState([]);
  const audioRef = useRef(null);

  const { metadata, extractMetadata, setMetadata } = useMetadata();

  const equalizer = useWebAudioEqualizer(audioRef);

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
    handlePrevious,
    handleNext,
    loadAudio,
    resetAudio,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useAudioPlayer(audioRef, handleResumeAudio);

  const loadFile = useCallback(
    async (path, autoPlay = true, resumeTime = 0) => {
      if (!isAudioFile(path)) return;

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
        const cachedCover = getCachedCoverArt(meta, fileName, path);
        if (cachedCover) {
          meta = { ...(meta || {}), cover_art: cachedCover };
          setMetadata(meta);
          songQueue.updateSongMetadata(path, { cover_art: cachedCover });
          setQueue(songQueue.getQueue());
        } else {
          fetchOnlineCoverArt(meta, fileName, path).then((onlineCover) => {
            if (onlineCover) {
              songQueue.updateSongMetadata(path, { cover_art: onlineCover });
              setQueue(songQueue.getQueue());
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
                });
              }
              saveMusixState({
                queue: songQueue.getAllSongs(),
              });
            }
          });
        }
      }

      await loadAudio(path, resumeTime);

      saveMusixState({
        currentTrack: {
          path,
          fileName,
          metadata: meta,
        },
        currentIndex: songQueue.getCurrentIndex(),
        currentTime: resumeTime,
      });

      if (autoPlay) {
        setTimeout(() => {
          handleResumeAudio();
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }, 250);
      }

      return meta;
    },
    [extractMetadata, loadAudio, setIsPlaying, handleResumeAudio, setMetadata],
  );

  const processSongs = useCallback(
    async (paths, playFirstImmediately = true) => {
      if (!paths || !Array.isArray(paths) || paths.length === 0) return;

      const songsWithMetadata = [];

      try {
        for (const path of paths) {
          if (typeof path === "string" && isAudioFile(path)) {
            try {
              let meta = null;
              try {
                meta = await invoke("extract_metadata", { filepath: path });
              } catch (e) {
                meta = null;
              }
              const fileName = path.split(/[/\\]/).pop();
              if (!meta?.cover_art) {
                const cachedCover = getCachedCoverArt(meta, fileName, path);
                if (cachedCover) {
                  meta = { ...(meta || {}), cover_art: cachedCover };
                }
              }
              songsWithMetadata.push({
                path,
                metadata: meta,
                fileName,
              });
            } catch (err) {
              console.warn("Metadata extraction error for", path, err);
            }
          }
        }

        if (songsWithMetadata.length > 0) {
          const wasQueueEmpty = songQueue.getQueue().length === 0;
          songQueue.appendSongs(songsWithMetadata);
          const newQueue = songQueue.getQueue();
          setQueue(newQueue);

          saveMusixState({
            queue: songQueue.getAllSongs(),
            currentIndex: songQueue.getCurrentIndex(),
          });

          songsWithMetadata.forEach((song) => {
            if (!song.metadata?.cover_art) {
              fetchOnlineCoverArt(song.metadata, song.fileName, song.path).then(
                (onlineCover) => {
                  if (onlineCover) {
                    songQueue.updateSongMetadata(song.path, {
                      cover_art: onlineCover,
                    });
                    setQueue(songQueue.getQueue());
                    if (activeAudioPathRef.current === song.path) {
                      setMetadata((prev) => ({
                        ...(prev || song.metadata || {}),
                        cover_art: onlineCover,
                      }));
                      saveMusixState({
                        currentTrack: {
                          path: song.path,
                          fileName: song.fileName,
                          metadata: {
                            ...(song.metadata || {}),
                            cover_art: onlineCover,
                          },
                        },
                      });
                    }
                    saveMusixState({
                      queue: songQueue.getAllSongs(),
                    });
                  }
                },
              );
            }
          });

          if (
            playFirstImmediately &&
            (wasQueueEmpty || (!isPlaying && audioFile === ""))
          ) {
            const currentSong = songQueue.getCurrentSong();
            if (currentSong) {
              await loadFile(currentSong.path, true);
            }
          }
        }
      } catch (error) {
        console.error("Error processing audio songs:", error);
      }
    },
    [loadFile, isPlaying, audioFile, setMetadata],
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
          songQueue.initializeQueue(state.queue, state.currentIndex || 0);
          const initialQueue = songQueue.getQueue();
          setQueue(initialQueue);

          const targetSong =
            songQueue.getCurrentSong() || state.currentTrack || state.queue[0];

          if (targetSong && targetSong.path) {
            activeAudioPathRef.current = targetSong.path;
            setAudioFile(targetSong.path);
            if (targetSong?.metadata) {
              setMetadata(targetSong.metadata);
            }

            await loadAudio(targetSong.path, state.currentTime || 0);

            const meta = await extractMetadata(targetSong.path);
            const fileName =
              targetSong.fileName || targetSong.path.split(/[/\\]/).pop();
            const currentMeta = meta || targetSong.metadata;
            if (!currentMeta?.cover_art) {
              const cached = getCachedCoverArt(
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
                setQueue(songQueue.getQueue());
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
                    setQueue(songQueue.getQueue());
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

          await loadAudio(targetSong.path, state.currentTime || 0);

          const meta = await extractMetadata(targetSong.path);
          const fileName =
            targetSong.fileName || targetSong.path.split(/[/\\]/).pop();
          const currentMeta = meta || targetSong.metadata;
          if (!currentMeta?.cover_art) {
            const cached = getCachedCoverArt(
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
      } catch (err) {
        console.warn("Error initializing audio from persistent state:", err);
      }
    };

    initFromStorage();
  }, []);

  useEffect(() => {
    const handleSongEnd = () => {
      const nextSong = songQueue.nextSong();
      if (nextSong) {
        loadFile(nextSong.path, true);
        setQueue(songQueue.getQueue());
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

  const handleNextSong = useCallback(() => {
    const nextSong = songQueue.nextSong();
    if (nextSong) {
      loadFile(nextSong.path, true);
      setQueue(songQueue.getQueue());
    }
  }, [loadFile]);

  const handlePreviousSong = useCallback(() => {
    const prevSong = songQueue.previousSong();
    if (prevSong) {
      loadFile(prevSong.path, true);
      setQueue(songQueue.getQueue());
    }
  }, [loadFile]);

  const playSongAtIndex = useCallback(
    (index) => {
      const visible = songQueue.getVisibleSongs();
      if (index >= 0 && index < visible.length) {
        const target = visible[index];
        const all = songQueue.getAllSongs();
        const allIdx = all.findIndex((s) => s.path === target.path);
        if (allIdx >= 0) {
          songQueue.setCurrentIndex(allIdx);
          setQueue(songQueue.getQueue());
          loadFile(target.path, true);
        }
      }
    },
    [loadFile],
  );

  useEffect(() => {
    let unlistenPlayPause;
    let unlistenNext;
    let unlistenPrev;

    try {
      listen("shortcut-play-pause", () => {
        togglePlay();
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
    } catch (e) {}

    return () => {
      if (unlistenPlayPause) unlistenPlayPause();
      if (unlistenNext) unlistenNext();
      if (unlistenPrev) unlistenPrev();
    };
  }, [togglePlay, handleNextSong, handlePreviousSong]);

  useEffect(() => {
    let unlistenMove;
    let moveTimer = null;
    try {
      const win = getCurrentWindow();
      if (win && typeof win.onMoved === "function") {
        win
          .onMoved(({ payload: pos }) => {
            if (moveTimer) clearTimeout(moveTimer);
            moveTimer = setTimeout(() => {
              saveMusixState({ windowPosition: { x: pos.x, y: pos.y } });
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
          togglePlay();
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
    togglePlay,
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
    togglePlay,
    handleSeek,
    handlePrevious: handlePreviousSong,
    handleNext: handleNextSong,
    fileName: audioFile ? audioFile.split(/[/\\]/).pop() : null,
    displayTitle: getCleanTitle(audioFile, metadata?.title),
    seekingDirection,
    queue: songQueue.getQueue(),
    equalizer,
    clearQueue: () => {
      activeAudioPathRef.current = "";
      songQueue.clearQueue();
      setQueue([]);
      resetAudio();
      setAudioFile("");
      setMetadata(null);
      saveMusixState({
        queue: [],
        currentTrack: null,
        currentIndex: -1,
        currentTime: 0,
      });
    },
    shuffleQueue: () => {
      songQueue.shuffleQueue();
      const newQ = songQueue.getQueue();
      setQueue(newQ);
      saveMusixState({ queue: songQueue.getAllSongs() });
    },
    removeSong: (index) => {
      const isRemovingCurrent = index === 0;
      songQueue.removeSong(index);
      const newQueue = songQueue.getQueue();
      setQueue(newQueue);

      saveMusixState({
        queue: songQueue.getAllSongs(),
        currentIndex: songQueue.getCurrentIndex(),
      });

      if (newQueue.length === 0) {
        resetAudio();
        setAudioFile("");
        setMetadata(null);
        saveMusixState({ currentTrack: null, currentTime: 0 });
      } else if (isRemovingCurrent) {
        const nextSong = songQueue.getCurrentSong();
        if (nextSong) {
          loadFile(nextSong.path, true);
        }
      }
    },
  };

  return (
    <AudioContext.Provider value={value}>
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error("useAudio must be used within an AudioProvider");
  return context;
}
