import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useMetadata } from '../hooks/useMetadata';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const [audioFile, setAudioFile] = useState('');
    const [seekingDirection, setSeekingDirection] = useState(0);
    const audioRef = useRef(null);

    const { metadata, extractMetadata } = useMetadata();
    const {
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
    } = useAudioPlayer(audioRef);

    const loadFile = useCallback(
        async (path) => {
            if (path && path.toLowerCase().endsWith('.mp3')) {
                setAudioFile(path);
                await extractMetadata(path);
                await loadAudio(path);

                setTimeout(() => {
                    if (audioRef.current) {
                        audioRef.current.play().catch((error) => {
                            console.error('Error auto-playing file:', error);
                        });
                        setIsPlaying(true);
                    }
                }, 300);
            }
        },
        [extractMetadata, loadAudio, setIsPlaying],
    );

    const value = {
        audioRef,
        audioFile,
        metadata,
        isPlaying,
        currentTime,
        duration,
        loadFile,
        togglePlay,
        handleSeek,
        handlePrevious,
        handleNext,
        fileName: audioFile ? audioFile.split(/[/\\]/).pop() : null,
        seekingDirection,
    };

    return (
        <AudioContext.Provider value={value}>
            <audio ref={audioRef} />
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
