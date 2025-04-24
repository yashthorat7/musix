import { useState, useEffect } from 'react';
import { moveWindow, Position } from '@tauri-apps/plugin-positioner';
import './App.css';
import Splash from './components/Splash';
import Disc from './components/Disc';

moveWindow(Position.BottomRight);

function App() {
    const [isSplash, setIsSplash] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSplash(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="container">
            {isSplash ? <Splash /> : <Disc filePath="" />}
        </main>
    );
}

export default App;
