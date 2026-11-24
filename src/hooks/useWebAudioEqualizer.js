import { useState, useRef, useEffect, useCallback } from "react";
import { loadMusixState, saveMusixState } from "../utils/storage";

export function useWebAudioEqualizer() {
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

  const initAudioGraph = useCallback(() => {}, []);
  const resumeAudioContext = useCallback(() => {}, []);

  const setLevel = useCallback((band, value) => {
    setLevels((prev) => {
      const next = {
        bass: prev.bass ?? 50,
        mids: prev.mids ?? 50,
        treble: prev.treble ?? 50,
        air: prev.air ?? 50,
        [band]: value,
      };
      saveMusixState({ equalizer: next });
      return next;
    });
  }, []);

  const resetLevels = useCallback(() => {
    const flat = { bass: 50, mids: 50, treble: 50, air: 50 };
    setLevels(flat);
    saveMusixState({ equalizer: flat });
  }, []);

  return {
    levels,
    setLevel,
    resetLevels,
    initAudioGraph,
    resumeAudioContext,
  };
}
