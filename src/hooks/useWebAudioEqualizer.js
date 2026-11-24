import { useState, useRef, useEffect, useCallback } from "react";
import { loadMusixState, saveMusixState } from "../utils/storage";

function levelToGainDb(value) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 50));
  return ((clamped - 50) / 50) * 12;
}

export function useWebAudioEqualizer(audioRef) {
  const savedState = loadMusixState();
  const [levels, setLevels] = useState(() => {
    const eq = savedState.equalizer || {};
    return {
      bass: typeof eq.bass === "number" ? eq.bass : 50,
      mids: typeof eq.mids === "number" ? eq.mids : 50,
      treble: typeof eq.treble === "number" ? eq.treble : 50,
      air: typeof eq.air === "number" ? eq.air : 50,
    };
  });

  const levelsRef = useRef(levels);
  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filtersRef = useRef({
    bass: null,
    mids: null,
    treble: null,
    air: null,
  });
  const isConnectedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const initAudioGraph = useCallback(() => {
    if (isConnectedRef.current || !audioRef?.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;

      if (!sourceNodeRef.current && audioRef.current) {
        if (!audioRef.current.crossOrigin) {
          audioRef.current.crossOrigin = "anonymous";
        }
        sourceNodeRef.current = ctx.createMediaElementSource(audioRef.current);
      }

      const source = sourceNodeRef.current;
      if (!source) return;

      const currentLevels = levelsRef.current;

      const bassNode = ctx.createBiquadFilter();
      bassNode.type = "lowshelf";
      bassNode.frequency.value = 100;
      bassNode.gain.value = levelToGainDb(currentLevels.bass);

      const midsNode = ctx.createBiquadFilter();
      midsNode.type = "peaking";
      midsNode.frequency.value = 1000;
      midsNode.Q.value = 1.0;
      midsNode.gain.value = levelToGainDb(currentLevels.mids);

      const trebleNode = ctx.createBiquadFilter();
      trebleNode.type = "peaking";
      trebleNode.frequency.value = 3500;
      trebleNode.Q.value = 1.0;
      trebleNode.gain.value = levelToGainDb(currentLevels.treble);

      const airNode = ctx.createBiquadFilter();
      airNode.type = "highshelf";
      airNode.frequency.value = 10000;
      airNode.gain.value = levelToGainDb(currentLevels.air);

      try {
        source.disconnect();
      } catch (e) {}

      source.connect(bassNode);
      bassNode.connect(midsNode);
      midsNode.connect(trebleNode);
      trebleNode.connect(airNode);
      airNode.connect(ctx.destination);

      filtersRef.current = {
        bass: bassNode,
        mids: midsNode,
        treble: trebleNode,
        air: airNode,
      };

      isConnectedRef.current = true;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch (err) {}
  }, [audioRef]);

  const resumeAudioContext = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const updateFilterGain = useCallback((band, val) => {
    const node = filtersRef.current[band];
    if (node && audioCtxRef.current) {
      const gain = levelToGainDb(val);
      node.gain.setTargetAtTime(gain, audioCtxRef.current.currentTime, 0.03);
    }
  }, []);

  const setLevel = useCallback(
    (band, value) => {
      initAudioGraph();
      resumeAudioContext();
      setLevels((prev) => {
        const next = {
          bass: prev.bass ?? 50,
          mids: prev.mids ?? 50,
          treble: prev.treble ?? 50,
          air: prev.air ?? 50,
          [band]: value,
        };
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveMusixState({ equalizer: next });
        }, 300);
        return next;
      });
      updateFilterGain(band, value);
    },
    [initAudioGraph, resumeAudioContext, updateFilterGain],
  );

  const resetLevels = useCallback(() => {
    initAudioGraph();
    resumeAudioContext();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const flat = { bass: 50, mids: 50, treble: 50, air: 50 };
    setLevels(flat);
    saveMusixState({ equalizer: flat });
    ["bass", "mids", "treble", "air"].forEach((band) => {
      updateFilterGain(band, 50);
    });
  }, [initAudioGraph, resumeAudioContext, updateFilterGain]);

  useEffect(() => {
    const el = audioRef?.current;
    if (!el) return;

    const handlePlay = () => {
      initAudioGraph();
      resumeAudioContext();
    };

    el.addEventListener("play", handlePlay);
    return () => {
      el.removeEventListener("play", handlePlay);
    };
  }, [audioRef, initAudioGraph, resumeAudioContext]);

  return {
    levels,
    setLevel,
    resetLevels,
    initAudioGraph,
    resumeAudioContext,
  };
}
