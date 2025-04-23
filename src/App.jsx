import { useState, useEffect, useCallback } from 'react';
import { moveWindow, Position } from '@tauri-apps/plugin-positioner';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import './App.css';
import Splash from './components/Splash';
import Player from './components/Player';

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

moveWindow(Position.BottomRight);

function App() {
    const [isSplash, setIsSplash] = useState(true);
    const [droppedFile, setDroppedFile] = useState('');

    useFileDrop((path) => {
        if (path.toLowerCase().endsWith('.mp3')) {
            setDroppedFile(path);
        }
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSplash(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="container">
            {isSplash ? <Splash /> : <Player filePath={droppedFile} />}
        </main>
    );
}

export default App;
