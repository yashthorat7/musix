import React, { useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./Miniview.module.css";
import MiniDisc from "./MiniDisc";
import MiniProgressBar from "./MiniProgressBar";
import { useAudio } from "../../context/AudioContext";

function Miniview({ onRestore, isPreview = false }) {
  const { metadata } = useAudio();
  const dragStartPos = useRef(null);

  const handleMouseDown = (e) => {
    if (isPreview) return;
    if (e.button === 0) {
      dragStartPos.current = { x: e.screenX, y: e.screenY };
      try {
        getCurrentWindow().startDragging();
      } catch (err) {}
    }
  };

  const handleRestore = (e) => {
    if (isPreview) return;
    if (dragStartPos.current) {
      const dist = Math.hypot(
        e.screenX - dragStartPos.current.x,
        e.screenY - dragStartPos.current.y,
      );
      if (dist > 6) return;
    }

    if (onRestore) onRestore();
  };

  return (
    <div
      className={styles.container}
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      onClick={handleRestore}
    >
      <MiniDisc coverArt={metadata?.cover_art} />
      <MiniProgressBar />
    </div>
  );
}

export default Miniview;
