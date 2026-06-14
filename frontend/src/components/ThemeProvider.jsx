import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settings';

export const ThemeProvider = ({ children }) => {
  const theme = useSettingsStore((state) => state.theme);
  const prevThemeRef = useRef(theme);

  useEffect(() => {
    const body = document.body;
    
    // Check if theme actually changed
    if (prevThemeRef.current !== theme) {
      // Trigger a 200ms cross-fade overlay to prevent harsh flashes
      const overlay = document.createElement('div');
      overlay.className = 'theme-crossfade';
      body.appendChild(overlay);
      
      setTimeout(() => {
        overlay.remove();
      }, 200);
    }
    
    // Remove existing theme classes
    body.classList.remove('theme-amoled', 'theme-dim');
    
    // Add new theme class if not default dark
    if (theme === 'amoled') {
      body.classList.add('theme-amoled');
    } else if (theme === 'dim') {
      body.classList.add('theme-dim');
    }
    
    prevThemeRef.current = theme;
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
