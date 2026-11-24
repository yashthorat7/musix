import React from "react";
import styles from "./Player.module.css";
import Title from "./Title";
import Hand from "./Hand";
import Controller from "./Controller";
import Disc from "./Disc";
import Minimizer from "../Sidebar/Minimizer";
import { usePlayer } from "../../hooks/usePlayer";

function Player({ onMinimize, viewMode = "full" }) {
  const { metadata, fileName, handleClose } = usePlayer();
  const isMinimizing = viewMode === "minimizing";
  const isMaximizing = viewMode === "maximizing";

  let peripheralClass = styles.peripheral;
  if (isMinimizing) {
    peripheralClass += ` ${styles.fadeOut}`;
  } else if (isMaximizing) {
    peripheralClass += ` ${styles.fadeIn}`;
  }

  return (
    <div className={styles.container}>
      <div className={peripheralClass}>
        <Minimizer onMinimize={onMinimize} />
        <Title text={metadata?.title || fileName} />
        <Hand onClose={handleClose} />
        <Controller />
      </div>
      <Disc coverArt={metadata?.cover_art} />
    </div>
  );
}

export default Player;
