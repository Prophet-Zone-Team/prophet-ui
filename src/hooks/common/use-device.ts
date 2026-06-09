import { useState, useEffect } from 'react';

/**
 * React Hook to determine if the current device is a mobile device.
 * @param breakpoint Custom breakpoint width, default is 768px (commonly mobile/tablet threshold)
 * @returns boolean - whether it's mobile
 */
export const useDevice = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    // Ensure running on client-side environment
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    // Handler for modern browsers' media query change event
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Sync initial state
    setIsMobile(mediaQuery.matches);

    // Use standard addEventListener instead of addListener
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, [breakpoint]);

  return isMobile;
};
