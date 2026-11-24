import { useCallback, useEffect } from "react";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isAudioFile } from "../utils/audioFormats";

export function useFileDrop(onFileDrop) {
  const handleDrop = useCallback(
    (event) => {
      if (
        event?.payload?.type === "drop" &&
        Array.isArray(event.payload.paths) &&
        event.payload.paths.length > 0
      ) {
        const audioFiles = event.payload.paths.filter(isAudioFile);
        if (audioFiles.length > 0) {
          onFileDrop(audioFiles);
        }
      }
    },
    [onFileDrop],
  );

  useEffect(() => {
    try {
      const window = WebviewWindow.getCurrent();
      if (!window || typeof window.onDragDropEvent !== "function") return;
      const unlisten = window.onDragDropEvent(handleDrop);
      return () => {
        if (unlisten && typeof unlisten.then === "function") {
          unlisten.then((fn) => fn && fn());
        }
      };
    } catch (e) {
      return undefined;
    }
  }, [handleDrop]);
}
