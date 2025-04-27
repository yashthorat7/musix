import React from 'react';
import styles from './Controller.module.css';

function formatTime(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function Controller({
    metadata,
    currentTime,
    duration,
    isPlaying,
    onTogglePlay,
    onSeek,
    onPrevious,
    onNext,
}) {
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleProgressClick = (e) => {
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickPosition = e.clientX - rect.left;
        const progressBarWidth = rect.width;
        const clickPercentage = clickPosition / progressBarWidth;
        const newTime = duration * clickPercentage;
        onSeek(newTime);
    };

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button className={styles.button} onClick={onPrevious}>
                    <img
                        src="/icons/double-arrow.svg"
                        className={styles.reverseArrow}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        alt=""
                    />
                </button>
                <div className={styles.timeDisplay}>
                    <span className={styles.currentTime}>{formatTime(currentTime)}</span>
                    <span className={styles.divider}>|</span>
                    <span className={styles.duration}>{formatTime(duration)}</span>
                </div>
                <button className={styles.button} onClick={onNext}>
                    <img
                        src="/icons/double-arrow.svg"
                        className={styles.forwardArrow}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        alt=""
                    />
                </button>
            </div>
            <div className={styles.progressContainer} onClick={handleProgressClick}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default Controller;
