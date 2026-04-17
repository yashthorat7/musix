import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useMetadata } from '../hooks/useMetadata';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import songQueue from '../utils/songQueue';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const [audioFile, setAudioFile] = useState('');
    const [seekingDirection, setSeekingDirection] = useState(0);
    const [queue, setQueue] = useState([]);
    const audioRef = useRef(null);

    const { metadata, extractMetadata, setMetadata } = useMetadata();
    const {
        isPlaying,
        currentTime,
        duration,
        togglePlay,
        handleSeek,
        handlePrevious,
        handleNext,
        loadAudio,
        resetAudio,
        setIsPlaying,
        setCurrentTime,
        setDuration,
    } = useAudioPlayer(audioRef);

    const loadFile = useCallback(
        async (path) => {
            if (path && path.toLowerCase().endsWith('.mp3')) {
                setAudioFile(path);
                const meta = await extractMetadata(path);
                await loadAudio(path);

                setTimeout(() => {
                    if (audioRef.current) {
                        audioRef.current
                            .play()
                            .catch(() => {});
                        setIsPlaying(true);
                    }
                }, 300);

                return meta;
            }
        },
        [extractMetadata, loadAudio, setIsPlaying],
    );

    const processSongs = useCallback(
        async (paths) => {
            if (!paths || !Array.isArray(paths) || paths.length === 0) return;

            const songsWithMetadata = [];

            try {
                for (const path of paths) {
                    if (typeof path === 'string' && path.toLowerCase().endsWith('.mp3')) {
                        try {
                            const metadata = await extractMetadata(path);
                            if (metadata) {
                                songsWithMetadata.push({
                                    path,
                                    metadata,
                                    fileName: path.split(/[/\\]/).pop(),
                                });
                            }
                        } catch (err) {
                        }
                    }
                }

                if (songsWithMetadata.length > 0) {
                    const wasQueueEmpty = songQueue.getQueue().length === 0;
                    songQueue.appendSongs(songsWithMetadata);
                    setQueue(songQueue.getQueue());

                    if (wasQueueEmpty || (!isPlaying && audioFile === '')) {
                        const currentSong = songQueue.getCurrentSong();
                        if (currentSong) {
                            await loadFile(currentSong.path);
                        }
                    }
                }
            } catch (error) {
            }
        },
        [extractMetadata, loadFile, isPlaying, audioFile],
    );

    useEffect(() => {
        const handleSongEnd = () => {
            const nextSong = songQueue.nextSong();
            if (nextSong) {
                loadFile(nextSong.path);
            }
        };

        if (audioRef.current) {
            audioRef.current.addEventListener('ended', handleSongEnd);
            return () => audioRef.current?.removeEventListener('ended', handleSongEnd);
        }
    }, [loadFile]);

    const handleNextSong = useCallback(() => {
        const nextSong = songQueue.nextSong();
        if (nextSong) {
            loadFile(nextSong.path);
        }
    }, [loadFile]);

    const handlePreviousSong = useCallback(() => {
        const prevSong = songQueue.previousSong();
        if (prevSong) {
            loadFile(prevSong.path);
        }
    }, [loadFile]);

    const value = {
        audioRef,
        audioFile,
        metadata,
        isPlaying,
        currentTime,
        duration,
        loadFile,
        processSongs,
        togglePlay,
        handleSeek,
        handlePrevious: handlePreviousSong,
        handleNext: handleNextSong,
        fileName: audioFile ? audioFile.split(/[/\\]/).pop() : null,
        seekingDirection,
        queue: songQueue.getQueue(),
        clearQueue: () => {
            songQueue.clearQueue();
            setQueue(songQueue.getQueue());
            resetAudio();
            setAudioFile('');
            setMetadata(null);
        },
        shuffleQueue: () => {
            songQueue.shuffleQueue();
            setQueue(songQueue.getQueue());
        },
        removeSong: (index) => {
            const isRemovingCurrent = index === 0;
            songQueue.removeSong(index);
            const newQueue = songQueue.getQueue();
            setQueue(newQueue);

            if (newQueue.length === 0) {
                resetAudio();
                setAudioFile('');
                setMetadata(null);
            } else if (isRemovingCurrent) {
                const nextSong = songQueue.getCurrentSong();
                if (nextSong) {
                    loadFile(nextSong.path);
                }
            }
        },
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
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
}
