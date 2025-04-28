import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize, PhysicalPosition } from '@tauri-apps/api/window';
import styles from './Minimizer.module.css';

function Minimizer() {
    async function handleClick() {
        const currentWindow = getCurrentWindow();
        const currentSize = await currentWindow.innerSize();

        if (currentSize.width !== 96 || currentSize.height !== 96) {
            await currentWindow.setSize(new LogicalSize(96, 96));
        } else {
            const originalWidth = 256;
            const originalHeight = 256;
            await currentWindow.setSize(new LogicalSize(originalWidth, originalHeight));

            const currentPosition = await currentWindow.outerPosition();
            const newX = currentPosition.x + 160;
            const newY = currentPosition.y + 160;
            await currentWindow.setPosition(new PhysicalPosition(newX, newY));
        }
    }

    return (
        <button className={styles.container} onClick={handleClick}>
            <img src="icons/minimizer.svg" alt="Minimize" />
        </button>
    );
}

export default Minimizer;
