import { useEffect, useRef } from "react";

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

const SECONDS_PER_REV = 20;

export function useDiscRotation(
  currentTime,
  isPlaying,
  isSeeking,
  coverArt,
  discRef,
) {
  const gradientRef = useRef(
    gradientVariants[Math.floor(Math.random() * gradientVariants.length)],
  );

  const rotRef = useRef(((Number(currentTime) || 0) / SECONDS_PER_REV) * 360);
  const baseTimeRef = useRef(Number(currentTime) || 0);
  const baseStampRef = useRef(performance.now());

  const randomizeGradient = () => {
    gradientRef.current =
      gradientVariants[Math.floor(Math.random() * gradientVariants.length)];
  };

  useEffect(() => {
    randomizeGradient();
  }, [coverArt]);

  useEffect(() => {
    const time = Number(currentTime) || 0;
    baseTimeRef.current = time;
    baseStampRef.current = performance.now();
    const rot = (time / SECONDS_PER_REV) * 360;
    rotRef.current = rot;
    if (discRef?.current) {
      discRef.current.style.transform = `rotate(${rot}deg)`;
    }
  }, [currentTime, discRef]);

  useEffect(() => {
    if (!isPlaying || isSeeking) {
      if (discRef?.current) {
        discRef.current.style.transform = `rotate(${rotRef.current}deg)`;
      }
      return;
    }

    baseTimeRef.current = Number(currentTime) || 0;
    baseStampRef.current = performance.now();
    let animId;

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - baseStampRef.current) / 1000;
      const estimatedTime = baseTimeRef.current + elapsed;
      const rot = (estimatedTime / SECONDS_PER_REV) * 360;
      rotRef.current = rot;
      if (discRef?.current) {
        discRef.current.style.transform = `rotate(${rot}deg)`;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isSeeking, discRef]);

  const getDiscStyle = (customCover) => {
    const activeCover = customCover || coverArt;
    const gradientBackground = `radial-gradient(circle at top left, ${gradientRef.current.topLeft}, transparent 70%),
                radial-gradient(circle at top right, ${gradientRef.current.topRight}, transparent 70%),
                radial-gradient(circle at bottom left, ${gradientRef.current.bottomLeft}, transparent 70%),
                radial-gradient(circle at bottom right, ${gradientRef.current.bottomRight}, transparent 70%)`;

    return {
      backgroundImage: activeCover
        ? `url("${activeCover}"), ${gradientBackground}`
        : gradientBackground,
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: `rotate(${rotRef.current}deg)`,
      willChange: "transform",
    };
  };

  return { rotation: rotRef.current, getDiscStyle, randomizeGradient };
}
