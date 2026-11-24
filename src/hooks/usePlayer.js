import { useCallback } from "react";
import { useAudio } from "../context/AudioContext";
import { useFileDrop } from "./useFileDrop";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function usePlayer() {
  const { metadata, fileName, displayTitle, processSongs, pauseAndReset } =
    useAudio();

  const handleFileDrop = useCallback(
    (paths) => {
      processSongs(paths);
    },
    [processSongs],
  );

  useFileDrop(handleFileDrop);

  const handleClose = async () => {
    if (pauseAndReset) {
      pauseAndReset();
    }
    try {
      const win = getCurrentWindow();
      await win.hide();
    } catch (e) {
      try {
        await getCurrentWindow().close();
      } catch (err) {}
    }
  };

  return { metadata, fileName, displayTitle, handleClose };
}
