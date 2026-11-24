import React, { useRef, useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAudio } from "../../context/AudioContext";

function Sidebar({ activePanel, onPanelChange }) {
  const { volume, setVolume } = useAudio();
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const sliderRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);

  const updateVolume = (clientY) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    if (rect.height <= 0) return;
    const clickPosition = clientY - rect.top;
    const sliderHeight = rect.height;
    let volumePercentage = 1 - clickPosition / sliderHeight;

    volumePercentage = Math.max(0, Math.min(volumePercentage, 1));
    if (volumePercentage <= 0.01) volumePercentage = 0;

    setVolume(volumePercentage);
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    updateVolume(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateVolume(e.clientY);
    }
  };

  const isPanelActive =
    activePanel === "directory" || activePanel === "equalizer";

  const handleMouseUp = () => {
    setIsDragging(false);
    if (!isHoveringRef.current && !isPanelActive) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 200);
    }
  };

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    if (isDragging) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handlePanelClick = (panel) => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  const activeRedButton = hoveredPanel || activePanel;
  const isTrayOpen = isOpen || isPanelActive;

  return (
    <div className={styles.container}>
      {!isPanelActive && (
        <div
          className={styles.triggerZone}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-no-window-drag
        />
      )}

      {isPanelActive && (
        <div className={styles.navigator}>
          <button
            className={styles.backButton}
            onClick={() => onPanelChange(null)}
            type="button"
            aria-label="Back"
          >
            <img
              src="/icons/back.svg"
              alt=""
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </button>
          <button
            className={styles.githubNavButton}
            onClick={() => openUrl("https://github.com/yashthorat7/musix")}
            type="button"
            aria-label="GitHub Profile"
          >
            <img
              src="/icons/github.svg"
              alt=""
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </button>
        </div>
      )}

      <div
        className={`${styles.tray} ${isTrayOpen ? styles.trayOpen : ""}`}
        data-no-window-drag
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => {
          setHoveredPanel(null);
          handleMouseLeave();
        }}
      >
        <button
          className={`${styles.iconButton} ${activeRedButton === "directory" ? styles.active : ""}`}
          onClick={() => handlePanelClick("directory")}
          onMouseEnter={() => setHoveredPanel("directory")}
          onMouseLeave={() => setHoveredPanel(null)}
          type="button"
          aria-label="Queue Directory"
        >
          <img
            src="/icons/directory.svg"
            alt=""
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </button>
        <button
          className={`${styles.iconButton} ${activeRedButton === "equalizer" ? styles.active : ""}`}
          onClick={() => handlePanelClick("equalizer")}
          onMouseEnter={() => setHoveredPanel("equalizer")}
          onMouseLeave={() => setHoveredPanel(null)}
          type="button"
          aria-label="Equalizer"
        >
          <img
            src="/icons/equalizer.svg"
            alt=""
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </button>

        <div
          className={styles.sliderContainer}
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          data-no-window-drag
          data-slider
        >
          <div className={styles.progressBar} data-no-window-drag>
            <div
              className={styles.progressFill}
              style={{ height: `${volume * 100}%` }}
              data-no-window-drag
            >
              <div className={styles.progressHandle} data-no-window-drag></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
