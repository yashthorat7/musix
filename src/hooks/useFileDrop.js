import { useCallback, useEffect } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export function useFileDrop(onFileDrop) {
    const handleDrop = useCallback(
        (event) => {
            if (event.payload.type === 'drop' && event.payload.paths.length > 0) {
                onFileDrop(event.payload.paths[0]);
            }
        },
        [onFileDrop],
    );

    useEffect(() => {
        const window = WebviewWindow.getCurrent();
        const unlisten = window.onDragDropEvent(handleDrop);

        return () => {
            unlisten.then((f) => f());
        };
    }, [handleDrop]);
}
