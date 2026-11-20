import React from "react";
import styles from "./MiniProgressBar.module.css";
import { useAudio } from "../../context/AudioContext";

function MiniProgressBar() {
  const { currentTime, duration } = useAudio();
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export default MiniProgressBar;
