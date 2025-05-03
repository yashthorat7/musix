import React from 'react';
import styles from './Equalizer.module.css';

function Equalizer({ isOpen }) {
    return <div className={`${styles.container} ${isOpen ? styles.open : ''}`}></div>;
}

export default Equalizer;
