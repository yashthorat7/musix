import React, { useState, useEffect } from 'react';
import styles from './Splash.module.css';

function Splash({ children }) {
    const [isSplash, setIsSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSplash(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    if (isSplash) {
        return (
            <div className={styles.container}>
                <img src="/images/logo.png" alt="Logo" className={styles.logo} />
                <p className={styles.credit}>YASH THORAT</p>
            </div>
        );
    }

    return children;
}

export default Splash;
