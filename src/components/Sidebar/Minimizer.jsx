import React from "react";
import styles from "./Minimizer.module.css";

function Minimizer({ onMinimize }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onMinimize) onMinimize();
  };

  return (
    <button
      className={styles.container}
      onClick={handleClick}
      type="button"
      title="Mini"
      aria-label="Switch to mini view"
    >
      <img
        src="/icons/minimizer.svg"
        alt=""
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    </button>
  );
}

export default Minimizer;
