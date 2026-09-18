import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTouch: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTouch: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1200,
      };
    }

    const width = window.innerWidth;
    const isTouch =
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      false;
    const userAgent = navigator.userAgent || '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);

    const isMobile = width < 768 || (isMobileUA && width < 900);
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = !isMobile && !isTablet;

    return {
      isMobile,
      isTouch,
      isTablet,
      isDesktop,
      screenWidth: width,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const isTouch =
        'ontouchstart' in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        false;
      const userAgent = navigator.userAgent || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(userAgent);

      const isMobile = width < 768 || (isMobileUA && width < 900);
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = !isMobile && !isTablet;

      setDeviceInfo({
        isMobile,
        isTouch,
        isTablet,
        isDesktop,
        screenWidth: width,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}
