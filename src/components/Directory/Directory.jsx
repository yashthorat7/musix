import React, { useRef } from 'react';
import styles from './Directory.module.css';

function Directory({ isOpen, songs = [], onRemove, onClear, onShuffle }) {
    const fileInputRef = useRef(null);

    const handleAddClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || [])
            .filter((file) => file.name.toLowerCase().endsWith('.mp3'))
            .map((file) => file.path);

        if (files.length > 0) {
            await processSongs(files);
        }
        e.target.value = '';
    };

    return (
        <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
            <div className={styles.songList}>
                {songs.length === 0 ? (
                    <div className={styles.emptyMessage}>No songs in queue</div>
                ) : (
                    songs.map((song, index) => (
                        <div key={`${song.path}-${index}`} className={styles.songItem}>
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
