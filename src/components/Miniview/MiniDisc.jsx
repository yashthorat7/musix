import React, { useRef, useEffect } from "react";
import styles from "./MiniDisc.module.css";
import { useAudio } from "../../context/AudioContext";
import { useDiscRotation } from "../../hooks/useDiscRotation";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

function MiniDisc({ coverArt }) {
  const { currentTime, isPlaying, togglePlay } = useAudio();
  const discRef = useRef(null);
  const dragCleanupRef = useRef(null);
  const { getDiscStyle } = useDiscRotation(
    currentTime,
    isPlaying,
    false,
    coverArt,
    discRef,
  );

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
    };
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (dragCleanupRef.current) {
      dragCleanupRef.current();
    }

    const startX = e.screenX;
    const startY = e.screenY;
    let hasStartedDrag = false;

    const onMouseMove = (moveEvent) => {
      if (hasStartedDrag) return;
      const dist = Math.hypot(
        moveEvent.screenX - startX,
        moveEvent.screenY - startY,
      );
      if (dist > 5) {
        hasStartedDrag = true;
        cleanup();
        try {
          invoke("start_dragging");
        } catch (err) {
          try {
            getCurrentWindow().startDragging();
          } catch (e2) {}
        }
      }
    };

    const onMouseUp = (upEvent) => {
      cleanup();
      if (!hasStartedDrag) {
        const dist = Math.hypot(
          upEvent.screenX - startX,
          upEvent.screenY - startY,
        );
        if (dist <= 5) {
          togglePlay();
        }
      }
    };

    const cleanup = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dragCleanupRef.current = null;
    };

    dragCleanupRef.current = cleanup;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      className={styles.discWrapper}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? "Pause music" : "Play music"}
      title={isPlaying ? "Pause" : "Play"}
    >
      <div
        ref={discRef}
        className={styles.disc}
        style={getDiscStyle(coverArt)}
      ></div>
      <div className={styles.discInner}></div>
      <div className={styles.discCenter}></div>
    </div>
  );
}

export default MiniDisc;
