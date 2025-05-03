import React from 'react';
import styles from './Directory.module.css';

function Directory({ isOpen, songs = [], onRemove, onClear, onShuffle }) {
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
                                −
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
                    <button className={styles.capsuleButton} onClick={onClear} title="Clear queue">
                        <img src="/icons/add.svg" alt="Clear" />
                    </button>
                </div>
            </div>
            
        </div>
    );
}

export default Directory;
