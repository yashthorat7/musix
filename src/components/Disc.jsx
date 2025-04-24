import React, { useState, useCallback, useEffect } from 'react';
import styles from './Disc.module.css';
import Title from './Title';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import Hand from './Hand';
import Player from './Player';

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

export default function Disc({ filePath: initialFilePath }) {
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
            <div className={styles.discWrapper}>
                <div className={styles.disc}>
                    <img
                        src="/image1.png"
                        className={styles.discImage}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        alt=""
                    />
                </div>
                <div className={styles.discInner}></div>
                <div className={styles.discCenter}></div>
            </div>
            <Hand onClose={handleClose} />
            <Player />
        </div>
    );
} 