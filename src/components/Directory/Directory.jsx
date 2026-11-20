import React, { useRef, useState } from "react";
import styles from "./Directory.module.css";
import { useAudio } from "../../context/AudioContext";
import { isAudioFile, ACCEPT_AUDIO_STRING } from "../../utils/audioFormats";

function Directory({
  isOpen,
  songs = [],
  onRemove,
  onClear,
  onShuffle,
  onSelectSong,
}) {
  const fileInputRef = useRef(null);
  const { processSongs } = useAudio();
  const [dragActive, setDragActive] = useState(false);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    try {
      const files = Array.from(e.target.files || [])
        .filter((file) => isAudioFile(file.name))
        .map((file) => file.path || file.webkitRelativePath || file.name);

      if (files.length > 0) {
        await processSongs(files);
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    } finally {
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    try {
      const files = Array.from(e.dataTransfer?.files || [])
        .filter((file) => isAudioFile(file.name))
        .map((file) => file.path);

      if (files.length > 0) {
        await processSongs(files);
      }
    } catch (error) {
      console.error("Error handling dropped files:", error);
    }
  };

  return (
    <div
      className={`${styles.container} ${isOpen ? styles.open : ""} ${dragActive ? styles.dragActive : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.songList}>
        {songs.length === 0 ? (
          <div className={styles.emptyMessage}>No songs in queue</div>
        ) : (
          songs.map((song, index) => {
            const displayName =
              song.metadata?.title ||
              song.fileName ||
              song.path.split(/[/\\]/).pop();

            return (
              <div
                key={`${song.path}-${index}`}
                className={`${styles.songItem} ${index === 0 ? styles.currentSong : ""}`}
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
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_AUDIO_STRING}
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}

export default Directory;
