import React from "react";
import styles from "./Player.module.css";
import Title from "./Title";
import Hand from "./Hand";
import Controller from "./Controller";
import Disc from "./Disc";
import Minimizer from "../Sidebar/Minimizer";
import { usePlayer } from "../../hooks/usePlayer";

function Player({ onMinimize }) {
  const { metadata, fileName, handleClose } = usePlayer();

  return (
    <div className={styles.container}>
      <Minimizer onMinimize={onMinimize} />
      <Title text={metadata?.title || fileName} />
      <Disc coverArt={metadata?.cover_art} />
      <Hand onClose={handleClose} />
      <Controller />
    </div>
  );
}

export default Player;
