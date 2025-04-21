import React from 'react';
import styles from './Marquee.module.css';

const Marquee = ({ text, repeat = 80 }) => {
  const repeatedText = Array.from({ length: repeat }, () => text);

  return (
    <div className={styles.title}>
      <div className={styles.marquee}>
        <div className={styles.track}>
          {repeatedText.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
