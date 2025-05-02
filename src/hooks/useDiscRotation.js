import { useEffect, useState, useRef } from 'react';

const gradientVariants = [
    {
        topLeft: '#8400ff',
        topRight: '#0026ff',
        bottomLeft: '#ff000d',
        bottomRight: '#ff39e5',
    },
    {
        topLeft: '#00ff88',
        topRight: '#00b7ff',
        bottomLeft: '#ff7b00',
        bottomRight: '#ff00d4',
    },
    {
        topLeft: '#7400ff',
        topRight: '#ff0000',
        bottomLeft: '#00ff95',
        bottomRight: '#4c00ff',
    },
    {
        topLeft: '#ff0080',
        topRight: '#7700ff',
        bottomLeft: '#00ffd5',
        bottomRight: '#ff6f00',
    },
];

export function useDiscRotation(currentTime, isPlaying, isSeeking, coverArt) {
    const [rotation, setRotation] = useState(0);
    const [isPauseSnap, setIsPauseSnap] = useState(false);
    const gradientRef = useRef(
        gradientVariants[Math.floor(Math.random() * gradientVariants.length)],
    );

    const randomizeGradient = () => {
        gradientRef.current = gradientVariants[Math.floor(Math.random() * gradientVariants.length)];
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
                ? `url(${coverArt}), ${gradientBackground}`
                : gradientBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `rotate(${rotation}deg)`,
            transition: isPauseSnap ? 'transform 10s ease-out' : 'transform 0.4s ease-out',
        };
    };

    return { rotation, getDiscStyle, randomizeGradient };
}
