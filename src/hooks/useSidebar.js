import { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export const useSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const containerRef = useRef(null);
    const lastMousePosition = useRef({ clientX: 0, clientY: 0 });
    const timeoutIdRef = useRef(null);
    const samePositionCounter = useRef(0);

    useEffect(() => {
        const currentWindow = getCurrentWindow();

        const checkHover = async (event) => {
            try {
                const [windowPosition, windowSize] = await Promise.all([
                    currentWindow.outerPosition(),
                    currentWindow.innerSize(),
                ]);

                const { clientX, clientY } = event || lastMousePosition.current;

                let isOutside =
                    clientX < 4 ||
                    clientX > windowSize.width - 16 ||
                    clientY < 16 ||
                    clientY > windowSize.height - 6;

                if (
                    clientX === lastMousePosition.current.clientX &&
                    clientY === lastMousePosition.current.clientY
                ) {
                    samePositionCounter.current++;
                    if (samePositionCounter.current >= 20) {
                        isOutside = true;
                    }
                } else {
                    samePositionCounter.current = 0;
                }

                const shouldOpen = !isOutside;

                if (timeoutIdRef.current) {
                    clearTimeout(timeoutIdRef.current);
                }

                if (shouldOpen) {
                    setIsSidebarOpen(true);
                } else {
                    timeoutIdRef.current = setTimeout(() => {
                        setIsSidebarOpen(false);
                    }, 100);
                }
            } catch (error) {
                console.error('Error checking hover state:', error);
            }
        };

        const handleMouseMove = (event) => {
            lastMousePosition.current = { clientX: event.clientX, clientY: event.clientY };
            checkHover(event);
        };

        if (containerRef.current) {
            containerRef.current.addEventListener('mousemove', handleMouseMove);
        }

        const intervalId = setInterval(() => {
            checkHover(lastMousePosition.current);
        }, 100);

        return () => {
            if (containerRef.current) {
                containerRef.current.removeEventListener('mousemove', handleMouseMove);
            }
            clearInterval(intervalId);
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, []);

    return { isSidebarOpen, containerRef };
};
