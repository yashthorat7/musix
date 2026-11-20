import React, { useRef, useState, useEffect } from "react";
import styles from "./Disc.module.css";
import { useAudio } from "../../context/AudioContext";
import { useDiscRotation } from "../../hooks/useDiscRotation";

function Disc({ coverArt }) {
  const { currentTime, isPlaying, togglePlay } = useAudio();
  const discRef = useRef(null);
  const [isSeeking] = useState(false);
  const { getDiscStyle, randomizeGradient } = useDiscRotation(
    currentTime,
    isPlaying,
    isSeeking,
    coverArt,
  );

  useEffect(() => {
    randomizeGradient();
  }, [coverArt]);

  const handleDoubleClick = () => {
    togglePlay();
  };

  return (
    <div
      className={styles.discWrapper}
      onClick={togglePlay}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: "pointer" }}
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

export default Disc;
