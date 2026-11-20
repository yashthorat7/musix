import { useCallback } from "react";
import { useAudio } from "../context/AudioContext";
import { useFileDrop } from "./useFileDrop";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function usePlayer() {
  const { metadata, fileName, displayTitle, processSongs } = useAudio();

  const handleFileDrop = useCallback(
    (paths) => {
      processSongs(paths);
    },
    [processSongs],
  );

  useFileDrop(handleFileDrop);

  const handleClose = async () => {
    try {
      const win = getCurrentWindow();

      await win.hide();
    } catch (e) {
      await getCurrentWindow().close();
    }
  };

  return { metadata, fileName, displayTitle, handleClose };
}
