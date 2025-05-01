import { useCallback, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { useFileDrop } from './useFileDrop';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function usePlayer() {
    const { metadata, loadFile, fileName } = useAudio();

    const handleFileDrop = useCallback(
        (path) => {
            if (path.toLowerCase().endsWith('.mp3')) {
                loadFile(path);
            }
        },
        [loadFile],
    );

    useFileDrop(handleFileDrop);

    const handleClose = async () => {
        await getCurrentWindow().close();
    };

    return {
        metadata,
        fileName,
        handleClose,
    };
}
