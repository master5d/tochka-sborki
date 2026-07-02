"use client";

import { useState, useEffect } from 'react';

export interface UseScrollTriggerOptions {
  threshold?: number;
  window?: Window;
}

export function useScrollTrigger(options: UseScrollTriggerOptions = {}): boolean {
  const { threshold = 100, window: targetWindow = typeof window !== 'undefined' ? window : undefined } = options;
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    if (!targetWindow) return;

    const handleScroll = () => {
      setTrigger(targetWindow.scrollY > threshold);
    };

    handleScroll(); // Init
    targetWindow.addEventListener('scroll', handleScroll, { passive: true });
    return () => targetWindow.removeEventListener('scroll', handleScroll);
  }, [targetWindow, threshold]);

  return trigger;
}
