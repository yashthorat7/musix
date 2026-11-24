import React, { useRef, useState, useEffect } from "react";
import styles from "./ProgressBar.module.css";

function ProgressBar({ currentTime, duration, onSeek }) {
  const progressBarRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seekFromClientX = (clientX) => {
    if (!progressBarRef.current || !duration || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = clientX - rect.left;
    const progressBarWidth = rect.width;
    let clickPercentage = clickPosition / progressBarWidth;

    clickPercentage = Math.max(0, Math.min(clickPercentage, 1));
    if (clickPercentage <= 0.01) clickPercentage = 0;

    const newTime = duration * clickPercentage;
    onSeek(newTime);
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (e.button === 0) {
      setIsScrubbing(true);
      seekFromClientX(e.clientX);
    }
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e) => {
      seekFromClientX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, duration]);

  return (
    <div
      className={styles.progressContainer}
      onMouseDown={handleMouseDown}
      ref={progressBarRef}
      role="slider"
      aria-valuenow={currentTime}
      aria-valuemin={0}
      aria-valuemax={duration}
      data-no-window-drag
    >
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }}
        >
          <div className={styles.progressHandle}></div>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
