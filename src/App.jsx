import Player from './components/Player/Player';
import Splash from './components/Splash/Splash';
import Sidebar from './components/Sidebar/SideBar';
import Directory from './components/Directory/Directory';
import Equalizer from './components/Equalizer/Equalizer';
import Miniview from './components/Miniview/Miniview';
import './App.css';
import { useSidebar } from './hooks/useSidebar';
import { useState } from 'react';
import { useAudio } from './context/AudioContext';

function App() {
    const { isSidebarOpen, containerRef } = useSidebar();
    const [activePanel, setActivePanel] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { queue, removeSong, clearQueue, shuffleQueue } = useAudio();
    const [isMiniview, setIsMiniview] = useState(false);

    const handleRemoveSong = (index) => {
        removeSong(index);
    };

    const handleShowMiniview = () => setIsMiniview(true);
    const handleRestoreMain = () => setIsMiniview(false);

    return (
        <main className="container" ref={containerRef}>
            <Splash>
                <Player onMinimize={handleShowMiniview} />
                <Directory
                    isOpen={(isSidebarOpen || sidebarOpen) && activePanel === 'directory'}
                    songs={queue}
                    onRemove={handleRemoveSong}
                    onClear={clearQueue}
                    onShuffle={shuffleQueue}
                />
                <Equalizer
                    isOpen={(isSidebarOpen || sidebarOpen) && activePanel === 'equalizer'}
                    onClear={clearQueue}
                    onShuffle={shuffleQueue}
                />
                <Sidebar
                    isOpen={isSidebarOpen || sidebarOpen}
                    onPanelChange={setActivePanel}
                    activePanel={activePanel}
                    setSidebarOpen={setSidebarOpen}
                />
                {isMiniview && <Miniview onRestore={handleRestoreMain} />}
            </Splash>
        </main>
    );
}

export default App;
