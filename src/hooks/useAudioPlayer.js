import { useState, useCallback, useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { loadMusixState, saveMusixState } from "../utils/storage";

export function useAudioPlayer(audioRef, onResumeAudio) {
  const savedState = loadMusixState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(
    typeof savedState.volume === "number" ? savedState.volume : 0.7,
  );
  const clickTimeoutRef = useRef(null);

  const setVolume = useCallback(
    (val) => {
      const clamped = Math.max(0, Math.min(1, Number(val) || 0));
      setVolumeState(clamped);
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
          audioRef.current.volume = volume;
          audioRef.current.load();
          audioRef.current.onloadedmetadata = () => {
            const dur = audioRef.current.duration || 0;
            setDuration(dur);
            if (initialTime > 0 && initialTime < dur) {
              audioRef.current.currentTime = initialTime;
              setCurrentTime(initialTime);
            }
          };
          audioRef.current.onerror = (e) => {
            console.error("Audio error:", e, audioRef.current.error);
          };
        }
      } catch (error) {
        console.error("Error loading audio:", error);
      }
    },
    [audioRef, volume],
  );

  const isPlayRequestedRef = useRef(false);
  const playPromiseRef = useRef(null);

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
            console.warn("Playback error:", err);
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
      if (audioRef.current) {
        const safeTime = Math.max(0, Math.min(time, duration || 0));
        audioRef.current.currentTime = safeTime;
        setCurrentTime(safeTime);
      }
    },
    [audioRef, duration],
  );

  const handlePrevious = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [audioRef]);

  const handleNext = useCallback(() => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = Math.max(0, duration - 3);
      setCurrentTime(Math.max(0, duration - 3));
    }
  }, [audioRef, duration]);

  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const updateTime = () => {
      const now = audio.currentTime;
      setCurrentTime(now);
    };

    const handleEnded = () => {
      isPlayRequestedRef.current = false;
      setIsPlaying(false);
      setCurrentTime(0);
      saveMusixState({ currentTime: 0 });
    };

    const handlePlay = () => {
      isPlayRequestedRef.current = true;
      setIsPlaying(true);
    };

    const handlePause = () => {
      isPlayRequestedRef.current = false;
      setIsPlaying(false);
    };

    const handleError = () => {
      isPlayRequestedRef.current = false;
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
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
  };
}
