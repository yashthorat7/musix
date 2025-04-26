import React from 'react';
import styles from './Disc.module.css';

function Disc({ coverArt }) {
    return (
        <div className={styles.discWrapper}>
            <div className={styles.disc}>
                <img
                    src={coverArt || "/images/image1.png"}
                    className={styles.discImage}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                    alt=""
                />
            </div>
            <div className={styles.discInner}></div>
            <div className={styles.discCenter}></div>
        </div>
    );
}

export default Disc;
