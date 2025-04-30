import React, { useRef, useState, useEffect } from 'react';
import styles from './ProgressBar.module.css';

function ProgressBar({ currentTime, duration, onSeek }) {
    const [isDragging, setIsDragging] = useState(false);
    const progressBarRef = useRef(null);
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const [lastX, setLastX] = useState(null);

    const updateSeek = (clientX) => {
        if (!progressBarRef.current) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPosition = clientX - rect.left;
        const progressBarWidth = rect.width;
        let clickPercentage = clickPosition / progressBarWidth;

        const direction = lastX !== null ? clientX - lastX : 0;
        setLastX(clientX);

        clickPercentage = Math.max(0, Math.min(clickPercentage, 1));
        if (clickPercentage <= 0.01) clickPercentage = 0;

        const newTime = duration * clickPercentage;
        onSeek(newTime, direction);
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
            setLastX(null);
        }
    };

    useEffect(() => {
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
        <div
            className={styles.progressContainer}
            onMouseDown={handleMouseDown}
            ref={progressBarRef}
        >
            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }}>
                    <div className={styles.progressHandle}></div>
                </div>
            </div>
        </div>
    );
}

export default ProgressBar;
