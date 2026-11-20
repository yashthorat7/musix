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
  const lastSaveTimeRef = useRef(0);

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
        }
      } catch (error) {
        console.error("Error loading audio:", error);
      }
    },
    [audioRef, volume],
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (onResumeAudio) {
      onResumeAudio();
    }

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      saveMusixState({ currentTime: audioRef.current.currentTime });
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Playback prevented or interrupted:", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    }
  }, [isPlaying, audioRef, onResumeAudio]);

  const handleSeek = useCallback(
    (time) => {
      if (audioRef.current) {
        const safeTime = Math.max(0, Math.min(time, duration || 0));
        audioRef.current.currentTime = safeTime;
        setCurrentTime(safeTime);
        saveMusixState({ currentTime: safeTime });
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

      const nowMs = Date.now();
      if (nowMs - lastSaveTimeRef.current > 2000) {
        lastSaveTimeRef.current = nowMs;
        saveMusixState({ currentTime: now });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      saveMusixState({ currentTime: 0 });
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
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
