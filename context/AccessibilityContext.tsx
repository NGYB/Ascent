'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  isColorblindMode: boolean;
  toggleColorblindMode: () => void;
  setColorblindMode: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isColorblindMode, setIsColorblindMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('ascent_colorblind_mode');
      if (saved === 'true') {
        setIsColorblindMode(true);
        document.documentElement.classList.add('colorblind-mode');
      }
    } catch {}
  }, []);

  const toggleColorblindMode = () => {
    setIsColorblindMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ascent_colorblind_mode', String(next));
      } catch {}

      if (next) {
        document.documentElement.classList.add('colorblind-mode');
      } else {
        document.documentElement.classList.remove('colorblind-mode');
      }

      window.dispatchEvent(new CustomEvent('ascent-a11y-change', { detail: { colorblind: next } }));
      return next;
    });
  };

  const setColorblindMode = (enabled: boolean) => {
    setIsColorblindMode(enabled);
    try {
      localStorage.setItem('ascent_colorblind_mode', String(enabled));
    } catch {}

    if (enabled) {
      document.documentElement.classList.add('colorblind-mode');
    } else {
      document.documentElement.classList.remove('colorblind-mode');
    }

    window.dispatchEvent(new CustomEvent('ascent-a11y-change', { detail: { colorblind: enabled } }));
  };

  return (
    <AccessibilityContext.Provider value={{ isColorblindMode, toggleColorblindMode, setColorblindMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Fallback if accessed outside provider
    return {
      isColorblindMode: false,
      toggleColorblindMode: () => {},
      setColorblindMode: () => {}
    };
  }
  return context;
}
