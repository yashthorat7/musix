import React, { useRef, useEffect, useState } from 'react';
import styles from './Title.module.css';

const Title = ({ text, repeat = 80, speed = 50 }) => {
    const trackRef = useRef(null);
    const [duration, setDuration] = useState(0);

    const repeatedText = Array.from({ length: repeat }, () => text);

    useEffect(() => {
        if (trackRef.current) {
            const trackWidth = trackRef.current.scrollWidth;
            setDuration(trackWidth / speed);
        }
    }, [text, repeat, speed]);

    return (
        <div className={styles.title}>
            <div className={styles.marquee}>
                <div
                    className={styles.track}
                    ref={trackRef}
                    style={{ animationDuration: `${duration}s` }}
                >
                    {repeatedText.map((t, i) => (
                        <span key={i}>{t}</span>
                    ))}
                    {repeatedText.map((t, i) => (
                        <span key={`dup-${i}`}>{t}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Title;
