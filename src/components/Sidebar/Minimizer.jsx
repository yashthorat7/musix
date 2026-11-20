import React from "react";
import styles from "./Minimizer.module.css";

function Minimizer({ onMinimize }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onMinimize) onMinimize();
  };

  return (
    <button className={styles.container} onClick={handleClick} type="button">
      <img src="icons/minimizer.svg" alt="" />
    </button>
  );
}

export default Minimizer;
