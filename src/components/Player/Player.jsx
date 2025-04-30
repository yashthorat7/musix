import React, { useEffect, useCallback } from 'react';
import styles from './Player.module.css';
import Title from './Title';
import Hand from './Hand';
import Controller from './Controller';
import Disc from './Disc';
import Minimizer from '../Sidebar/Minimizer';
import { useAudio } from '../../context/AudioContext';
import { useFileDrop } from '../../hooks/useFileDrop';

function Player({ filePath: initialFilePath }) {
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

    useEffect(() => {
        if (initialFilePath) {
            loadFile(initialFilePath);
        }
    }, [initialFilePath, loadFile]);

    const handleClose = () => {
        window.close();
    };

    return (
        <div className={styles.container}>
            <Minimizer />
            <Title text={metadata?.title || fileName} />
            <Disc coverArt={metadata?.cover_art} />
            <Hand onClose={handleClose} />
            <Controller />
        </div>
    );
}

export default Player;
