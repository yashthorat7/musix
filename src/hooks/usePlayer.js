import { useCallback, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { useFileDrop } from './useFileDrop';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function usePlayer() {
    const { metadata, loadFile, fileName, processSongs } = useAudio();

    const handleFileDrop = useCallback(paths => {
        processSongs(paths);
    }, [processSongs]);

    useFileDrop(handleFileDrop);

    const handleClose = async () => {
        await getCurrentWindow().close();
    };

    return { metadata, fileName, handleClose };
}
