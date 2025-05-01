import React, { useState, useRef, useEffect } from 'react';
import styles from './SideBar.module.css';
import { useAudio } from '../../context/AudioContext';

function SideBar({ isOpen }) {
    const [volume, setVolume] = useState(0.5);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);
    const { audioRef } = useAudio();

    const updateVolume = (clientY) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const clickPosition = clientY - rect.top;
        const sliderHeight = rect.height;
        let volumePercentage = 1 - clickPosition / sliderHeight;

        volumePercentage = Math.max(0, Math.min(volumePercentage, 1));
        if (volumePercentage <= 0.01) volumePercentage = 0;

        setVolume(volumePercentage);
        if (audioRef.current) {
            audioRef.current.volume = volumePercentage;
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        updateVolume(e.clientY);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            updateVolume(e.clientY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
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
        <div className={styles.container}>
            <div className="sidebar-trigger"></div>
            <div className={`${styles.tray} ${isOpen ? styles.trayOpen : ''}`}>
                <button className={styles.iconButton}>
                    <img src="/icons/directory.svg" alt="Open Folder" />
                </button>
                <button className={styles.iconButton}>
                    <img src="/icons/equalizer.svg" alt="Equalizer" />
                </button>

                <div
                    className={styles.sliderContainer}
                    ref={sliderRef}
                    onMouseDown={handleMouseDown}
                >
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ height: `${volume * 100}%` }}>
                            <div className={styles.progressHandle}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SideBar;
