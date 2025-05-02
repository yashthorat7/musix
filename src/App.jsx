import Player from './components/Player/Player';
import { AudioProvider } from './context/AudioContext';
import Splash from './components/Splash/Splash';
import Sidebar from './components/Sidebar/SideBar';
import Directory from './components/Directory/Directory';
import Equalizer from './components/Equalizer/Equalizer';
import './App.css';
import { useSidebar } from './hooks/useSidebar';
import { useState } from 'react';

function App() {
    const { isSidebarOpen, containerRef } = useSidebar();
    const [activePanel, setActivePanel] = useState(null);
    const [queue, setQueue] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleRemoveSong = (index) => {
        setQueue(queue.filter((_, i) => i !== index));
    };

    const handleClearQueue = () => {
        setQueue([]);
    };

    const handleShuffleQueue = () => {
        setQueue([...queue].sort(() => Math.random() - 0.5));
    };

    return (
        <AudioProvider>
            <main className="container" ref={containerRef}>
                <Splash>
                    <Player />
                    <Directory
                        isOpen={(isSidebarOpen || sidebarOpen) && activePanel === 'directory'}
                        songs={queue}
                        onRemove={handleRemoveSong}
                        onClear={handleClearQueue}
                        onShuffle={handleShuffleQueue}
                    />
                    <Equalizer
                        isOpen={(isSidebarOpen || sidebarOpen) && activePanel === 'equalizer'}
                        onClear={handleClearQueue}
                        onShuffle={handleShuffleQueue}
                    />
                    <Sidebar
                        isOpen={isSidebarOpen || sidebarOpen}
                        onPanelChange={setActivePanel}
                        activePanel={activePanel}
                        setSidebarOpen={setSidebarOpen}
                    />
                </Splash>
            </main>
        </AudioProvider>
    );
}

export default App;
