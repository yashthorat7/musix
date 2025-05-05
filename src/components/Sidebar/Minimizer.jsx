import React from 'react';
import styles from './Minimizer.module.css';

function Minimizer({ onMinimize }) {
    return (
        <button className={styles.container} onClick={onMinimize}>
            <img src="icons/minimizer.svg" alt="Minimize" />
        </button>
    );
}

export default Minimizer;
