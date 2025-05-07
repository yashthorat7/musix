import React, { useState, useRef, useEffect } from 'react';
import styles from './Equalizer.module.css';

function Equalizer({ isOpen }) {
    const [levels, setLevels] = useState({
        bass: 50,
        mids: 50,
        treble: 50,
        air: 50,
    });
    const isDragging = useRef(null);

    const updateLevel = (name, clientY) => {
        if (!isDragging.current) return;
        const rect = document.querySelector(`[data-slider="${name}"]`).getBoundingClientRect();
        const clickPosition = clientY - rect.top;
        const sliderHeight = rect.height;
        let percentage = 1 - clickPosition / sliderHeight;

        percentage = Math.max(0, Math.min(percentage, 1));
        if (percentage <= 0.01) percentage = 0;

        const value = percentage * 100;
        setLevels(prev => ({ ...prev, [name]: value }));
    };

    const handleMouseDown = (e, name) => {
        isDragging.current = name;
        updateLevel(name, e.clientY);
    };

    const handleMouseMove = (e) => {
        if (isDragging.current) {
            updateLevel(isDragging.current, e.clientY);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = null;
    };

    useEffect(() => {
        if (isDragging.current) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging.current]);

    const handleReset = () => {
        setLevels({
            bass: 50,
            mids: 50,
            treble: 50,
            air: 50,
        });
    };

    return (
        <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
            <div className={styles.equalizer}>
                {Object.entries(levels).map(([name, value]) => (
                    <div key={name} className={styles.sliderGroup}>
                        <div
                            className={styles.sliderContainer}
                            data-slider={name}
                            onMouseDown={(e) => handleMouseDown(e, name)}
                        >
                            <div className={styles.slider}>
                                <div
                                    className={styles.sliderFill}
                                    style={{ height: `${value}%` }}
                                >
                                    <div className={styles.sliderHandle} />
                                </div>
                            </div>
                        </div>
                        <span className={styles.sliderLabel}>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                        </span>
                    </div>
                ))}
            </div>
            <button className={styles.resetButton} onClick={handleReset}>
                <img src="/icons/reset.svg" alt="Reset" />
            </button>
        </div>
    );
}

export default Equalizer;
