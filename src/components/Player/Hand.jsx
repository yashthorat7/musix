import React from "react";
import styles from "./Hand.module.css";
import { useAudio } from "../../context/AudioContext";

export default function Hand({ onClose }) {
  const { isPlaying } = useAudio();

  return (
    <>
      <div
        className={`${styles.handWrapper} ${!isPlaying ? styles.paused : ""}`}
      >
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
        <button className={styles.closeButton} onClick={onClose} type="button">
          <div className={styles.closeButtonInner}></div>
        </button>
      </div>
    </>
  );
}
