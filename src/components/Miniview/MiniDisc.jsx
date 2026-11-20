import React, { useRef, useState, useEffect } from "react";
import styles from "./MiniDisc.module.css";
import { useAudio } from "../../context/AudioContext";
import { useDiscRotation } from "../../hooks/useDiscRotation";

function MiniDisc({ coverArt }) {
  const { currentTime, isPlaying } = useAudio();
  const discRef = useRef(null);
  const { getDiscStyle } = useDiscRotation(
    currentTime,
    isPlaying,
    false,
    coverArt,
  );

  return (
    <div className={styles.discWrapper}>
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
