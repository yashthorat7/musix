import { useState } from 'react';

export const useSidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return { 
        isSidebarOpen, 
        setIsSidebarOpen 
    };
};
