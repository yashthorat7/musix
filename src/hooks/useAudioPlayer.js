import { useState, useCallback, useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { loadMusixState, saveMusixState } from "../utils/storage";

export function useAudioPlayer(audioRef, onResumeAudio) {
  const savedState = loadMusixState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTrigger, setSeekTrigger] = useState(null);
  const lastSeekTimeRef = useRef(0);

  const initialVolume =
    typeof savedState.volume === "number" && Number.isFinite(savedState.volume)
      ? Math.max(0, Math.min(1, savedState.volume))
      : 0.7;

  const [volume, setVolumeState] = useState(initialVolume);
  const volumeRef = useRef(initialVolume);

  const isPlayRequestedRef = useRef(false);
  const playPromiseRef = useRef(null);

  const setVolume = useCallback(
    (val) => {
      const num = Number(val);
      const clamped = Number.isFinite(num)
        ? Math.max(0, Math.min(1, num))
        : 0.7;
      setVolumeState(clamped);
      volumeRef.current = clamped;
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
      saveMusixState({ volume: clamped });
    },
    [audioRef],
  );

  const loadAudio = useCallback(
    async (path, initialTime = 0) => {
      try {
        const fileUrl = convertFileSrc(path);
        if (audioRef.current) {
          audioRef.current.crossOrigin = "anonymous";
          audioRef.current.src = fileUrl;
          audioRef.current.volume = volumeRef.current;
          audioRef.current.load();
          audioRef.current.onloadedmetadata = () => {
            const rawDur = audioRef.current?.duration;
            const dur = Number.isFinite(rawDur) ? rawDur : 0;
            setDuration(dur);
            if (initialTime > 0 && initialTime < dur) {
              audioRef.current.currentTime = initialTime;
              setCurrentTime(initialTime);
              lastSeekTimeRef.current = initialTime;
            } else {
              lastSeekTimeRef.current = 0;
            }
          };
          audioRef.current.onerror = () => {
            setIsPlaying(false);
            isPlayRequestedRef.current = false;
          };
        }
      } catch (error) {
        setIsPlaying(false);
        isPlayRequestedRef.current = false;
      }
    },
    [audioRef],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (onResumeAudio) {
      onResumeAudio();
    }

    if (
      !audio.src ||
      audio.src === window.location.href ||
      audio.src.endsWith("/")
    ) {
      return;
    }

    const isCurrentlyPlaying = !audio.paused && !audio.ended;

    if (isCurrentlyPlaying || isPlayRequestedRef.current) {
      isPlayRequestedRef.current = false;
      setIsPlaying(false);

      if (playPromiseRef.current) {
        playPromiseRef.current
          .then(() => {
            if (!isPlayRequestedRef.current && audioRef.current) {
              audioRef.current.pause();
            }
          })
          .catch(() => {});
      } else {
        audio.pause();
      }
    } else {
      isPlayRequestedRef.current = true;
      setIsPlaying(true);

      if (audio.ended) {
        audio.currentTime = 0;
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise;
        playPromise
          .then(() => {
            playPromiseRef.current = null;
            if (!isPlayRequestedRef.current && audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            } else {
              setIsPlaying(true);
            }
          })
          .catch((err) => {
            playPromiseRef.current = null;
            if (err.name === "AbortError") {
              return;
            }
            setIsPlaying(false);
            isPlayRequestedRef.current = false;
          });
      } else {
        setIsPlaying(true);
      }
    }
  }, [audioRef, onResumeAudio]);

  const handleSeek = useCallback(
    (time) => {
      if (
        audioRef.current &&
        Number.isFinite(time) &&
        Number.isFinite(duration)
      ) {
        const safeTime = Math.max(0, Math.min(time, duration || 0));
        const prev = lastSeekTimeRef.current;
        lastSeekTimeRef.current = safeTime;
        audioRef.current.currentTime = safeTime;
        setCurrentTime(safeTime);
        setSeekTrigger({
          time: safeTime,
          prevTime: prev,
          delta: safeTime - prev,
          timestamp: performance.now(),
        });
      }
    },
    [audioRef, duration],
  );

  const handlePrevious = useCallback(() => {
    handleSeek(0);
  }, [handleSeek]);

  const handleNext = useCallback(() => {
    if (Number.isFinite(duration) && duration > 0) {
      const targetTime = Math.max(0, duration - 3);
      handleSeek(targetTime);
    }
  }, [duration, handleSeek]);

  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      lastSeekTimeRef.current = 0;
    }
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const updateTime = () => {
      const now = audio.currentTime;
      if (Number.isFinite(now)) {
        setCurrentTime(now);
        lastSeekTimeRef.current = now;
      }
    };

    const handleEnded = () => {
      isPlayRequestedRef.current = false;
      setIsPlaying(false);
      setCurrentTime(0);
      lastSeekTimeRef.current = 0;
      saveMusixState({ currentTime: 0 });
    };

    const handlePlay = () => {
      isPlayRequestedRef.current = true;
      setIsPlaying(true);
    };

    const handlePlaying = () => {
      isPlayRequestedRef.current = true;
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (audio.paused) {
        isPlayRequestedRef.current = false;
        setIsPlaying(false);
      }
    };

    const handleError = () => {
      isPlayRequestedRef.current = false;
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [audioRef, volume]);

  return {
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
    seekTrigger,
  };
}
