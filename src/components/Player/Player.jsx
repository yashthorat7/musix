import React, { useState, useCallback, useEffect } from 'react';
import styles from './Player.module.css';
import Title from './Title';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import Hand from './Hand';
import Controller from './Controller';
import Disc from './Disc';

function useFileDrop(onFileDrop) {
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

function Player({ filePath: initialFilePath }) {
    const [droppedFile, setDroppedFile] = useState(initialFilePath || '');
    const [isDragging, setIsDragging] = useState(false);
    const filePath = droppedFile || initialFilePath;
    const fileName = filePath ? filePath.split(/[/\\]/).pop() : null;

    useFileDrop((path) => {
        if (path.toLowerCase().endsWith('.mp3')) {
            setDroppedFile(path);
            setIsDragging(false);
        }
    });

    useEffect(() => {
        const handleDragOver = () => setIsDragging(true);
        const handleDragLeave = () => setIsDragging(false);
        const handleDrop = () => setIsDragging(false);

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    const handleClose = () => {
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <Title text={fileName} />
            <Disc />
            <Hand onClose={handleClose} />
            <Controller />
        </div>
    );
}

export default Player;
