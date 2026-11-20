import { useEffect, useState, useRef } from "react";

const gradientVariants = [
  {
    topLeft: "#8400ff",
    topRight: "#0055ff",
    bottomLeft: "#ff007f",
    bottomRight: "#ff39e5",
  },
  {
    topLeft: "#00ff88",
    topRight: "#00b7ff",
    bottomLeft: "#ff7b00",
    bottomRight: "#ff00d4",
  },
  {
    topLeft: "#ff0080",
    topRight: "#7700ff",
    bottomLeft: "#00ffd5",
    bottomRight: "#ff6f00",
  },
  {
    topLeft: "#7400ff",
    topRight: "#ff0000",
    bottomLeft: "#00ff95",
    bottomRight: "#4c00ff",
  },
  {
    topLeft: "#00f5a0",
    topRight: "#00d2ff",
    bottomLeft: "#ff007f",
    bottomRight: "#ffaa00",
  },
  {
    topLeft: "#ff0055",
    topRight: "#4361ee",
    bottomLeft: "#00f0ff",
    bottomRight: "#f72585",
  },
  {
    topLeft: "#ff5858",
    topRight: "#f857a6",
    bottomLeft: "#7f00ff",
    bottomRight: "#e100ff",
  },
  {
    topLeft: "#00f2fe",
    topRight: "#4facfe",
    bottomLeft: "#43e97b",
    bottomRight: "#38f9d7",
  },
  {
    topLeft: "#fa709a",
    topRight: "#fee140",
    bottomLeft: "#ff0844",
    bottomRight: "#ffb199",
  },
  {
    topLeft: "#00c6ff",
    topRight: "#0072ff",
    bottomLeft: "#10b981",
    bottomRight: "#6366f1",
  },
  {
    topLeft: "#8a2387",
    topRight: "#e94057",
    bottomLeft: "#f27121",
    bottomRight: "#ff0055",
  },
  {
    topLeft: "#b388ff",
    topRight: "#80d8ff",
    bottomLeft: "#ff80ab",
    bottomRight: "#ffd180",
  },
];

export function useDiscRotation(currentTime, isPlaying, isSeeking, coverArt) {
  const [rotation, setRotation] = useState(0);
  const [isPauseSnap, setIsPauseSnap] = useState(false);
  const gradientRef = useRef(
    gradientVariants[Math.floor(Math.random() * gradientVariants.length)],
  );

  const randomizeGradient = () => {
    gradientRef.current =
      gradientVariants[Math.floor(Math.random() * gradientVariants.length)];
  };

  useEffect(() => {
    randomizeGradient();
  }, [coverArt]);

  useEffect(() => {
    if (!isPlaying && !isPauseSnap) {
      setIsPauseSnap(true);
      setTimeout(() => setIsPauseSnap(false), 50);
    }
  }, [isPlaying]);

  useEffect(() => {
    setRotation((currentTime / 25) * 360);
  }, [currentTime]);

  useEffect(() => {
    let animationFrameId;

    const updateRotation = () => {
      setRotation((currentTime / 25) * 360);
      animationFrameId = requestAnimationFrame(updateRotation);
    };

    if (isPlaying && !isSeeking) {
      updateRotation();
    } else {
      cancelAnimationFrame(animationFrameId);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentTime, isPlaying, isSeeking]);

  const getDiscStyle = (coverArt) => {
    const gradientBackground = `radial-gradient(circle at top left, ${gradientRef.current.topLeft}, transparent 70%),
                radial-gradient(circle at top right, ${gradientRef.current.topRight}, transparent 70%),
                radial-gradient(circle at bottom left, ${gradientRef.current.bottomLeft}, transparent 70%),
                radial-gradient(circle at bottom right, ${gradientRef.current.bottomRight}, transparent 70%)`;

    return {
      backgroundImage: coverArt
        ? `url("${coverArt}"), ${gradientBackground}`
        : gradientBackground,
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: `rotate(${rotation}deg)`,
      transition: isPauseSnap
        ? "transform 10s ease-out"
        : "transform 0.4s ease-out",
    };
  };

  return { rotation, getDiscStyle, randomizeGradient };
}
