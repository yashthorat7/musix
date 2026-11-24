import React, { useRef, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import styles from "./Miniview.module.css";
import MiniDisc from "./MiniDisc";
import MiniProgressBar from "./MiniProgressBar";
import { useAudio } from "../../context/AudioContext";

function Miniview({ onRestore, isPreview = false }) {
  const { metadata } = useAudio();
  const dragCleanupRef = useRef(null);

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
    };
  }, []);

  const handleMouseDown = (e) => {
    if (isPreview) return;
    if (e.target.closest("button, input, a, [data-no-window-drag]")) return;
    if (e.button !== 0) return;

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
          if (onRestore) onRestore();
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
    <div className={styles.container} onMouseDown={handleMouseDown}>
      <MiniDisc coverArt={metadata?.cover_art} />
      <MiniProgressBar />
    </div>
  );
}

export default Miniview;
