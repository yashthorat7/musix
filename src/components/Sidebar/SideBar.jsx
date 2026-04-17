import React, { useState, useRef, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useAudio } from '../../context/AudioContext';

function Sidebar({ isOpen, activePanel, onPanelChange, setSidebarOpen, setIsSidebarOpen }) {
    const [volume, setVolume] = useState(0.5);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);
    const closeTimeoutRef = useRef(null);
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

    const handleMouseEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        setIsSidebarOpen(true);
    };

    const handleMouseLeave = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(() => {
            setIsSidebarOpen(false);
        }, 150);
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
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [isDragging]);

    const handlePanelClick = (panel) => {
        if (activePanel === panel) {
            onPanelChange(null);
            setSidebarOpen(false);
        } else {
            onPanelChange(panel);
            setSidebarOpen(true);
        }
    };

    return (
        <div className={styles.container}>
            <div 
                className={styles.triggerZone}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            <div
                className={styles.navigator}
                style={{
                    display:
                        activePanel === 'directory' || activePanel === 'equalizer'
                            ? 'flex'
                            : 'none',
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    className={styles.backButton}
                    onClick={() => {
                        onPanelChange(null);
                        setSidebarOpen(false);
                    }}
                >
                    <img src="/icons/back.svg" alt="Back" />
                </button>
                <button
                    className={styles.githubNavButton}
                    onClick={() => openUrl('https://github.com/yashthorat7')}
                    title="GitHub"
                >
                    <img src="/icons/github.svg" alt="GitHub" />
                </button>
            </div>
            <div 
                className={`${styles.tray} ${isOpen ? styles.trayOpen : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    className={`${styles.iconButton} ${activePanel === 'directory' ? styles.active : ''}`}
                    onClick={() => handlePanelClick('directory')}
                >
                    <img src="/icons/directory.svg" alt="Open Folder" />
                </button>
                <button
                    className={`${styles.iconButton} ${activePanel === 'equalizer' ? styles.active : ''}`}
                    onClick={() => handlePanelClick('equalizer')}
                >
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

export default Sidebar;
