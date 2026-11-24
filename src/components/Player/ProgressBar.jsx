import React, { useRef, useState, useEffect } from "react";
import styles from "./ProgressBar.module.css";
import { useAudio } from "../../context/AudioContext";

function ProgressBar({ currentTime, duration, onSeek }) {
  const { setIsSeeking } = useAudio();
  const progressBarRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const validDuration =
    typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? duration
      : 0;
  const validCurrentTime =
    typeof currentTime === "number" && Number.isFinite(currentTime)
      ? Math.max(0, Math.min(currentTime, validDuration || 0))
      : 0;

  const progressPercentage =
    validDuration > 0
      ? Math.max(0, Math.min(100, (validCurrentTime / validDuration) * 100))
      : 0;

  const seekFromClientX = (clientX) => {
    if (!progressBarRef.current || validDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickPosition = clientX - rect.left;
    let clickPercentage = clickPosition / rect.width;

    clickPercentage = Math.max(0, Math.min(clickPercentage, 1));
    if (clickPercentage <= 0.01) clickPercentage = 0;

    const newTime = validDuration * clickPercentage;
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
      setIsSeeking(true);
      seekFromClientX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setIsSeeking(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, validDuration]);

  return (
    <div
      className={styles.progressContainer}
      onMouseDown={handleMouseDown}
      ref={progressBarRef}
      role="slider"
      aria-valuenow={validCurrentTime}
      aria-valuemin={0}
      aria-valuemax={validDuration}
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
