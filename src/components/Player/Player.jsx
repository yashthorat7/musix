import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './Player.module.css';
import Title from './Title';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
import Hand from './Hand';
import Controller from './Controller';
import Disc from './Disc';
import Minimizer from '../Sidebar/Minimizer';
import { convertFileSrc } from '@tauri-apps/api/core';

function useFileDrop(onFileDrop) {
    const handleDrop = useCallback(
        (event) => {
            if (event.payload.type === 'drop' && event.payload.paths.length > 0) {
                onFileDrop(event.payload.paths[0]);
            }
        },
        [onFileDrop],
    );

    useEffect(() => {
        const window = WebviewWindow.getCurrent();
        const unlisten = window.onDragDropEvent(handleDrop);
        return () => {
            unlisten.then((f) => f());
        };
    }, [handleDrop]);
}

function Player({ filePath: initialFilePath }) {
    const [droppedFile, setDroppedFile] = useState(initialFilePath || '');
    const [metadata, setMetadata] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDiscReady, setIsDiscReady] = useState(false);
    const audioRef = useRef(null);
    const clickTimeoutRef = useRef(null);
    const filePath = droppedFile || initialFilePath;
    const fileName = filePath ? filePath.split(/[/\\]/).pop() : null;

    const extractMetadata = async (path) => {
        try {
            const metadata = await invoke('extract_metadata', { filepath: path });
            console.log('Extracted Metadata:', metadata);
            setMetadata(metadata);
            return metadata;
        } catch (error) {
            console.error('Error extracting metadata:', error);
            return null;
        }
    };

    const loadAudio = async (path) => {
        try {
            const fileUrl = convertFileSrc(path);
            console.log('Loading audio from URL:', fileUrl);

            if (audioRef.current) {
                audioRef.current.src = fileUrl;
                audioRef.current.load();

                audioRef.current.onloadedmetadata = () => {
                    console.log('Audio metadata loaded, duration:', audioRef.current.duration);
                    setDuration(audioRef.current.duration);
                    setIsDiscReady(true);
                };

                audioRef.current.oncanplaythrough = () => {
                    console.log('Audio can play through');
                };
            }
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    };

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !isDiscReady) return;
        
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise) {
                playPromise.catch((err) => {
                    console.error('Error playing audio:', err);
                });
            }
        }
        
        setIsPlaying(!isPlaying);

    }, [isPlaying, isDiscReady]);

    const handleSeek = (time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handlePrevious = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
        }
    };

    const handleNext = () => {
        if (audioRef.current && duration) {
            audioRef.current.currentTime = duration - 5;
            setCurrentTime(duration - 5);
        }
    };

    useFileDrop((path) => {
        if (path.toLowerCase().endsWith('.mp3')) {
            setDroppedFile(path);
            setIsDiscReady(false);
            
            extractMetadata(path).then(() => {
                loadAudio(path).then(() => {
                    setTimeout(() => {
                        if (audioRef.current && isDiscReady) {
                            audioRef.current.play().catch(err => {
                                console.error('Error auto-playing dropped file:', err);
                            });
                            setIsPlaying(true);
                        }
                    }, 300);
                });
            });
        }
    });

    useEffect(() => {
        const handleDragOver = () => setIsDragging(true);
        const handleDragLeave = () => setIsDragging(false);
        const handleDrop = () => setIsDragging(false);

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    useEffect(() => {
        if (initialFilePath) {
            setIsDiscReady(false);
            extractMetadata(initialFilePath).then(() => {
                loadAudio(initialFilePath);
            });
        }
    }, [initialFilePath]);

    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
        };

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
    }, []);

    useEffect(() => {
        if (isDiscReady && droppedFile && audioRef.current) {
            audioRef.current.play().catch(err => {
                console.error('Error auto-playing after disc ready:', err);
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    }, [isDiscReady, droppedFile]);

    const handleClose = () => {
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <Minimizer />
            <audio ref={audioRef} />
            <Title text={metadata?.title || fileName} />
            <Disc 
                coverArt={metadata?.cover_art} 
                isPlaying={isPlaying} 
                onTogglePlay={togglePlay} 
            />
            <Hand onClose={handleClose} />
            <Controller
                metadata={metadata}
                currentTime={currentTime}
                duration={duration || metadata?.duration || 0}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onSeek={handleSeek}
                onPrevious={handlePrevious}
                onNext={handleNext}
            />
        </div>
    );
}

export default Player;
