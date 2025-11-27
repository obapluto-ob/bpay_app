import { useEffect, useState } from 'react';

export const useDeviceTheme = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile,
    classes: {
      container: isMobile ? 'px-4 py-6' : 'px-8 py-12',
      card: isMobile ? 'p-6 rounded-xl' : 'p-8 rounded-2xl'
    }
  };
};