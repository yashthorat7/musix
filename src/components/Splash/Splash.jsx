import React, { useState, useEffect } from "react";
import styles from "./Splash.module.css";

function Splash({ children }) {
  const [isSplash, setIsSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (isSplash) {
    return (
      <div
        className={styles.container}
        onClick={() => setIsSplash(false)}
        style={{ cursor: "pointer" }}
      >
        <img
          src="/images/logo.png"
          alt="Logo"
          className={styles.logo}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <p className={styles.credit}>YASH THORAT</p>
      </div>
    );
  }

  return children;
}

export default Splash;
