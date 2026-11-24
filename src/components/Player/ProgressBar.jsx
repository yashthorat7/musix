import React, { useRef, useState, useEffect } from "react";
import styles from "./ProgressBar.module.css";
import { useAudio } from "../../context/AudioContext";

function ProgressBar({ currentTime, duration, onSeek }) {
  const { setIsSeeking } = useAudio();
  const progressBarRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPercent, setScrubPercent] = useState(null);
  const isDraggingRef = useRef(false);

  const validDuration =
    typeof duration === "number" && Number.isFinite(duration) && duration > 0
      ? duration
      : 0;
  const validCurrentTime =
    typeof currentTime === "number" && Number.isFinite(currentTime)
      ? Math.max(0, Math.min(currentTime, validDuration || 0))
      : 0;

  const progressPercentage =
    scrubPercent !== null
      ? scrubPercent * 100
      : validDuration > 0
        ? Math.max(0, Math.min(100, (validCurrentTime / validDuration) * 100))
        : 0;

  const getTimeFromClientX = (clientX) => {
    if (!progressBarRef.current || validDuration <= 0)
      return { time: 0, ratio: 0 };
    const rect = progressBarRef.current.getBoundingClientRect();
    if (rect.width <= 0) return { time: 0, ratio: 0 };
    const clickPosition = clientX - rect.left;
    let ratio = clickPosition / rect.width;
    ratio = Math.max(0, Math.min(ratio, 1));
    if (ratio <= 0.005) ratio = 0;
    return { time: validDuration * ratio, ratio };
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (e.button === 0 && validDuration > 0) {
      isDraggingRef.current = false;
      setIsScrubbing(true);
      const { time, ratio } = getTimeFromClientX(e.clientX);
      setScrubPercent(ratio);
      onSeek(time);
    }
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e) => {
      isDraggingRef.current = true;
      setIsSeeking(true);
      const { ratio } = getTimeFromClientX(e.clientX);
      setScrubPercent(ratio);
    };

    const handleMouseUp = (e) => {
      if (isDraggingRef.current) {
        const { time } = getTimeFromClientX(e.clientX);
        onSeek(time);
      }
      setIsScrubbing(false);
      setIsSeeking(false);
      setScrubPercent(null);
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, validDuration, onSeek, setIsSeeking]);

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
