import React, { useRef, useEffect } from "react";
import styles from "./Equalizer.module.css";
import { useAudio } from "../../context/AudioContext";

const EQ_BANDS = ["bass", "mids", "treble", "air"];

function Equalizer({ isOpen }) {
  const { equalizer } = useAudio();
  const { levels, setLevel, resetLevels } = equalizer;
  const activeSliderRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const calculateAndSet = (clientY) => {
    if (!activeSliderRef.current) return;
    const { name, top, height } = activeSliderRef.current;
    const clickPosition = clientY - top;
    let percentage = 1 - clickPosition / height;

    percentage = Math.max(0, Math.min(percentage, 1));
    if (percentage <= 0.01) percentage = 0;

    const value = Math.round(percentage * 100);
    setLevel(name, value);
  };

  const handleMouseDown = (e, name) => {
    e.stopPropagation();
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const rect = e.currentTarget.getBoundingClientRect();
    activeSliderRef.current = { name, top: rect.top, height: rect.height };
    calculateAndSet(e.clientY);

    const handleMouseMove = (moveEvent) => {
      if (activeSliderRef.current) {
        calculateAndSet(moveEvent.clientY);
      }
    };

    const handleMouseUp = () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };

    const cleanup = () => {
      activeSliderRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      cleanupRef.current = null;
    };

    cleanupRef.current = cleanup;
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
        <img
          src="/icons/reset.svg"
          alt=""
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </button>
    </div>
  );
}

export default Equalizer;
