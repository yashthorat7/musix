import React, { useRef, useEffect } from "react";
import styles from "./Directory.module.css";
import { invoke } from "@tauri-apps/api/core";
import { useAudio } from "../../context/AudioContext";

function Directory({
  isOpen,
  songs = [],
  currentIndex = -1,
  onRemove,
  onClear,
  onShuffle,
  onSelectSong,
}) {
  const currentSongRef = useRef(null);
  const { processSongs } = useAudio();

  useEffect(() => {
    if (isOpen && currentSongRef.current) {
      currentSongRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [isOpen, currentIndex]);

  const handleAddClick = async () => {
    try {
      const selected = await invoke("select_audio_files");
      if (selected && selected.length > 0) {
        await processSongs(selected);
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  };

  return (
    <div className={`${styles.container} ${isOpen ? styles.open : ""}`}>
      <div className={styles.songList}>
        {songs.length === 0 ? (
          <div className={styles.emptyMessage}>No songs in queue</div>
        ) : (
          songs.map((song, index) => {
            const isCurrent = index === currentIndex;
            const displayName =
              song.metadata?.title ||
              song.fileName ||
              song.path.split(/[/\\]/).pop();

            return (
              <div
                key={`${song.path}-${index}`}
                ref={isCurrent ? currentSongRef : null}
                className={`${styles.songItem} ${isCurrent ? styles.currentSong : ""}`}
              >
                <div
                  className={styles.songTitle}
                  onClick={() => onSelectSong && onSelectSong(index)}
                  style={{ cursor: "pointer" }}
                >
                  {displayName}
                </div>
                <button
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  type="button"
                >
                  <img src="/icons/minus.svg" alt="" />
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className={styles.controls}>
        <div className={styles.capsule}>
          <button
            className={styles.capsuleButton}
            onClick={onShuffle}
            type="button"
          >
            <img src="/icons/random.svg" alt="" />
          </button>
          <button
            className={styles.capsuleButton}
            onClick={handleAddClick}
            type="button"
          >
            <img src="/icons/add.svg" alt="" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Directory;
