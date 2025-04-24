import React from 'react';
import styles from './Player.module.css';

function Player() {
    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button className={styles.button}>
                    <img src="/icons/double-arrow.svg"
                    className={styles.reverseArrow}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                    alt="" />
                </button>
                <div className={styles.timeDisplay}>
                    <span className={styles.currentTime}>3:55</span>
                    <span className={styles.divider}>|</span>
                    <span className={styles.duration}>5:30</span>
                </div>
                <button className={styles.button}>
                    <img src="/icons/double-arrow.svg"
                    className={styles.forwardArrow}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                    alt="" />
                </button>
            </div>
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '65%' }}></div>
                </div>
            </div>
        </div>
    );
}

export default Player;
