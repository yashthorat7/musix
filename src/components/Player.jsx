import React from 'react';
import styles from './Player.module.css';
import Marquee from './Marquee';

export default function Player({ filePath }) {
    const fileName = filePath ? filePath.split(/[/\\]/).pop() : 'No file selected';

    const handleClose = () => {
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <div className={styles.title}>
                <Marquee text={fileName} />
            </div>
            <div className={styles.discWrapper}>
                <div className={styles.disc}>
                    <img
                        src="/image1.png"
                        className={styles.discImage}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                        alt=""
                    />
                </div>
                <div className={styles.discInner}></div>
                <div className={styles.discCenter}></div>
            </div>
            <div className={styles.handWrapper}>
                <svg className={styles.hand}>
                    <polyline
                        points="39,5 39,95 0,120"
                        fill="none"
                        stroke="#D6D6D6"
                        strokeWidth="6"
                    />
                </svg>
                <div className={styles.handHead}></div>
            </div>
            <div className={styles.closeWrapper}>
                <button className={styles.closeButton} onClick={handleClose}>
                    <div className={styles.closeButtonInner}></div>
                </button>
            </div>
        </div>
    );
}
