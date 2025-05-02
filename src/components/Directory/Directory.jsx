import React from 'react';
import styles from './Directory.module.css';

function Directory({ isOpen, onClear, onShuffle }) {
    return (
        <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
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
