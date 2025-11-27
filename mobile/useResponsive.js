import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useResponsive = () => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);
  
  const isDesktop = screenData.width >= 768;
  const isTablet = screenData.width >= 600 && screenData.width < 768;
  const isMobile = screenData.width < 600;
  
  return {
    ...screenData,
    isDesktop,
    isTablet,
    isMobile,
    isLargeScreen: isDesktop || isTablet
  };
};