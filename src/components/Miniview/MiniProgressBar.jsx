import React, { useRef, useState, useEffect } from "react";
import styles from "./MiniProgressBar.module.css";
import { useAudio } from "../../context/AudioContext";

function MiniProgressBar() {
  const { currentTime, duration, handleSeek, setIsSeeking } = useAudio();
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
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * validDuration;
    handleSeek(newTime);
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
      ref={progressBarRef}
      onMouseDown={handleMouseDown}
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
        ></div>
      </div>
    </div>
  );
}

export default MiniProgressBar;
