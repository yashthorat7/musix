import React, { useRef, useState, useEffect } from "react";
import styles from "./MiniProgressBar.module.css";
import { useAudio } from "../../context/AudioContext";

function MiniProgressBar() {
  const { currentTime, duration, handleSeek } = useAudio();
  const progressBarRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seekFromClientX = (clientX) => {
    if (!progressBarRef.current || !duration || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;
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
      ref={progressBarRef}
      onMouseDown={handleMouseDown}
      role="slider"
      aria-valuenow={currentTime}
      aria-valuemin={0}
      aria-valuemax={duration}
      title="Seek"
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
