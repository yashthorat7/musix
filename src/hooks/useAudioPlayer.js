import { useState, useCallback, useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

export function useAudioPlayer(audioRef) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const clickTimeoutRef = useRef(null);

    const loadAudio = useCallback(
        async (path) => {
            try {
                const fileUrl = convertFileSrc(path);
                if (audioRef.current) {
                    audioRef.current.src = fileUrl;
                    audioRef.current.volume = 0.5;
                    audioRef.current.load();
                    audioRef.current.onloadedmetadata = () => {
                        setDuration(audioRef.current.duration);
                    };
                }
            } catch (error) {
                console.error('Error loading audio:', error);
            }
        },
        [audioRef],
    );

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise) {
                playPromise.catch((error) => console.error('Error playing audio:', error));
            }
        }

        setIsPlaying(!isPlaying);
    }, [isPlaying, audioRef]);

    const handleSeek = useCallback(
        (time) => {
            if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
            }
        },
        [audioRef],
    );

    const handlePrevious = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
        }
    }, [audioRef]);

    const handleNext = useCallback(() => {
        if (audioRef.current && duration) {
            audioRef.current.currentTime = duration - 5;
            setCurrentTime(duration - 5);
        }
    }, [audioRef, duration]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.5;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioRef, setCurrentTime, setIsPlaying]);

    return {
        isPlaying,
        currentTime,
        duration,
        togglePlay,
        handleSeek,
        handlePrevious,
        handleNext,
        loadAudio,
        setIsPlaying,
        setCurrentTime,
        setDuration,
    };
}
