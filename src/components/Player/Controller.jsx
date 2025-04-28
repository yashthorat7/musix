import React, { useRef, useState } from 'react';
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
    const [isDragging, setIsDragging] = useState(false);
    const progressBarRef = useRef(null);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const updateSeek = (clientX) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPosition = clientX - rect.left;
        const progressBarWidth = rect.width;
        let clickPercentage = clickPosition / progressBarWidth;

        // Clamp between 0 and 1
        clickPercentage = Math.max(0, Math.min(clickPercentage, 1));

        // Snap to 0 if very close (like below 1%)
        if (clickPercentage <= 0.01) {
            clickPercentage = 0;
        }

        const newTime = duration * clickPercentage;
        onSeek(newTime);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        updateSeek(e.clientX);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            updateSeek(e.clientX);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    // Attach global mousemove and mouseup listeners while dragging
    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

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
            <div
                className={styles.progressContainer}
                onMouseDown={handleMouseDown}
                ref={progressBarRef}
            >
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercentage}%` }}
                    >
                        <div className={styles.progressHandle}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Controller;
