import React, { useEffect, useRef } from 'react';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import styles from './Miniview.module.css';
import MiniDisc from './MiniDisc';
import MiniProgressBar from './MiniProgressBar';
import { useAudio } from '../../context/AudioContext';

function Miniview({ onRestore }) {
    const { metadata } = useAudio();
    const isSettingSize = useRef(false);

    useEffect(() => {
        const setMiniviewSize = async () => {
            if (isSettingSize.current) return;
            isSettingSize.current = true;
            try {
                const win = getCurrentWindow();
                await win.setSize(new LogicalSize(96, 96));
                await invoke('reposition_window');
            } finally {
                isSettingSize.current = false;
            }
        };
        setMiniviewSize();
        return () => {
            const restoreSize = async () => {
                if (isSettingSize.current) return;
                isSettingSize.current = true;
                try {
                    const win = getCurrentWindow();
                    await win.setSize(new LogicalSize(256, 256));
                    await invoke('reposition_window');
                } finally {
                    isSettingSize.current = false;
                }
            };
            restoreSize();
        };
    }, []);

    const handleRestore = async () => {
        if (isSettingSize.current) return;
        isSettingSize.current = true;
        try {
            const win = getCurrentWindow();
            await win.setSize(new LogicalSize(256, 256));
            await invoke('reposition_window');
            if (onRestore) onRestore();
        } finally {
            isSettingSize.current = false;
        }
    };

    return (
        <div className={styles.container} onClick={handleRestore}>
            <MiniDisc coverArt={metadata?.cover_art} />
            <MiniProgressBar />
        </div>
    );
}

export default Miniview;
