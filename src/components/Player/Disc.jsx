import React, { useEffect, useRef, useState } from 'react';
import styles from './Disc.module.css';
import { useAudio } from '../../context/AudioContext';

function Disc({ coverArt }) {
    const { currentTime, isPlaying, togglePlay } = useAudio();
    const discRef = useRef(null);
    const [rotation, setRotation] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    useEffect(() => {
        setRotation((currentTime / 25) * 360);
    }, [currentTime]);

    useEffect(() => {
        let animationFrameId;

        const updateRotation = () => {
            setRotation((currentTime / 25) * 360);
            animationFrameId = requestAnimationFrame(updateRotation);
        };

        if (isPlaying && !isSeeking) {
            updateRotation();
        } else {
            cancelAnimationFrame(animationFrameId);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [currentTime, isPlaying, isSeeking]);

    const discStyle = {
        ...(coverArt
            ? {
                  background: `url(${coverArt}) center/cover no-repeat,
                radial-gradient(circle at top left, #8400ff, transparent 70%),
                radial-gradient(circle at top right, #0026ff, transparent 70%),
                radial-gradient(circle at bottom left, #ff000d, transparent 70%),
                radial-gradient(circle at bottom right, #ff39e5, transparent 70%)`,
              }
            : {}),
        transform: `rotate(${rotation}deg)`,
        transition: isPlaying ? 'transform 0.4s ease-out' : 'transform 2s',
    };

    const handleDoubleClick = () => {
        togglePlay();
    };

    return (
        <div
            className={styles.discWrapper}
            onClick={togglePlay}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: 'pointer' }}
        >
            <div ref={discRef} className={styles.disc} style={discStyle}></div>
            <div className={styles.discInner}></div>
            <div className={styles.discCenter}></div>
        </div>
    );
}

export default Disc;
