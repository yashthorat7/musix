import React, { useRef, useState } from 'react';
import styles from './Directory.module.css';
import { useAudio } from '../../context/AudioContext';

function Directory({ isOpen, songs = [], onRemove, onClear, onShuffle }) {
    const fileInputRef = useRef(null);
    const { processSongs } = useAudio();
    const [dragActive, setDragActive] = useState(false);

    const handleAddClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e) => {
        try {
            console.log('Raw files:', e.target.files);
            const files = Array.from(e.target.files || [])
                .filter(file => {
                    console.log('Checking file:', {
                        name: file.name,
                        path: file.path,
                        webkitRelativePath: file.webkitRelativePath
                    });
                    return file.name.toLowerCase().endsWith('.mp3');
                })
                .map(file => {
                    const filePath = file.path || file.webkitRelativePath || file.name;
                    console.log('Mapped file path:', filePath);
                    return filePath;
                });

            console.log('Final filtered MP3 files:', files);

            if (files.length > 0) {
                console.log('Sending files to processSongs:', files);
                await processSongs(files);
            } else {
                console.log('No valid MP3 files found');
            }
        } catch (error) {
            console.error('Error selecting files:', error);
        } finally {
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        try {
            const files = Array.from(e.dataTransfer?.files || [])
                .filter(file => {
                    const name = file.name;
                    return typeof name === 'string' && name.toLowerCase().endsWith('.mp3');
                })
                .map(file => file.path);

            if (files.length > 0) {
                await processSongs(files);
            }
        } catch (error) {
            console.error('Error handling dropped files:', error);
        }
    };

    return (
        <div
            className={`${styles.container} ${isOpen ? styles.open : ''} ${dragActive ? styles.dragActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={styles.songList}>
                {songs.length === 0 ? (
                    <div className={styles.emptyMessage}>
                        No songs in queue<br />Drag & drop .mp3 files or use the add button below
                    </div>
                ) : (
                    songs.map((song, index) => (
                        <div
                            key={`${song.path}-${index}`}
                            className={`${styles.songItem} ${index === 0 ? styles.currentSong : ''}`}
                        >
                            <div className={styles.songTitle} title={song.fileName || song.path}>
                                {song.fileName || song.path.split('/').pop()}
                            </div>
                            <button
                                className={styles.removeButton}
                                onClick={() => onRemove(index)}
                                title="Remove from queue"
                            >
                                <img src="/icons/minus.svg" alt="" />
                            </button>
                        </div>
                    ))
                )}
            </div>
            <div className={styles.controls}>
                <div className={styles.capsule}>
                    <button
                        className={styles.capsuleButton}
                        onClick={onShuffle}
                        title="Shuffle queue"
                    >
                        <img src="/icons/random.svg" alt="" />
                    </button>
                    <button
                        className={styles.capsuleButton}
                        onClick={handleAddClick}
                        title="Add songs"
                    >
                        <img src="/icons/add.svg" alt="Add" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Directory;
