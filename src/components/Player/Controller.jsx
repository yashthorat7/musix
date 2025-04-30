import React from 'react';
import styles from './Controller.module.css';
import { useAudio } from '../../context/AudioContext';
import { formatTime } from '../../utils/formatTime';
import ProgressBar from './ProgressBar';

function Controller() {
    const { currentTime, duration, handleSeek, handlePrevious, handleNext } = useAudio();

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button className={styles.button} onClick={handlePrevious}>
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
                <button className={styles.button} onClick={handleNext}>
                    <img
                        src="/icons/double-arrow.svg"
                        className={styles.forwardArrow}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        alt=""
                    />
                </button>
            </div>
            <ProgressBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

export default Controller;
