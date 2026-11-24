import React, { useRef } from "react";
import styles from "./Equalizer.module.css";
import { useAudio } from "../../context/AudioContext";

const EQ_BANDS = ["bass", "mids", "treble", "air"];

function Equalizer({ isOpen }) {
  const { equalizer } = useAudio();
  const { levels, setLevel, resetLevels } = equalizer;
  const isDragging = useRef(null);

  const updateLevel = (name, clientY) => {
    const container = document.querySelector(`[data-slider="${name}"]`);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickPosition = clientY - rect.top;
    const sliderHeight = rect.height;
    let percentage = 1 - clickPosition / sliderHeight;

    percentage = Math.max(0, Math.min(percentage, 1));
    if (percentage <= 0.01) percentage = 0;

    const value = Math.round(percentage * 100);
    setLevel(name, value);
  };

  const handleMouseDown = (e, name) => {
    e.stopPropagation();
    isDragging.current = name;
    updateLevel(name, e.clientY);

    const handleMouseMove = (moveEvent) => {
      if (isDragging.current) {
        updateLevel(isDragging.current, moveEvent.clientY);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`${styles.container} ${isOpen ? styles.open : ""}`}
      data-no-window-drag
    >
      <div className={styles.equalizer} data-no-window-drag>
        {EQ_BANDS.map((name) => {
          const value = levels[name] ?? 50;
          return (
            <div key={name} className={styles.sliderGroup} data-no-window-drag>
              <div
                className={styles.sliderContainer}
                data-slider={name}
                data-no-window-drag
                onMouseDown={(e) => handleMouseDown(e, name)}
              >
                <div className={styles.slider} data-no-window-drag>
                  <div
                    className={styles.sliderFill}
                    style={{ height: `${value}%` }}
                    data-no-window-drag
                  >
                    <div className={styles.sliderHandle} data-no-window-drag />
                  </div>
                </div>
              </div>
              <span className={styles.sliderLabel} data-no-window-drag>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </span>
            </div>
          );
        })}
      </div>
      <button
        className={styles.resetButton}
        onClick={resetLevels}
        type="button"
        data-no-window-drag
      >
        <img src="/icons/reset.svg" alt="" />
      </button>
    </div>
  );
}

export default Equalizer;
