import { useCallback, useEffect } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export function useFileDrop(onFileDrop) {
  const handleDrop = useCallback((event) => {
    if (event.payload.type === 'drop' && event.payload.paths.length > 0) {

      const inOsOrder = event.payload.paths.slice();
      const audioFiles = inOsOrder.filter(p => p.toLowerCase().endsWith('.mp3'));

      if (audioFiles.length > 0) {
        onFileDrop(audioFiles);
      }
    }
  }, [onFileDrop]);

  useEffect(() => {
    const window = WebviewWindow.getCurrent();
    const unlisten = window.onDragDropEvent(handleDrop);
    return () => unlisten.then(fn => fn());
  }, [handleDrop]);
}
